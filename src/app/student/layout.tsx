'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell, NavItem } from '@/components/layout/AppShell';
import { LayoutDashboard, BookOpen, FileCheck, Award, CalendarCheck, Gift } from 'lucide-react';

const STUDENT_NAV: NavItem[] = [
  { label: 'Asosiy', href: '/student', icon: LayoutDashboard },
  { label: 'Darslar', href: '/student/lessons', icon: BookOpen },
  { label: 'Vazifalar', href: '/student/homework', icon: FileCheck },
  { label: 'Baholarim', href: '/student/grades', icon: Award },
  { label: 'Davomat', href: '/student/attendance', icon: CalendarCheck },
  { label: 'Sovg\'alar do\'koni', href: '/student/gifts', icon: Gift },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push('/login');
      else if (user.role !== 'student') {
        if (user.role === 'admin' || user.role === 'super_admin') router.push('/dashboard');
        else if (user.role === 'teacher') router.push('/teacher');
        else router.push('/login');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'student') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-50">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppShell navItems={STUDENT_NAV} title="O'quvchi">
      {children}
    </AppShell>
  );
}