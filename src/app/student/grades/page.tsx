'use client';
import React, { useEffect, useState } from 'react';
import { gradesApi } from '@/lib/api';
import { Grade } from '@/types';
import { getRelationName } from '@/lib/utils';
import { EmptyState } from '@/components/ui/EmptyState';
import { Award } from 'lucide-react';

export default function StudentGradesPage() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGrades() {
      const res = await gradesApi.getMe();
      if (res.success && res.data) {
        setGrades(res.data);
      }
      setLoading(false);
    }
    loadGrades();
  }, []);

  const averageScore = grades.length > 0
    ? (grades.reduce((acc, g) => acc + g.score, 0) / grades.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Baholarim</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Darslarda qo'yilgan barcha baholar</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 px-4 py-2.5 rounded-2xl shadow-xs flex items-center gap-3">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">O'rtacha ko'rsatkich:</span>
          <span className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">{averageScore} ball</span>
        </div>
      </div>

      {grades.length === 0 && !loading ? (
        <EmptyState
          icon={Award}
          title="Hozircha baholar yo'q"
          description="O'qituvchilar sizga hali baho qo'yishmagan."
        />
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-3.5">Dars</th>
                <th className="px-6 py-3.5">Ball (0-100)</th>
                <th className="px-6 py-3.5">O'qituvchi izohi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {grades.map((grade) => (
                <tr key={grade._id} className="hover:bg-zinc-50/50 hover:dark:bg-zinc-800/50">
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">{getRelationName(grade.lesson_id)}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold font-mono text-zinc-900 dark:text-zinc-50 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      {grade.score}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 text-xs">{grade.comment || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}