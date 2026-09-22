'use client';

import React, { useEffect, useState } from 'react';
import { groupsApi } from '@/lib/api';
import { Group, User } from '@/types';
import { suspensionManager } from '@/lib/suspension';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Users, Search, ShieldCheck, Ban } from 'lucide-react';

interface StudentWithGroup extends User {
  groupName: string;
  groupId: string;
}

export default function TeacherAllStudentsPage() {
  const [students, setStudents] = useState<StudentWithGroup[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAllTeacherStudents() {
      try {
        const grpRes = await groupsApi.getMine();
        if (grpRes.success && grpRes.data) {
          setGroups(grpRes.data);
          const studentList: StudentWithGroup[] = [];

          // Har bir guruh talabalarini yuklab birlashtirish
          for (const g of grpRes.data) {
            const stdRes = await groupsApi.getStudents(g._id);
            if (stdRes.success && stdRes.data) {
              stdRes.data.forEach((s) => {
                studentList.push({
                  ...s,
                  groupName: g.name,
                  groupId: g._id,
                });
              });
            }
          }
          setStudents(studentList);
        }
      } catch (err) {
        console.error("Talabalarni yuklashda xatolik:", err);
      } finally {
        setLoading(false);
      }
    }

    loadAllTeacherStudents();
  }, []);

  const formatPhone = (phone?: string) => {
    if (!phone) return '-';
    if (phone.startsWith('+')) return phone;
    if (phone.startsWith('998')) return `+${phone}`;
    return `+998 ${phone}`;
  };

  const filteredStudents = students.filter((s) => {
    const matchesGroup = selectedGroup === 'all' || s.groupId === selectedGroup;
    const query = search.toLowerCase();
    const matchesSearch =
      s.first_name.toLowerCase().includes(query) ||
      s.last_name.toLowerCase().includes(query) ||
      s.phone.includes(query) ||
      s.login.toLowerCase().includes(query);

    return matchesGroup && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Barcha o'quvchilarim</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Siz dars berayotgan barcha guruhlardagi talabalar ro'yxati
        </p>
      </div>

      {/* Filtrlar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-zinc-200/80 shadow-xs max-w-sm w-full">
          <Search className="w-4 h-4 text-zinc-400 ml-1.5" />
          <input
            placeholder="Ism, login yoki telefon orqali qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs sm:text-sm w-full focus:outline-none"
          />
        </div>

        {groups.length > 1 && (
          <div className="w-full sm:w-64">
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full text-sm font-medium bg-white border border-zinc-200 rounded-xl px-3.5 py-2 shadow-xs focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Barcha guruhlar ({students.length})</option>
              {groups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* O'quvchilar jadvali */}
      {loading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="O'quvchilar topilmadi"
          description="Sizning guruhlaringizda talabalar mavjud emas yoki qidiruv natijasiz tugadi."
        />
      ) : (
        <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">F.I.SH</th>
                <th className="px-6 py-3.5">Guruh</th>
                <th className="px-6 py-3.5">Telefon</th>
                <th className="px-6 py-3.5">Login</th>
                <th className="px-6 py-3.5 text-right">To'lov / Holat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredStudents.map((std, idx) => {
                const isSuspended = suspensionManager.isSuspended(std.groupId, std._id);

                return (
                  <tr key={`${std._id}_${idx}`} className={isSuspended ? 'bg-rose-50/40' : 'hover:bg-zinc-50/50'}>
                    <td className="px-6 py-4 font-medium text-zinc-900">
                      {std.first_name} {std.last_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                        {std.groupName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 font-mono text-xs">{formatPhone(std.phone)}</td>
                    <td className="px-6 py-4 text-zinc-500 font-mono text-xs">{std.login}</td>
                    <td className="px-6 py-4 text-right">
                      {isSuspended ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                          <Ban className="w-3.5 h-3.5" /> To'lov qilinmagan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5" /> Faol
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}