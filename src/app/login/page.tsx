'use client';
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { GraduationCap, Lock, User as UserIcon } from 'lucide-react';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [form, setForm] = useState({ login: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(form);
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-zinc-100 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-2">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Tizimga kirish
          </h1>
          <p className="text-sm text-zinc-500">
            O'quv markazni boshqarish platformasi
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              Login
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={form.login}
                onChange={(e) => setForm({ ...form, login: e.target.value })}
                placeholder="Foydalanuvchi logini"
                className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              Parol
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2 text-sm bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <Button type="submit" isLoading={isLoading} className="w-full">
            Kirish
          </Button>
        </form>

        <p className="text-center text-xs text-zinc-400">
          Xavfsiz cookie autentifikatsiyasi bilan himoyalangan
        </p>
      </div>
    </div>
  );
}
