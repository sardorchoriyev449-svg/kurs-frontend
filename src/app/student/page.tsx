'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { groupsApi, coinsApi, homeworkApi, coursesApi } from '@/lib/api';
import { Group, Homework, Course, User } from '@/types';
import { Coins, BookOpen, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export default function StudentDashboard() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coinBalance, setCoinBalance] = useState<number>(0);
  const [pendingHomeworks, setPendingHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [grpRes, coinRes, hmwRes, crsRes] = await Promise.all([
          groupsApi.getMine(),
          coinsApi.getMe(),
          homeworkApi.getMe(),
          coursesApi.getAll(), // /course barcha uchun ochiq
        ]);

        if (grpRes.success && grpRes.data) setGroups(grpRes.data);
        if (coinRes.success && coinRes.balance !== undefined) setCoinBalance(coinRes.balance);
        if (hmwRes.success && hmwRes.data) {
          setPendingHomeworks(hmwRes.data.filter((h) => h.status === 'pending'));
        }
        if (crsRes.success && crsRes.data) setCourses(crsRes.data);
      } catch (err) {
        console.error("Ma'lumotlarni yuklashda xatolik:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // O'qituvchi ismini chiroyli formatlash (Xom ID chiqishini oldini oladi)
  const getTeacherName = (teacher: unknown): string => {
    if (!teacher) return 'Biriktirilmagan';

    if (typeof teacher === 'object' && teacher !== null) {
      const t = teacher as Partial<User>;
      if (t.first_name || t.last_name) {
        return `${t.first_name || ''} ${t.last_name || ''}`.trim();
      }
    }

    // Agar backend faqat 24 xonali ObjectId yuborgan bo'lsa, xom ID chiqarmaymiz
    if (typeof teacher === 'string') {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(teacher);
      return isObjectId ? "O'qituvchi biriktirilgan" : teacher;
    }

    return 'Biriktirilmagan';
  };

  // Kurs nomini aniqlash
  const getCourseName = (course: unknown): string => {
    if (!course) return 'Kurs';

    if (typeof course === 'object' && course !== null && 'name' in course) {
      return String((course as Course).name);
    }

    if (typeof course === 'string') {
      const found = courses.find((c) => c._id === course);
      if (found) return found.name;
    }

    return 'Kurs';
  };

  return (
    <div className="space-y-8">
      {/* Sahifa sarlavhasi */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">O'quvchi boshqaruv paneli</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">O'quv jarayoni va yutuqlaringiz statistikasi</p>
      </div>

      {/* Yuqori statistik kartalar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Koinlar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
              Mening Koinlarim
            </span>
            <div className="mt-2 flex items-baseline gap-2">
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <span className="text-3xl font-extrabold text-amber-500 dark:text-amber-400 font-mono">
                  {coinBalance}
                </span>
              )}
              <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">koin</span>
            </div>
            <Link
              href="/student/gifts"
              className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:dark:text-amber-300 font-medium mt-3"
            >
              <Sparkles className="w-3.5 h-3.5" /> Sovg'alar do'koni &rarr;
            </Link>
          </div>
          <div className="p-3.5 bg-amber-50 dark:bg-amber-500/15 text-amber-500 dark:text-amber-400 rounded-2xl">
            <Coins className="w-7 h-7 stroke-[1.75]" />
          </div>
        </div>

        {/* Guruhlar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
              Faol Guruhlarim
            </span>
            <div className="mt-2">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                  {groups.length}
                </span>
              )}
            </div>
            <Link
              href="/student/lessons"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:dark:text-indigo-300 font-medium mt-3"
            >
              Dars materiallari &rarr;
            </Link>
          </div>
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <BookOpen className="w-7 h-7 stroke-[1.75]" />
          </div>
        </div>

        {/* Vazifalar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
              Tekshirilayotgan vazifalar
            </span>
            <div className="mt-2">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 font-mono">
                  {pendingHomeworks.length}
                </span>
              )}
            </div>
            <Link
              href="/student/homework"
              className="inline-flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:dark:text-zinc-50 font-medium mt-3"
            >
              Vazifalar ro'yxati &rarr;
            </Link>
          </div>
          <div className="p-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl">
            <Clock className="w-7 h-7 stroke-[1.75]" />
          </div>
        </div>
      </div>

      {/* Guruhlaringiz ro'yxati */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Biriktirilgan kurslarim</h2>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">Jami: {groups.length} ta guruh</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Siz hali hech qaysi guruhga biriktirilmadingiz"
            description="Administrator sizni tegishli o'quv guruhiga qo'shgandan so'ng bu yerda darslaringiz ko'rinadi."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {groups.map((group) => (
              <div
                key={group._id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-indigo-300 hover:dark:border-indigo-500/40 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                      {getCourseName(group.course_id)}
                    </span>
                    <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {group.lesson_time}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 group-hover:dark:text-indigo-400 transition-colors">
                    {group.name}
                  </h3>

                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
                    O'qituvchi: <span className="font-medium text-zinc-700 dark:text-zinc-300">{getTeacherName(group.teacher)}</span>
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 dark:text-zinc-500">
                    Kunlar: {Array.isArray(group.lesson_days) ? group.lesson_days.join(', ') : 'Belgilanmagan'}
                  </span>
                  <Link
                    href="/student/lessons"
                    className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:dark:text-indigo-300 inline-flex items-center gap-1"
                  >
                    Darslar <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}