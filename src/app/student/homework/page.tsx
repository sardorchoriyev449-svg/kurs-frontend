'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { groupsApi, homeworkAssignmentsApi, homeworkApi, uploadApi } from '@/lib/api';
import { HomeworkAssignment, Homework, Group } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge, EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  FileCheck,
  Clock,
  Download,
  ExternalLink,
  Paperclip,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function StudentHomeworkPage() {
  const toast = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [mySubmissions, setMySubmissions] = useState<Homework[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<HomeworkAssignment | null>(null);
  const [loading, setLoading] = useState(true);

  // Topshirish form holati
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitForm, setSubmitForm] = useState({ file_name: '', description: '' });

  const loadData = useCallback(async () => {
    try {
      const [grpRes, myRes] = await Promise.all([
        groupsApi.getMine(),
        homeworkApi.getMe()
      ]);

      if (grpRes.success && grpRes.data && grpRes.data.length > 0) {
        setGroups(grpRes.data);
        const allAssignments: HomeworkAssignment[] = [];
        
        // Har bir guruhning vazifalarini yuklash
        for (const g of grpRes.data) {
          const hRes = await homeworkAssignmentsApi.getByGroup(g._id);
          if (hRes.success && hRes.data) {
            allAssignments.push(...hRes.data);
          }
        }
        setAssignments(allAssignments);
      }

      if (myRes.success && myRes.data) {
        setMySubmissions(myRes.data);
      }
    } catch (err) {
      console.error("Vazifalarni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fayl manzilini to'liq URL qilish
  const getFileUrl = (path: string) => {
    if (!path) return '#';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  // Guruh nomini aniqlash (Xom ID chiqishini oldini oladi)
  const getGroupName = (groupId: unknown): string => {
    if (!groupId) return 'Guruh';
    if (typeof groupId === 'object' && groupId !== null && 'name' in groupId) {
      return String((groupId as { name: unknown }).name);
    }
    const found = groups.find((g) => g._id === String(groupId));
    return found ? found.name : 'Guruh';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const res = await uploadApi.uploadFile(file);
    if (res.success && res.data) {
      setSubmitForm((prev) => ({ ...prev, file_name: res.data!.url }));
      toast.success("Fayl muvaffaqiyatli yuklandi");
    } else {
      toast.error(res.message || "Fayl yuklashda xatolik");
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    if (!submitForm.file_name && !submitForm.description.trim()) {
      toast.error("Iltimos, fayl yuklang yoki izoh yozing");
      return;
    }

    const res = await homeworkApi.submit(selectedAssignment._id, submitForm);
    if (res.success) {
      toast.success("Vazifa muvaffaqiyatli topshirildi!");
      setIsSubmitOpen(false);
      setSubmitForm({ file_name: '', description: '' });
      loadData();
    } else {
      toast.error(res.message || "Topshirishda xatolik yuz berdi");
    }
  };

  return (
    <div className="space-y-6">
      {/* Sarlavha */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Uy vazifalari</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Berilgan topshiriqlar, namuna fayllar va baholanish holati</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
        </div>
      ) : assignments.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="Vazifalar mavjud emas"
          description="Hozircha guruhlaringizda faol uy vazifalari mavjud emas."
        />
      ) : (
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const submission = mySubmissions.find((s) => {
              const aid = typeof s.assignment_id === 'string' ? s.assignment_id : s.assignment_id?._id;
              return aid === assignment._id;
            });

            return (
              <div
                key={assignment._id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs hover:border-zinc-300 hover:dark:border-zinc-700 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
                        {getGroupName(assignment.group_id)}
                      </span>
                      {assignment.due_date && (
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                          Muddat: {assignment.due_date}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">{assignment.title}</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-line leading-relaxed">
                      {assignment.description}
                    </p>

                    {/* O'qituvchi ilova qilgan vazifa fayli */}
                    {assignment.attachment && (
                      <div className="pt-2">
                        <a
                          href={getFileUrl(assignment.attachment)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 hover:dark:bg-zinc-800 transition-colors"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                          Vazifa namunasi / faylini yuklab olish
                          <Download className="w-3.5 h-3.5 ml-1 text-zinc-400 dark:text-zinc-500" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Holat tugmasi */}
                  <div className="sm:self-start">
                    {submission ? (
                      <Badge
                        variant={
                          submission.status === 'accepted'
                            ? 'emerald'
                            : submission.status === 'rejected'
                            ? 'rose'
                            : 'amber'
                        }
                      >
                        {submission.status === 'accepted'
                          ? `Qabul qilindi (${submission.score ?? 0} ball)`
                          : submission.status === 'rejected'
                          ? 'Qaytarildi (Rad etildi)'
                          : 'Tekshirilmoqda'}
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setSubmitForm({ file_name: '', description: '' });
                          setIsSubmitOpen(true);
                        }}
                      >
                        Vazifani topshirish
                      </Button>
                    )}
                  </div>
                </div>

                {/* Talaba topshirgan javob tafsilotlari */}
                {submission && (
                  <div className="mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/70 p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Siz topshirgan javob:
                      </span>
                      {submission.file_name && (
                        <a
                          href={getFileUrl(submission.file_name)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:dark:text-indigo-300 hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Yuborilgan faylni ko'rish
                        </a>
                      )}
                    </div>

                    {submission.description && (
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 pl-5.5">{submission.description}</p>
                    )}

                    {submission.teacher_comment && (
                      <div className="mt-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-500/15/60 border border-indigo-100 dark:border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-200">
                        <span className="font-semibold block mb-0.5">O'qituvchi fikri:</span>
                        {submission.teacher_comment}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Topshirish modali */}
      <Modal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        title={`Vazifani topshirish`}
        description={selectedAssignment?.title}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Izoh yoki GitHub / loyiha havolasi
            </label>
            <textarea
              rows={3}
              value={submitForm.description}
              onChange={(e) => setSubmitForm({ ...submitForm, description: e.target.value })}
              placeholder="Vazifa qanday bajarilgani haqida qisqacha izoh..."
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Bajarilgan ish fayli (zip, rar, 7z, pdf, rasm) <span className="text-zinc-400 font-normal">(ixtiyoriy, izoh yozsangiz ham bo'ladi)</span>
            </label>
            <input
              type="file"
              onChange={handleFileUpload}
              className="w-full text-xs text-zinc-500 dark:text-zinc-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-zinc-100 file:dark:bg-zinc-800 hover:file:bg-zinc-200 hover:file:dark:bg-zinc-700 cursor-pointer"
            />
            {uploading && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400 block mt-1.5 animate-pulse">
                Fayl serverga yuklanmoqda...
              </span>
            )}
            {submitForm.file_name && !uploading && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium block mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Fayl tayyor
              </span>
            )}
          </div>

          <Button type="submit" isLoading={uploading} className="w-full mt-2">
            Topshirishni tasdiqlash
          </Button>
        </form>
      </Modal>
    </div>
  );
}