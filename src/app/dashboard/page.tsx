'use client';
import React, { useEffect, useState } from 'react';
import { usersApi, groupsApi, lessonsApi, coursesApi, giftsApi } from '@/lib/api';
import { Users, GraduationCap, BookOpen, Layers, Gift } from 'lucide-react';

export default function DashboardStatsPage() {
  const [stats, setStats] = useState({
    usersCount: 0,
    groupsCount: 0,
    lessonsCount: 0,
    coursesCount: 0,
    giftsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const [u, g, l, c, gif] = await Promise.all([
        usersApi.getAll(),
        groupsApi.getAll(),
        lessonsApi.getAll(),
        coursesApi.getAll(),
        giftsApi.getAll(),
      ]);

      setStats({
        usersCount: u.data?.length || 0,
        groupsCount: g.data?.length || 0,
        lessonsCount: l.data?.length || 0,
        coursesCount: c.data?.length || 0,
        giftsCount: gif.data?.length || 0,
      });
      setLoading(false);
    }
    loadStats();
  }, []);

  const cards = [
    { title: 'Foydalanuvchilar', count: stats.usersCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Faol Guruhlar', count: stats.groupsCount, icon: GraduationCap, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Darslar soni', count: stats.lessonsCount, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Mavjud Kurslar', count: stats.coursesCount, icon: Layers, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Sovg\'alar turi', count: stats.giftsCount, icon: Gift, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Umumiy ko'rsatkichlar</h1>
        <p className="text-sm text-zinc-500 mt-1">O'quv markazining umumiy statistik holati</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{card.title}</span>
                <div className="text-3xl font-extrabold text-zinc-900 mt-1.5">
                  {loading ? <div className="h-8 w-16 bg-zinc-100 animate-pulse rounded-lg" /> : card.count}
                </div>
              </div>
              <div className={`p-3.5 rounded-2xl ${card.bg} ${card.color}`}>
                <Icon className="w-6 h-6 stroke-[1.75]" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}