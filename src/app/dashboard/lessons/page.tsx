'use client';

import React, { useEffect, useState } from 'react';
import { lessonsApi, groupsApi } from '@/lib/api';
import { Lesson, Group } from '@/types';
import { getRelationName } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import { Badge, EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { BookOpen, Calendar, FileText, Trash2, Edit3 } from 'lucide-react';

export default function AdminLessonsPage() {
  const toast = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Tahrirlash modali
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', date: '' });

  const loadData = async () => {
    setLoading(true);
    const [lRes, gRes] = await Promise.all([
      lessonsApi.getAll(),
      groupsApi.getAll(),
    ]);
    if (lRes.success && lRes.data) setLessons(lRes.data);
    if (gRes.success && gRes.data) setGroups(gRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openEdit = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setEditForm({
      name: lesson.name,
      description: lesson.description,
      date: lesson.date,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLesson) return;
    const res = await lessonsApi.update(activeLesson._id, editForm);
    if (res.success) {
      toast.success("Dars muvaffaqiyatli yangilandi");
      setIsEditOpen(false);
      loadData();
    } else {
      toast.error(res.message || "Darsni yangilab bo'lmadi");
    }
  };

  const handleDelete = async (lessonId: string) => {
    if (!confirm("Ushbu darsni o'chirmoqchimisiz?")) return;
    const res = await lessonsApi.delete(lessonId);
    if (res.success) {
      toast.success("Dars o'chirildi");
      loadData();
    } else {
      toast.error(res.message || "Darsni o'chirib bo'lmadi");
    }
  };

  const filteredLessons = selectedGroup === 'all'
    ? lessons
    : lessons.filter((l) => {
        const gid = typeof l.group_id === 'string' ? l.group_id : l.group_id?._id;
        return gid === selectedGroup;
      });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Barcha darslar</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Tizimga kiritilgan o'quv darslari va ularni boshqarish</p>
        </div>
        <div className="w-64">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 shadow-xs"
          >
            <option value="all">Barcha guruhlar</option>
            {groups.map((g) => (
              <option key={g._id} value={g._id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredLessons.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Darslar topilmadi"
          description="Tanlangan guruh bo'yicha hech qanday darslar mavjud emas."
        />
      ) : (
        <div className="space-y-4">
          {filteredLessons.map((lesson) => (
            <div key={lesson._id} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant="indigo">{getRelationName(lesson.group_id)}</Badge>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5" /> {lesson.date}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">{lesson.name}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 whitespace-pre-line">{lesson.description}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(lesson)}
                    className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-indigo-600 hover:dark:text-indigo-400 rounded-lg hover:bg-indigo-50 hover:dark:bg-indigo-500/15 transition-colors"
                    title="Tahrirlash"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(lesson._id)}
                    className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 hover:dark:text-rose-400 rounded-lg hover:bg-rose-50 hover:dark:bg-rose-500/15 transition-colors"
                    title="O'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Darsni tahrirlash modali */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Darsni tahrirlash">
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Dars nomi</label>
            <input
              required
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Sana</label>
            <input
              type="date"
              required
              value={editForm.date}
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tavsif</label>
            <textarea
              rows={3}
              required
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            />
          </div>
          <Button type="submit" className="w-full mt-2">Saqlash</Button>
        </form>
      </Modal>
    </div>
  );
}