'use client';

import React, { useEffect, useState } from 'react';
import { groupsApi, lessonsApi } from '@/lib/api';
import { Lesson, Group } from '@/types';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { BookOpen, Calendar, Video, Download, ExternalLink, Layers } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function StudentLessonsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingLessons, setLoadingLessons] = useState(false);

  // 1. O'quvchining guruhlarini yuklash
  useEffect(() => {
    async function loadGroups() {
      try {
        const res = await groupsApi.getMine();
        if (res.success && res.data && res.data.length > 0) {
          setGroups(res.data);
          setSelectedGroup(res.data[0]._id);
        }
      } catch (err) {
        console.error("Guruhlarni yuklashda xatolik:", err);
      } finally {
        setLoadingGroups(false);
      }
    }
    loadGroups();
  }, []);

  // 2. Tanlangan guruh bo'yicha darslarni yuklash
  useEffect(() => {
    async function loadLessons() {
      if (!selectedGroup) return;
      setLoadingLessons(true);
      try {
        const res = await lessonsApi.getByGroup(selectedGroup);
        if (res.success && res.data) {
          setLessons(res.data);
        } else {
          setLessons([]);
        }
      } catch (err) {
        console.error("Darslarni yuklashda xatolik:", err);
        setLessons([]);
      } finally {
        setLoadingLessons(false);
      }
    }
    loadLessons();
  }, [selectedGroup]);

  // Fayl yoki video uchun to'g'ri backend URL hosil qilish
  const getFileUrl = (path?: string) => {
    if (!path) return '#';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  // Mavzu nomini aniqlash (Xom ObjectId chiqishini oldini oladi)
  const getTopicDisplayName = (topic: unknown): string | null => {
    if (!topic) return null;
    if (typeof topic === 'object' && topic !== null && 'name' in topic) {
      return String((topic as { name: unknown }).name);
    }
    if (typeof topic === 'string') {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(topic);
      return isObjectId ? null : topic;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Sarlavha va guruh filtratori */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">O'tilgan darslar</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Dars mavzulari, video yozuvlar va biriktirilgan ta'lim materiallari
          </p>
        </div>

        {groups.length > 1 && (
          <div className="w-full sm:w-72">
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1.5">
              Guruhni tanlang:
            </label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full text-sm font-medium bg-white border border-zinc-200 rounded-xl px-3.5 py-2 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {groups.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Yuklanish holati */}
      {loadingGroups || loadingLessons ? (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Guruhlar topilmadi"
          description="Siz hali hech qaysi guruhga a'zo emassiz. Administrator sizni guruhga biriktirishi lozim."
        />
      ) : lessons.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Darslar mavjud emas"
          description="Ushbu guruhda o'qituvchi tomonidan hali darslar kiritilmagan."
        />
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson) => {
            const topicName = getTopicDisplayName(lesson.topic_id);

            return (
              <div
                key={lesson._id}
                className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs hover:border-zinc-300 transition-all"
              >
                {/* Dars tepa qismi: sana va mavzu */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-zinc-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                    {lesson.date}
                  </span>
                  {topicName && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                      {topicName}
                    </span>
                  )}
                </div>

                {/* Dars nomi */}
                <h3 className="text-lg font-bold text-zinc-900">{lesson.name}</h3>

                {/* Dars tavsifi */}
                {lesson.description && (
                  <p className="text-sm text-zinc-600 mt-2 whitespace-pre-line leading-relaxed">
                    {lesson.description}
                  </p>
                )}

                {/* Video va fayl materiallari tugmalari */}
                {(lesson.video_uri || lesson.file_uri) && (
                  <div className="mt-5 pt-4 border-t border-zinc-100 flex flex-wrap items-center gap-3">
                    {lesson.video_uri && (
                      <a
                        href={getFileUrl(lesson.video_uri)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                      >
                        <Video className="w-4 h-4 text-indigo-600" />
                        Video darsni tomosha qilish
                        <ExternalLink className="w-3 h-3 text-indigo-400 ml-0.5" />
                      </a>
                    )}

                    {lesson.file_uri && (
                      <a
                        href={getFileUrl(lesson.file_uri)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold hover:bg-zinc-100 transition-colors"
                      >
                        <Download className="w-4 h-4 text-zinc-500" />
                        Dars materialini yuklab olish
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}