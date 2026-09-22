'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell, NavItem } from '@/components/layout/AppShell';
import { GraduationCap, Users } from 'lucide-react';

const TEACHER_NAV: NavItem[] = [
  { label: 'Mening guruhlarim', href: '/teacher', icon: GraduationCap },
  { label: "Barcha o'quvchilarim", href: '/teacher/students', icon: Users }, // <-- SHU QATORNI QO'SHING
];

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'teacher') {
        if (user.role === 'admin' || user.role === 'super_admin') {
          router.push('/dashboard');
        } else if (user.role === 'student') {
          router.push('/student');
        } else {
          router.push('/login');
        }
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || user.role !== 'teacher') {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#fafafa]">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AppShell navItems={TEACHER_NAV} title="O'qituvchi">
      {children}
    </AppShell>
  );
}