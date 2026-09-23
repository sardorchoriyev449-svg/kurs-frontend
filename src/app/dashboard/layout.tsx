'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell, NavItem } from '@/components/layout/AppShell';
import { LayoutDashboard, Users, GraduationCap, BookOpen, Gift, Settings } from 'lucide-react';

const ADMIN_NAV: NavItem[] = [
  { label: 'Asosiy tahlil', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Foydalanuvchilar', href: '/dashboard/users', icon: Users },
  { label: 'Guruhlar', href: '/dashboard/groups', icon: GraduationCap },
  { label: 'Darslar', href: '/dashboard/lessons', icon: BookOpen },
  { label: 'Sovg\'alar & Koinlar', href: '/dashboard/gifts', icon: Gift },
  { label: 'Tizim boshqaruvi', href: '/dashboard/management', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'admin' && user.role !== 'super_admin') {
        if (user.role === 'teacher') router.push('/teacher');
        else if (user.role === 'student') router.push('/student');
        else router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppShell navItems={ADMIN_NAV} title="Admin">
      {children}
    </AppShell>
  );
}