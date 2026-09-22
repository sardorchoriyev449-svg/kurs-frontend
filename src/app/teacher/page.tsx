'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { groupsApi, coursesApi } from '@/lib/api';
import { Group, Course } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { GraduationCap, Users, Clock, ArrowRight } from 'lucide-react';

export default function TeacherDashboardPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeacherData() {
      try {
        const [grpRes, crsRes] = await Promise.all([
          groupsApi.getMine(),
          coursesApi.getAll(), // /course barcha uchun ochiq
        ]);

        if (grpRes.success && grpRes.data) {
          setGroups(grpRes.data);
        }
        if (crsRes.success && crsRes.data) {
          setCourses(crsRes.data);
        }
      } catch (err) {
        console.error("Guruhlarni yuklashda xatolik:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTeacherData();
  }, []);

  // Kurs nomini aniqlash (Xom ObjectId chiqishini oldini oladi)
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
    <div className="space-y-6">
      {/* Sarlavha qismi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Mening guruhlarim</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Siz dars o'tadigan faol o'quv guruhlari ro'yxati</p>
        </div>
        {!loading && groups.length > 0 && (
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 self-start sm:self-auto">
            Jami: {groups.length} ta guruh
          </span>
        )}
      </div>

      {/* Yuklanish holati (Skeleton) */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Biriktirilgan guruhlar yo'q"
          description="Sizga hali birorta guruh dars berish uchun biriktirilmagan. Administrator sizni guruhga biriktirishi kutilmoqda."
        />
      ) : (
        /* Guruh kartalari */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group) => (
            <div
              key={group._id}
              className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                    {getCourseName(group.course_id)}
                  </span>
                  <span className="text-xs font-mono text-zinc-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    {group.lesson_time || '00:00'}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-zinc-900 group-hover:text-indigo-600 transition-colors">
                  {group.name}
                </h3>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
                  <Users className="w-4 h-4 text-zinc-400" />
                  <span>O'quvchilar soni: {group.students?.length || 0} ta</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
                <span className="text-xs text-zinc-400 truncate max-w-[150px]">
                  {Array.isArray(group.lesson_days) && group.lesson_days.length > 0
                    ? group.lesson_days.join(', ')
                    : 'Kunlar belgilanmagan'}
                </span>

                <Link
                  href={`/teacher/groups/${group._id}`}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  Dars & Vazifalar <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}