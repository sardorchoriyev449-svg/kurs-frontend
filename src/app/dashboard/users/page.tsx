'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { usersApi } from '@/lib/api';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/EmptyState';
import { Plus, Trash2, Edit3, Search, Filter } from 'lucide-react';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Yaratish modali
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    data_both: '',
    login: '',
    password: '',
  });

  // Tahrirlash modali
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    first_name: '',
    last_name: '',
    data_both: '',
  });

  const loadUsers = async () => {
    setLoading(true);
    const res = await usersApi.getAll();
    if (res.success && res.data) {
      setUsers(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Telefon raqamni bitta +998 formatida ko'rsatish
  const formatPhone = (phone?: string) => {
    if (!phone) return '-';
    if (phone.startsWith('+')) return phone;
    if (phone.startsWith('998')) return `+${phone}`;
    return `+998 ${phone}`;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.phone.length !== 9) {
      toast.error("Telefon raqami aniq 9 ta belgidan iborat bo'lishi kerak (masalan: 901234567)");
      return;
    }
    const res = await usersApi.create(form);
    if (res.success) {
      toast.success("Foydalanuvchi yaratildi (default: viwer)");
      setIsCreateOpen(false);
      setForm({ first_name: '', last_name: '', phone: '', data_both: '', login: '', password: '' });
      loadUsers();
    } else {
      toast.error(res.message || "Xatolik yuz berdi");
    }
  };

  const openEditModal = (u: User) => {
    setSelectedUser(u);
    setEditForm({
      first_name: u.first_name,
      last_name: u.last_name,
      data_both: u.data_both || '',
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const res = await usersApi.update(selectedUser._id, editForm);
    if (res.success) {
      toast.success("Foydalanuvchi ma'lumotlari yangilandi");
      setIsEditOpen(false);
      loadUsers();
    } else {
      toast.error(res.message || "Yangilashda xatolik");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await usersApi.updateRole(userId, newRole);
    if (res.success) {
      toast.success("Rol muvaffaqiyatli o'zgartirildi");
      loadUsers();
    } else {
      toast.error(res.message || "Rolni o'zgartirib bo'lmadi");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Foydalanuvchini o'chirishga ishonchingiz komilmi?")) return;
    const res = await usersApi.delete(userId);
    if (res.success) {
      toast.success("Foydalanuvchi o'chirildi");
      loadUsers();
    } else {
      toast.error(res.message || "O'chirib bo'lmadi");
    }
  };

  // Har bir rol bo'yicha foydalanuvchilar soni
  const counts = useMemo(() => {
    return {
      all: users.length,
      student: users.filter((u) => u.role === 'student').length,
      teacher: users.filter((u) => u.role === 'teacher').length,
      admin: users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length,
      viwer: users.filter((u) => u.role === 'viwer').length,
    };
  }, [users]);

  // Qidiruv va Rol bo'yicha saralash
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Rol bo'yicha filtr
      if (selectedRole === 'admin') {
        if (u.role !== 'admin' && u.role !== 'super_admin') return false;
      } else if (selectedRole !== 'all' && u.role !== selectedRole) {
        return false;
      }

      // Matnli qidiruv
      const query = search.toLowerCase();
      return (
        u.first_name.toLowerCase().includes(query) ||
        u.last_name.toLowerCase().includes(query) ||
        u.login.toLowerCase().includes(query) ||
        u.phone.includes(query)
      );
    });
  }, [users, selectedRole, search]);

  return (
    <div className="space-y-6">
      {/* Yuqori sarlavha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Foydalanuvchilar</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Tizimdagi barcha talaba, o'qituvchi va xodimlar</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Foydalanuvchi qo'shish
        </Button>
      </div>

      {/* Rol filtri tugmalari (Tabs) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 pb-3">
        {[
          { key: 'all', label: 'Barchasi', count: counts.all },
          { key: 'student', label: "O'quvchilar", count: counts.student },
          { key: 'teacher', label: "O'qituvchilar", count: counts.teacher },
          { key: 'admin', label: 'Administratorlar', count: counts.admin },
          { key: 'viwer', label: 'Kuzatuvchilar (viwer)', count: counts.viwer },
        ].map((tab) => {
          const active = selectedRole === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedRole(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                  active ? 'bg-indigo-700/80 text-white' : 'bg-zinc-100 text-zinc-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Qidiruv qatori */}
      <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-zinc-200/80 shadow-xs max-w-sm">
        <Search className="w-4 h-4 text-zinc-400 ml-1.5" />
        <input
          placeholder="Ism, login yoki telefon orqali qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-xs sm:text-sm w-full focus:outline-none"
        />
      </div>

      {/* Foydalanuvchilar jadvali */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-3.5">F.I.SH</th>
              <th className="px-6 py-3.5">Login / Tel</th>
              <th className="px-6 py-3.5">Rol</th>
              <th className="px-6 py-3.5">Rolni o'zgartirish</th>
              <th className="px-6 py-3.5 text-right">Amallar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-400">Yuklanmoqda...</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-400">
                  Mos foydalanuvchilar topilmadi
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isMe = u._id === currentUser?._id;
                const isSuperAdmin = u.role === 'super_admin';

                return (
                  <tr key={u._id} className={isSuperAdmin ? 'bg-zinc-50/50' : 'hover:bg-zinc-50/50'}>
                    <td className="px-6 py-4 font-medium text-zinc-900">
                      {u.first_name} {u.last_name}
                      {isMe && <span className="ml-2 text-xs text-indigo-600 font-normal">(Siz)</span>}
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      <div className="font-mono text-xs text-zinc-700">{u.login}</div>
                      <div className="text-xs text-zinc-400 font-mono mt-0.5">{formatPhone(u.phone)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          u.role === 'admin' || u.role === 'super_admin'
                            ? 'indigo'
                            : u.role === 'teacher'
                            ? 'emerald'
                            : u.role === 'student'
                            ? 'amber'
                            : 'zinc'
                        }
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        disabled={isMe || isSuperAdmin}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="text-xs bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-40 cursor-pointer"
                      >
                        <option value="viwer">viwer</option>
                        <option value="student">student</option>
                        <option value="teacher">teacher</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          disabled={isSuperAdmin}
                          onClick={() => openEditModal(u)}
                          className="p-1.5 text-zinc-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-30"
                          title="Tahrirlash"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          disabled={isMe || isSuperAdmin}
                          onClick={() => handleDelete(u._id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-30"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Yaratish modali */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Yangi foydalanuvchi qo'shish">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Ism (min 3)</label>
              <input
                required
                minLength={3}
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Familiya (min 3)</label>
              <input
                required
                minLength={3}
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Telefon (9 ta raqam)</label>
            <input
              required
              placeholder="901234567"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Tug'ilgan sana</label>
            <input
              type="date"
              required
              value={form.data_both}
              onChange={(e) => setForm({ ...form, data_both: e.target.value })}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Login (min 6)</label>
            <input
              required
              minLength={6}
              value={form.login}
              onChange={(e) => setForm({ ...form, login: e.target.value })}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Parol (min 8)</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
            />
          </div>
          <Button type="submit" className="w-full mt-2">Yaratish</Button>
        </form>
      </Modal>

      {/* Tahrirlash modali */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Foydalanuvchini tahrirlash">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Ism</label>
            <input
              required
              value={editForm.first_name}
              onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Familiya</label>
            <input
              required
              value={editForm.last_name}
              onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Tug'ilgan sana</label>
            <input
              type="date"
              value={editForm.data_both}
              onChange={(e) => setEditForm({ ...editForm, data_both: e.target.value })}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
            />
          </div>
          <Button type="submit" className="w-full mt-2">Saqlash</Button>
        </form>
      </Modal>
    </div>
  );
}