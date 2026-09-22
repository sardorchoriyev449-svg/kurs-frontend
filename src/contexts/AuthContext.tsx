'use client';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '../types';
import { authApi } from '../lib/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: { login: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await authApi.me();
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (credentials: { login: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await authApi.signIn(credentials);
      if (res.success) {
        const meRes = await authApi.me();
        if (meRes.success && meRes.data) {
          const u = meRes.data;
          setUser(u);
          toast.success(`Xush kelibsiz, ${u.first_name}!`);

          if (u.role === 'admin' || u.role === 'super_admin') {
            router.push('/dashboard');
          } else if (u.role === 'teacher') {
            router.push('/teacher');
          } else if (u.role === 'student') {
            router.push('/student');
          } else {
            toast.error("Sizga tizimdan foydalanish ruxsati berilmagan (viwer)");
            await authApi.logout();
            setUser(null);
          }
        }
      } else {
        toast.error(res.message || "Login yoki parol noto'g'ri");
      }
    } catch {
      toast.error("Server bilan bog'lanishda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    router.push('/login');
    toast.success("Tizimdan muvaffaqiyatli chiqildi");
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshUser: fetchCurrentUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};