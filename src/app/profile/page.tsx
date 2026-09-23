'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { usersApi, uploadApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { AppShell, NavItem } from '@/components/layout/AppShell';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Gift, Settings,
  FileCheck, Award, CalendarCheck, Camera, User as UserIcon,
} from 'lucide-react';

const ADMIN_NAV: NavItem[] = [
  { label: 'Asosiy tahlil', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Foydalanuvchilar', href: '/dashboard/users', icon: Users },
  { label: 'Guruhlar', href: '/dashboard/groups', icon: GraduationCap },
  { label: 'Darslar', href: '/dashboard/lessons', icon: BookOpen },
  { label: "Sovg'alar & Koinlar", href: '/dashboard/gifts', icon: Gift },
  { label: 'Tizim boshqaruvi', href: '/dashboard/management', icon: Settings },
];

const TEACHER_NAV: NavItem[] = [
  { label: 'Mening guruhlarim', href: '/teacher', icon: GraduationCap },
  { label: "Barcha o'quvchilarim", href: '/teacher/students', icon: Users },
];

const STUDENT_NAV: NavItem[] = [
  { label: 'Asosiy', href: '/student', icon: LayoutDashboard },
  { label: 'Darslar', href: '/student/lessons', icon: BookOpen },
  { label: 'Vazifalar', href: '/student/homework', icon: FileCheck },
  { label: 'Baholarim', href: '/student/grades', icon: Award },
  { label: 'Davomat', href: '/student/attendance', icon: CalendarCheck },
  { label: "Sovg'alar do'koni", href: '/student/gifts', icon: Gift },
];

function shellFor(role?: string): { navItems: NavItem[]; title: string } {
  if (role === 'admin' || role === 'super_admin') return { navItems: ADMIN_NAV, title: 'Admin' };
  if (role === 'teacher') return { navItems: TEACHER_NAV, title: "O'qituvchi" };
  return { navItems: STUDENT_NAV, title: "O'quvchi" };
}

export default function ProfilePage() {
  const { user, isLoading, refreshUser } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ first_name: '', last_name: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) setForm({ first_name: user.first_name, last_name: user.last_name });
  }, [user]);

  if (isLoading || !user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await usersApi.updateMe(form);
    if (res.success) {
      toast.success('Profil muvaffaqiyatli yangilandi');
      await refreshUser();
    } else {
      toast.error(res.message || 'Yangilashda xatolik');
    }
    setIsSaving(false);
  };

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setIsUploadingAvatar(true);
    const uploadRes = await uploadApi.uploadFile(file);
    if (uploadRes.success && uploadRes.data) {
      const updateRes = await usersApi.updateMe({ avatar: uploadRes.data.url });
      if (updateRes.success) {
        toast.success('Profil rasmi yangilandi');
        await refreshUser();
      } else {
        toast.error(updateRes.message || "Rasmni saqlab bo'lmadi");
      }
    } else {
      toast.error(uploadRes.message || "Rasm yuklashda xatolik");
    }
    setIsUploadingAvatar(false);
  };

  const { navItems, title } = shellFor(user.role);

  return (
    <AppShell navItems={navItems} title={title}>
      <div className="space-y-6 max-w-xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Profil</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Shaxsiy ma&apos;lumotlaringizni tahrirlang</p>
        </div>

        <Card className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              title="Profil rasmini o'zgartirish"
              className="relative group h-20 w-20 rounded-full overflow-hidden bg-indigo-50 dark:bg-indigo-500/15 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center cursor-pointer disabled:opacity-60"
            >
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt="Profil rasmi" className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="w-8 h-8 text-indigo-400 dark:text-indigo-500" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                {user.first_name} {user.last_name}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 capitalize">{user.role?.replace('_', ' ')}</p>
              <button
                type="button"
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:dark:text-indigo-300 font-medium mt-1 cursor-pointer disabled:opacity-60"
              >
                {isUploadingAvatar ? 'Yuklanmoqda...' : 'Rasmni almashtirish'}
              </button>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Ism"
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
              <Input
                label="Familiya"
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </div>
            <Input label="Login" value={user.login} disabled />
            <Button type="submit" isLoading={isSaving}>Saqlash</Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
