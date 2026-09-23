'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { usersApi, groupsApi, lessonsApi, coursesApi, giftsApi } from '@/lib/api';
import { User } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { Users, GraduationCap, BookOpen, Layers, Gift } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

export default function DashboardStatsPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [stats, setStats] = useState({
    usersCount: 0,
    groupsCount: 0,
    lessonsCount: 0,
    coursesCount: 0,
    giftsCount: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
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
      setUsers(u.data || []);
      setLoading(false);
    }
    loadStats();
  }, []);

  const cards = [
    { title: 'Foydalanuvchilar', count: stats.usersCount, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/15' },
    { title: 'Faol Guruhlar', count: stats.groupsCount, icon: GraduationCap, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-500/15' },
    { title: 'Darslar soni', count: stats.lessonsCount, icon: BookOpen, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/15' },
    { title: 'Mavjud Kurslar', count: stats.coursesCount, icon: Layers, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/15' },
    { title: 'Sovg\'alar turi', count: stats.giftsCount, icon: Gift, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/15' },
  ];

  // Kategoriyalar bo'yicha taqsimot (bitta ranguacha - magnitude solishtiruvi)
  const categoryData = [
    { name: 'Foydalanuvchilar', value: stats.usersCount },
    { name: 'Guruhlar', value: stats.groupsCount },
    { name: 'Darslar', value: stats.lessonsCount },
    { name: 'Kurslar', value: stats.coursesCount },
    { name: "Sovg'alar", value: stats.giftsCount },
  ];

  // Rollar bo'yicha taqsimot (mavjud Badge ranglari bilan mos: admin=indigo, teacher=emerald, student=amber, viwer=zinc)
  const roleData = useMemo(() => {
    const counts = {
      admin: users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length,
      teacher: users.filter((u) => u.role === 'teacher').length,
      student: users.filter((u) => u.role === 'student').length,
      viwer: users.filter((u) => u.role === 'viwer').length,
    };
    return [
      { key: 'admin', name: 'Adminlar', value: counts.admin, color: isDark ? '#818cf8' : '#4f46e5' },
      { key: 'teacher', name: "O'qituvchilar", value: counts.teacher, color: isDark ? '#34d399' : '#10b981' },
      { key: 'student', name: "O'quvchilar", value: counts.student, color: isDark ? '#fbbf24' : '#f59e0b' },
      { key: 'viwer', name: 'Kuzatuvchilar', value: counts.viwer, color: isDark ? '#a1a1aa' : '#71717a' },
    ];
  }, [users, isDark]);

  const chart = {
    grid: isDark ? '#27272a' : '#e4e4e7',
    axis: isDark ? '#a1a1aa' : '#71717a',
    bar: isDark ? '#818cf8' : '#4f46e5',
    tooltipBg: isDark ? '#18181b' : '#ffffff',
    tooltipBorder: isDark ? '#3f3f46' : '#e4e4e7',
    tooltipText: isDark ? '#f4f4f5' : '#18181b',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Umumiy ko'rsatkichlar</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">O'quv markazining umumiy statistik holati</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs flex items-center justify-between transition-colors">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{card.title}</span>
                <div className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 mt-1.5">
                  {loading ? <div className="h-8 w-16 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-lg" /> : card.count}
                </div>
              </div>
              <div className={`p-3.5 rounded-2xl ${card.bg} ${card.color}`}>
                <Icon className="w-6 h-6 stroke-[1.75]" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Kategoriyalar bo'yicha taqsimot */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs p-5 transition-colors">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Kategoriyalar bo'yicha taqsimot</h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 mb-4">Har bir bo'limdagi umumiy son</p>
          {loading ? (
            <div className="h-72 flex items-center justify-center text-xs text-zinc-400 dark:text-zinc-500">Yuklanmoqda...</div>
          ) : (
            <ResponsiveContainer width="100%" height={288}>
              <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }} barCategoryGap={14}>
                <CartesianGrid horizontal={false} stroke={chart.grid} />
                <XAxis type="number" allowDecimals={false} stroke={chart.axis} tick={{ fontSize: 12, fill: chart.axis }} axisLine={{ stroke: chart.grid }} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={118}
                  stroke={chart.axis}
                  tick={{ fontSize: 12, fill: chart.axis }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                  contentStyle={{ background: chart.tooltipBg, border: `1px solid ${chart.tooltipBorder}`, borderRadius: 12, fontSize: 12, color: chart.tooltipText }}
                  labelStyle={{ color: chart.tooltipText, fontWeight: 600, marginBottom: 4 }}
                />
                <Bar dataKey="value" name="Soni" fill={chart.bar} radius={[0, 4, 4, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Rollar bo'yicha taqsimot */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs p-5 transition-colors">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Foydalanuvchilar rollari</h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 mb-4">Rol bo'yicha taqsimot</p>
          {loading ? (
            <div className="h-72 flex items-center justify-center text-xs text-zinc-400 dark:text-zinc-500">Yuklanmoqda...</div>
          ) : (
            <ResponsiveContainer width="100%" height={288}>
              <BarChart data={roleData} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }} barCategoryGap={14}>
                <CartesianGrid horizontal={false} stroke={chart.grid} />
                <XAxis type="number" allowDecimals={false} stroke={chart.axis} tick={{ fontSize: 12, fill: chart.axis }} axisLine={{ stroke: chart.grid }} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={92}
                  stroke={chart.axis}
                  tick={{ fontSize: 12, fill: chart.axis }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                  contentStyle={{ background: chart.tooltipBg, border: `1px solid ${chart.tooltipBorder}`, borderRadius: 12, fontSize: 12, color: chart.tooltipText }}
                  labelStyle={{ color: chart.tooltipText, fontWeight: 600, marginBottom: 4 }}
                />
                <Bar dataKey="value" name="Soni" radius={[0, 4, 4, 0]} barSize={22}>
                  {roleData.map((entry) => (
                    <Cell key={entry.key} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}