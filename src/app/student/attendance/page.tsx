'use client';
import React, { useEffect, useState } from 'react';
import { attendanceApi } from '@/lib/api';
import { Attendance } from '@/types';
import { getRelationName } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { CalendarCheck, CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';

export default function StudentAttendancePage() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAttendance() {
      const res = await attendanceApi.getMe();
      if (res.success && res.data) {
        setRecords(res.data);
      }
      setLoading(false);
    }
    loadAttendance();
  }, []);

  const total = records.length;
  const attended = records.filter((r) => r.status === 'keldi' || r.status === 'kechikdi').length;
  const percentage = total > 0 ? Math.round((attended / total) * 100) : 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Mening davomatim</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Darslarda ishtirok etish tarixi</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 px-4 py-2.5 rounded-2xl shadow-xs flex items-center gap-3">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Qatnashish foizi:</span>
          <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{percentage}%</span>
        </div>
      </div>

      {records.length === 0 && !loading ? (
        <EmptyState
          icon={CalendarCheck}
          title="Davomat yozuvlari yo'q"
          description="Darslar bo'yicha davomat hali qayd etilmagan."
        />
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-3.5">Dars</th>
                <th className="px-6 py-3.5">Holati</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {records.map((r) => (
                <tr key={r._id} className="hover:bg-zinc-50/50 hover:dark:bg-zinc-800/50">
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">{getRelationName(r.lesson_id)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                      r.status === 'keldi'
                        ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : r.status === 'kechikdi'
                        ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        : r.status === 'sababli'
                        ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300'
                        : 'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300'
                    }`}>
                      {r.status === 'keldi' && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {r.status === 'kechikdi' && <Clock className="w-3.5 h-3.5" />}
                      {r.status === 'sababli' && <AlertCircle className="w-3.5 h-3.5" />}
                      {r.status === 'kelmadi' && <XCircle className="w-3.5 h-3.5" />}
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}