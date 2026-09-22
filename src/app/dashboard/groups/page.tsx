'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { groupsApi, coursesApi, usersApi } from '@/lib/api';
import { Group, Course, User } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, Users, Clock, ArrowRight } from 'lucide-react';

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const toast = useToast();

  const [form, setForm] = useState({
    name: '',
    lesson_time: '',
    lesson_days: [] as string[],
    course_id: '',
    teacher: '',
  });

  const loadData = async () => {
    setLoading(true);
    const [gRes, cRes, uRes] = await Promise.all([
      groupsApi.getAll(),
      coursesApi.getAll(),
      usersApi.getAll(),
    ]);

    if (gRes.success && gRes.data) setGroups(gRes.data);
    if (cRes.success && cRes.data) setCourses(cRes.data);
    if (uRes.success && uRes.data) setAllUsers(uRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // O'qituvchi ismini aniqlash (Populate qilingan bo'lsa ham, faqat ID bo'lsa ham)
  const getTeacherName = (teacher: unknown): string => {
    if (!teacher) return 'Biriktirilmagan';

    // Agar backend to'liq obyekt qaytargan bo'lsa
    if (typeof teacher === 'object' && teacher !== null) {
      const t = teacher as Partial<User>;
      if (t.first_name || t.last_name) {
        return `${t.first_name || ''} ${t.last_name || ''}`.trim();
      }
    }

    // Agar backend faqat ID (string) qaytargan bo'lsa
    if (typeof teacher === 'string') {
      const found = allUsers.find((u) => u._id === teacher);
      if (found) {
        return `${found.first_name} ${found.last_name}`.trim();
      }
    }

    return 'Biriktirilmagan';
  };

  // Kurs nomini aniqlash
  const getCourseName = (course: unknown): string => {
    if (!course) return 'Kurs biriktirilmagan';

    if (typeof course === 'object' && course !== null && 'name' in course) {
      return String((course as Course).name);
    }

    if (typeof course === 'string') {
      const found = courses.find((c) => c._id === course);
      if (found) return found.name;
    }

    return 'Kurs';
  };

  const teachers = allUsers.filter((u) => u.role === 'teacher');

  const handleDayToggle = (day: string) => {
    setForm((prev) => ({
      ...prev,
      lesson_days: prev.lesson_days.includes(day)
        ? prev.lesson_days.filter((d) => d !== day)
        : [...prev.lesson_days, day],
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.length < 5) {
      toast.error("Guruh nomi kamida 5 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (!form.course_id) {
      toast.error('Kursni tanlang');
      return;
    }
    if (form.lesson_days.length === 0) {
      toast.error('Kamida bitta dars kunini tanlang');
      return;
    }

    const res = await groupsApi.create({
      name: form.name,
      lesson_time: form.lesson_time,
      lesson_days: form.lesson_days,
      course_id: form.course_id,
      teacher: form.teacher || undefined,
    });

    if (res.success) {
      toast.success('Yangi guruh yaratildi');
      setIsOpen(false);
      setForm({ name: '', lesson_time: '', lesson_days: [], course_id: '', teacher: '' });
      loadData();
    } else {
      toast.error(res.message || "Guruh yaratishda xatolik");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Guruhlar</h1>
          <p className="text-sm text-zinc-500">Mavjud barcha o'quv guruhlari</p>
        </div>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Guruh qo'shish
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {groups.map((grp) => (
          <div
            key={grp._id}
            className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                  {getCourseName(grp.course_id)}
                </span>
                <span className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" /> {grp.lesson_time}
                </span>
              </div>
              <h3 className="text-base font-bold text-zinc-900">{grp.name}</h3>
              <p className="text-xs text-zinc-500 mt-1">
                O'qituvchi: <span className="font-medium text-zinc-700">{getTeacherName(grp.teacher)}</span>
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500">
                <Users className="w-4 h-4 text-zinc-400" />
                <span>O'quvchilar: {grp.students?.length || 0} ta</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-xs text-zinc-400">
                {Array.isArray(grp.lesson_days) ? grp.lesson_days.join(', ') : ''}
              </span>
              <Link
                href={`/dashboard/groups/${grp._id}`}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                Boshqarish <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Yangi guruh yaratish">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Guruh nomi (min 5)</label>
            <input
              required
              minLength={5}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Masalan: Frontend 24"
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Kurs</label>
            <select
              required
              value={form.course_id}
              onChange={(e) => setForm({ ...form, course_id: e.target.value })}
              className="w-full text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2"
            >
              <option value="">Kursni tanlang</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">O'qituvchi</label>
            <select
              value={form.teacher}
              onChange={(e) => setForm({ ...form, teacher: e.target.value })}
              className="w-full text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2"
            >
              <option value="">O'qituvchini biriktirish (ixtiyoriy)</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>{t.first_name} {t.last_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Dars vaqti</label>
            <input
              required
              value={form.lesson_time}
              onChange={(e) => setForm({ ...form, lesson_time: e.target.value })}
              placeholder="14:00 - 16:00"
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1.5">Dars kunlari</label>
            <div className="flex flex-wrap gap-2">
              {['Du', 'Se', 'Chor', 'Pay', 'Ju', 'Sha', 'Yak'].map((d) => {
                const active = form.lesson_days.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDayToggle(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      active ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <Button type="submit" className="w-full mt-2">Yaratish</Button>
        </form>
      </Modal>
    </div>
  );
}