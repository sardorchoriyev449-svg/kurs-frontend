'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { GraduationCap, LogOut, Menu, X, LucideIcon } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

interface AppShellProps {
  navItems: NavItem[];
  title: string;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ navItems, title, children }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row text-zinc-900 dark:text-zinc-50 transition-colors">
      {/* Mobil fon (Backdrop) */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-xs md:hidden cursor-pointer"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Asosiy Chap Sidebar */}
      <aside
        className={`fixed md:sticky top-0 z-50 h-screen w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Markaz logotipi */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-50 block leading-tight">
                O'quv Markaz
              </span>
              <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                {title}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-1 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menyu bo'limlari */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' &&
                item.href !== '/teacher' &&
                item.href !== '/student' &&
                pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Profil va Chiqish */}
        <div className="p-3 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-700/60">
            <Link
              href="/profile"
              onClick={() => setIsMobileOpen(false)}
              title="Profilni tahrirlash"
              className="flex items-center gap-2.5 min-w-0 pr-2 group cursor-pointer"
            >
              {user?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold shrink-0">
                  {user?.first_name?.[0]}
                  {user?.last_name?.[0]}
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-50 truncate group-hover:text-indigo-600 group-hover:dark:text-indigo-400 transition-colors">
                  {user?.first_name} {user?.last_name}
                </span>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500 capitalize truncate">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
            </Link>
            <button
              onClick={() => logout()}
              title="Tizimdan chiqish"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/15 dark:hover:text-rose-400 transition-colors cursor-pointer shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* O'ng tomon — Asosiy Kontent qismi */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Yuqori Header */}
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="md:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {title} paneli
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <div className="hidden sm:block text-xs text-zinc-400 dark:text-zinc-500 font-mono">
              {new Date().toLocaleDateString('uz-UZ', { month: 'long', day: 'numeric' })}
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Sahifa ichki kontenti */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};