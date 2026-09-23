'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  groupsApi,
  usersApi,
  coursesApi,
  lessonsApi,
  gradesApi,
  attendanceApi,
  classRoomsApi
} from '@/lib/api';
import { Group, User, Course, Lesson, AttendanceStatus, ClassRoom } from '@/types';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  UserPlus,
  UserMinus,
  CheckCircle2,
  BookOpen,
  CalendarCheck,
  Award,
  Users,
  Search,
  Clock,
  Edit3,
  ShieldCheck,
  Ban,
  DoorOpen
} from 'lucide-react';

export default function AdminGroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'info' | 'grades' | 'attendance'>('info');
  const [group, setGroup] = useState<Group | null>(null);
  const [students, setStudents] = useState<User[]>([]);
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [rooms, setRooms] = useState<ClassRoom[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Muzlatilgan o'quvchilar ro'yxati (backend'dan, guruh ma'lumoti ichida keladi)
  const suspendedIds = (group?.suspended_students ?? []).map((x) => x.student);

  // O'quvchi biriktirish modali
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);

  // Guruhni tahrirlash modali
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    course_id: '',
    teacher: '',
    lesson_time: '',
    lesson_days: [] as string[],
  });

  // Xona biriktirish modali
  const [isRoomAssignOpen, setIsRoomAssignOpen] = useState(false);
  const [assigningRoomId, setAssigningRoomId] = useState<string | null>(null);
  const [removingRoomId, setRemovingRoomId] = useState<string | null>(null);

  // Baholar & Davomat form holatlari
  const [gradesInput, setGradesInput] = useState<{ [studentId: string]: { score: number; comment: string } }>({});
  const [attendanceRecords, setAttendanceRecords] = useState<{ [studentId: string]: AttendanceStatus }>({});

  const loadData = useCallback(async () => {
    try {
      const [grpRes, stdRes, lsnRes, allStdRes, usrRes, crsRes, roomsRes] = await Promise.all([
        groupsApi.getOne(id),
        groupsApi.getStudents(id),
        lessonsApi.getByGroup(id),
        usersApi.getStudents(),
        usersApi.getAll(),
        coursesApi.getAll(),
        classRoomsApi.getAll(),
      ]);

      if (grpRes.success && grpRes.data) setGroup(grpRes.data);
      if (stdRes.success && stdRes.data) setStudents(stdRes.data);
      if (allStdRes.success && allStdRes.data) setAllStudents(allStdRes.data);
      if (usrRes.success && usrRes.data) setAllUsers(usrRes.data);
      if (crsRes.success && crsRes.data) setCourses(crsRes.data);
      if (roomsRes.success && roomsRes.data) setRooms(roomsRes.data);

      if (lsnRes.success && lsnRes.data) {
        setLessons(lsnRes.data);
        if (lsnRes.data.length > 0 && !selectedLesson) {
          setSelectedLesson(lsnRes.data[0]._id);
        }
      }
    } catch (err) {
      console.error("Guruh ma'lumotlarini yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  }, [id, selectedLesson]);

  useEffect(() => {
    loadData();
  }, [loadData, id]);

  // MUZLATISH / FAOLLASHTIRISH BOSILGANDA:
  const handleToggleSuspend = async (studentId: string, studentName: string) => {
    const isCurrentlySuspended = suspendedIds.includes(studentId);
    const res = await groupsApi.setSuspension(id, studentId, !isCurrentlySuspended);

    if (!res.success) {
      toast.error(res.message || "Holatni o'zgartirib bo'lmadi");
      return;
    }

    if (!isCurrentlySuspended) {
      toast.error(`${studentName} to'lov qilinmagani sababli vaqtincha muzlatildi`);
    } else {
      toast.success(`${studentName} qayta faollashtirildi!`);
    }
    loadData();
  };

  const formatPhone = (phone?: string) => {
    if (!phone) return '-';
    if (phone.startsWith('+')) return phone;
    if (phone.startsWith('998')) return `+${phone}`;
    return `+998 ${phone}`;
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Haqiqatan ham ${studentName}ni ushbu guruhdan chiqarmoqchimisiz?`)) return;

    const remainingStudentIds = students.filter((s) => s._id !== studentId).map((s) => s._id);
    const res = await groupsApi.update(id, { students: remainingStudentIds as any });

    if (res.success) {
      toast.success(`${studentName} guruhdan chiqarildi`);
      loadData();
    } else {
      const fallbackRes = await groupsApi.addStudents(id, remainingStudentIds);
      if (fallbackRes.success) {
        toast.success(`${studentName} guruhdan chiqarildi`);
        loadData();
      } else {
        toast.error(res.message || "O'quvchini chiqarib bo'lmadi");
      }
    }
  };

  const handleOpenEditModal = () => {
    if (!group) return;
    const courseId = typeof group.course_id === 'object' && group.course_id !== null
      ? group.course_id._id : String(group.course_id || '');
    const teacherId = typeof group.teacher === 'object' && group.teacher !== null
      ? (group.teacher as User)._id : String(group.teacher || '');

    setEditForm({
      name: group.name,
      course_id: courseId,
      teacher: teacherId,
      lesson_time: group.lesson_time,
      lesson_days: Array.isArray(group.lesson_days) ? group.lesson_days : [],
    });
    setIsEditModalOpen(true);
  };

  const handleDayToggle = (day: string) => {
    setEditForm((prev) => ({
      ...prev,
      lesson_days: prev.lesson_days.includes(day)
        ? prev.lesson_days.filter((d) => d !== day)
        : [...prev.lesson_days, day],
    }));
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editForm.name.length < 5) {
      toast.error("Guruh nomi kamida 5 ta belgidan iborat bo'lishi kerak");
      return;
    }

    const res = await groupsApi.update(id, {
      name: editForm.name,
      course_id: editForm.course_id as any,
      teacher: editForm.teacher || undefined,
      lesson_time: editForm.lesson_time,
      lesson_days: editForm.lesson_days,
    });

    if (res.success) {
      toast.success("Guruh ma'lumotlari muvaffaqiyatli yangilandi");
      setIsEditModalOpen(false);
      loadData();
    } else {
      toast.error(res.message || "Guruhni yangilashda xatolik yuz berdi");
    }
  };

  // XONA BIRIKTIRISH
  const handleAssignRoom = async (roomId: string) => {
    setAssigningRoomId(roomId);
    const res = await classRoomsApi.assignGroup(roomId, id);
    setAssigningRoomId(null);

    if (res.success) {
      toast.success("Guruh xonaga muvaffaqiyatli biriktirildi");
      setIsRoomAssignOpen(false);
      loadData();
    } else {
      // Backend kun/vaqt to'qnashganda yoki xona allaqachon biriktirilganda shu yerga tushadi
      toast.error(res.message || "Xonani biriktirib bo'lmadi");
    }
  };

  // XONADAN CHIQARISH
  const handleUnassignRoom = async (roomId: string) => {
    setRemovingRoomId(roomId);
    const res = await classRoomsApi.unassignGroup(roomId, id);
    setRemovingRoomId(null);

    if (res.success) {
      toast.success("Guruh xonadan chiqarildi");
      loadData();
    } else {
      toast.error(res.message || "Xonadan chiqarib bo'lmadi");
    }
  };

  const getTeacherName = (teacher: unknown): string => {
    if (!teacher) return 'Biriktirilmagan';
    if (typeof teacher === 'object' && teacher !== null) {
      const t = teacher as Partial<User>;
      if (t.first_name || t.last_name) return `${t.first_name || ''} ${t.last_name || ''}`.trim();
    }
    if (typeof teacher === 'string') {
      const found = allUsers.find((u) => u._id === teacher);
      if (found) return `${found.first_name} ${found.last_name}`.trim();
    }
    return 'Biriktirilmagan';
  };

  const getCourseName = (course: unknown): string => {
    if (!course) return 'Kurs';
    if (typeof course === 'object' && course !== null && 'name' in course) return String((course as Course).name);
    if (typeof course === 'string') {
      const found = courses.find((c) => c._id === course);
      if (found) return found.name;
    }
    return 'Kurs';
  };

  const handleAddStudents = async () => {
    if (selectedToAdd.length === 0) return;
    const currentStudentIds = students.map((s) => s._id);
    const merged = Array.from(new Set([...currentStudentIds, ...selectedToAdd]));
    const res = await groupsApi.addStudents(id, merged);
    if (res.success) {
      toast.success("O'quvchilar guruhga muvaffaqiyatli qo'shildi");
      setIsAddStudentOpen(false);
      setSelectedToAdd([]);
      loadData();
    } else {
      toast.error(res.message || "Xatolik yuz berdi");
    }
  };

  const handleSaveGrades = async () => {
    if (!selectedLesson) {
      toast.error('Iltimos, darsni tanlang');
      return;
    }
    try {
      for (const [studentId, data] of Object.entries(gradesInput)) {
        if (data.score !== undefined && data.score >= 0) {
          await gradesApi.create({
            lesson_id: selectedLesson,
            student_id: studentId,
            score: Number(data.score),
            comment: data.comment,
          });
        }
      }
      toast.success('Baholar muvaffaqiyatli saqlandi');
    } catch {
      toast.error('Baholarni saqlashda xatolik yuz berdi');
    }
  };

  const handleSaveBulkAttendance = async () => {
    if (!selectedLesson) {
      toast.error('Iltimos, darsni tanlang');
      return;
    }
    const records = Object.entries(attendanceRecords).map(([student_id, status]) => ({
      student_id,
      status,
    }));
    const res = await attendanceApi.createBulk({
      lesson_id: selectedLesson,
      records,
    });
    if (res.success) {
      toast.success('Davomat saqlandi (+30 koin birinchi marta kelganlarga avtomatik berildi)');
    } else {
      toast.error(res.message || "Davomatni saqlashda xatolik");
    }
  };

  const teachers = allUsers.filter((u) => u.role === 'teacher');
  const filteredCandidates = allStudents.filter((std) =>
    `${std.first_name} ${std.last_name} ${std.phone}`.toLowerCase().includes(studentSearch.toLowerCase())
  );

  // Ushbu guruh hozir biriktirilgan BARCHA xonalarni topish (ClassRoom.group_id massivi ichidan).
  // Odatda faqat 1 ta bo'lishi kerak, lekin eski (tuzatilgunga qadar) ma'lumotlarda
  // guruh bir nechta xonada qolib ketgan bo'lishi mumkin — shuning uchun ro'yxat qilib olamiz,
  // toki foydalanuvchi ortiqchalarini "Chiqarish" orqali tozalay olsin.
  const assignedRooms = rooms.filter((r) =>
    r.group_id.some((g) => (typeof g === 'string' ? g : g._id) === id)
  );
  const currentRoom = assignedRooms[0];

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Guruh bosh kartasi */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
              {getCourseName(group?.course_id)}
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {group?.lesson_time} ({Array.isArray(group?.lesson_days) ? group?.lesson_days.join(', ') : ''})
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                assignedRooms.length === 1
                  ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : assignedRooms.length > 1
                  ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
              }`}
              title={assignedRooms.length > 1 ? "Diqqat: guruh bir nechta xonada birikkan, 'Xona biriktirish' oynasidan ortiqchasini chiqarib tashlang" : undefined}
            >
              <DoorOpen className="w-3.5 h-3.5" />
              {assignedRooms.length === 0
                ? 'Xona biriktirilmagan'
                : assignedRooms.length === 1
                ? currentRoom.name
                : `${assignedRooms.map((r) => r.name).join(', ')} (nomuvofiqlik!)`}
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{group?.name}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            O'qituvchi: <span className="font-medium text-zinc-700 dark:text-zinc-300">{getTeacherName(group?.teacher)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" onClick={() => setIsRoomAssignOpen(true)}>
            <DoorOpen className="w-4 h-4 mr-1.5" /> Xona biriktirish
          </Button>
          <Button variant="secondary" onClick={handleOpenEditModal}>
            <Edit3 className="w-4 h-4 mr-1.5" /> Tahrirlash
          </Button>
          <Button onClick={() => setIsAddStudentOpen(true)}>
            <UserPlus className="w-4 h-4 mr-1.5" /> O'quvchi biriktirish
          </Button>
        </div>
      </div>

      {/* Tablar menyusi */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {[
          { key: 'info', label: `O'quvchilar (${students.length})`, icon: Users },
          { key: 'grades', label: 'Baholash', icon: Award },
          { key: 'attendance', label: 'Davomat', icon: CalendarCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 hover:dark:text-zinc-300'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. O'quvchilar ro'yxati tabi */}
      {activeTab === 'info' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs">
          {students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Guruhda hali o'quvchilar yo'q"
              description="Yuqoridagi 'O'quvchi biriktirish' tugmasi orqali markaz talabalarini ushbu guruhga qo'shing."
            />
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">F.I.SH</th>
                  <th className="px-6 py-3.5">Telefon raqam</th>
                  <th className="px-6 py-3.5">Login</th>
                  <th className="px-6 py-3.5">To'lov holati</th>
                  <th className="px-6 py-3.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {students.map((s) => {
                  const isSuspended = suspendedIds.includes(s._id);

                  return (
                    <tr
                      key={s._id}
                      className={isSuspended ? 'bg-rose-50 dark:bg-rose-500/15/50 hover:bg-rose-50 hover:dark:bg-rose-500/15/70' : 'hover:bg-zinc-50/50 hover:dark:bg-zinc-800/50'}
                    >
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">
                        <div className="flex items-center gap-2">
                          <span>{s.first_name} {s.last_name}</span>
                          {isSuspended && (
                            <span className="text-[10px] bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full font-bold">
                              Muzlatilgan
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 font-mono text-xs">{formatPhone(s.phone)}</td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 font-mono text-xs">{s.login}</td>
                      <td className="px-6 py-4">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/15 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-500/30">
                            <Ban className="w-3.5 h-3.5" /> To'lov qilinmagan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                            <ShieldCheck className="w-3.5 h-3.5" /> To'langan (Faol)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* MUZLATISH / FAOLLASHTIRISH TUGMASI */}
                          <button
                            onClick={() => handleToggleSuspend(s._id, `${s.first_name} ${s.last_name}`)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors shadow-xs ${
                              isSuspended
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200 hover:bg-amber-200 hover:dark:bg-amber-500/25'
                            }`}
                            title={isSuspended ? "To'lov qilindi deb faollashtirish" : "To'lov qilinmagani uchun muzlatish"}
                          >
                            {isSuspended ? 'Faollashtirish' : 'Muzlatish'}
                          </button>

                          {/* GURUHDAN CHIQARISH TUGMASI */}
                          <button
                            onClick={() => handleRemoveStudent(s._id, `${s.first_name} ${s.last_name}`)}
                            className="inline-flex items-center gap-1 p-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-100 hover:dark:bg-rose-500/20 transition-colors"
                            title="Guruhdan chiqarish"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 2. Baholash tabi */}
      {activeTab === 'grades' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs space-y-6">
          {lessons.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Darslar mavjud emas"
              description="Baholash uchun avval ushbu guruhga darslar kiritilgan bo'lishi lozim."
            />
          ) : (
            <>
              <div className="max-w-xs">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Darsni tanlang:
                </label>
                <select
                  value={selectedLesson}
                  onChange={(e) => setSelectedLesson(e.target.value)}
                  className="w-full text-sm font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2"
                >
                  {lessons.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.name} ({l.date})
                    </option>
                  ))}
                </select>
              </div>

              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {students.map((s) => (
                  <div key={s._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {s.first_name} {s.last_name}
                    </span>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Ball (0-100)"
                        value={gradesInput[s._id]?.score ?? ''}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setGradesInput((prev) => ({
                            ...prev,
                            [s._id]: { ...prev[s._id], score: val },
                          }));
                        }}
                        className="w-28 text-sm font-mono border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="O'qituvchi izohi..."
                        value={gradesInput[s._id]?.comment ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGradesInput((prev) => ({
                            ...prev,
                            [s._id]: { ...prev[s._id], comment: val },
                          }));
                        }}
                        className="w-56 text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={handleSaveGrades}>
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Baholarni saqlash
              </Button>
            </>
          )}
        </div>
      )}

      {/* 3. Davomat tabi */}
      {activeTab === 'attendance' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs space-y-6">
          {lessons.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="Darslar mavjud emas"
              description="Davomat belgilash uchun avval ushbu guruhga darslar qo'shilgan bo'lishi kerak."
            />
          ) : (
            <>
              <div className="max-w-xs">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Darsni tanlang:
                </label>
                <select
                  value={selectedLesson}
                  onChange={(e) => setSelectedLesson(e.target.value)}
                  className="w-full text-sm font-medium bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2"
                >
                  {lessons.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.name} ({l.date})
                    </option>
                  ))}
                </select>
              </div>

              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {students.map((s) => (
                  <div key={s._id} className="py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {s.first_name} {s.last_name}
                    </span>
                    <div className="flex gap-1.5">
                      {(['keldi', 'kechikdi', 'sababli', 'kelmadi'] as AttendanceStatus[]).map((status) => {
                        const active = attendanceRecords[s._id] === status;
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() =>
                              setAttendanceRecords((prev) => ({ ...prev, [s._id]: status }))
                            }
                            className={`text-xs px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
                              active
                                ? status === 'keldi'
                                  ? 'bg-emerald-600 text-white'
                                  : status === 'kechikdi'
                                  ? 'bg-amber-500 text-white'
                                  : status === 'sababli'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-rose-600 text-white'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 hover:dark:bg-zinc-700'
                            }`}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={handleSaveBulkAttendance}>
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Davomatni saqlash
              </Button>
            </>
          )}
        </div>
      )}

      {/* Guruhni tahrirlash modali */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Guruh ma'lumotlarini tahrirlash"
      >
        <form onSubmit={handleUpdateGroup} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Guruh nomi (kamida 5 belgi)</label>
            <input
              required
              minLength={5}
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Kurs</label>
            <select
              required
              value={editForm.course_id}
              onChange={(e) => setEditForm({ ...editForm, course_id: e.target.value })}
              className="w-full text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            >
              <option value="">Kursni tanlang</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">O'qituvchi</label>
            <select
              value={editForm.teacher}
              onChange={(e) => setEditForm({ ...editForm, teacher: e.target.value })}
              className="w-full text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            >
              <option value="">O'qituvchini biriktirish (ixtiyoriy)</option>
              {teachers.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.first_name} {t.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Dars vaqti</label>
            <input
              required
              value={editForm.lesson_time}
              onChange={(e) => setEditForm({ ...editForm, lesson_time: e.target.value })}
              placeholder="Masalan: 09:00 - 11:00"
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Dars kunlari</label>
            <div className="flex flex-wrap gap-2">
              {['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'].map((d) => {
                const active = editForm.lesson_days.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDayToggle(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 hover:dark:bg-zinc-700'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <Button type="submit" className="w-full mt-2">
            O'zgarishlarni saqlash
          </Button>
        </form>
      </Modal>

      {/* O'quvchi qo'shish modali */}
      <Modal
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        title="Guruhga yangi o'quvchi biriktirish"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Ism, familiya yoki telefon..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredCandidates.map((std) => {
              const isAlreadyIn = students.some((s) => s._id === std._id);
              const isSelected = selectedToAdd.includes(std._id);

              return (
                <div key={std._id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 block">
                      {std.first_name} {std.last_name}
                    </span>
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">{formatPhone(std.phone)}</span>
                  </div>

                  {isAlreadyIn ? (
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                      Guruhda mavjud
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedToAdd((prev) =>
                          isSelected ? prev.filter((i) => i !== std._id) : [...prev, std._id]
                        )
                      }
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 hover:dark:bg-zinc-700'
                      }`}
                    >
                      {isSelected ? 'Tanlandi' : 'Tanlash'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <Button
            onClick={handleAddStudents}
            disabled={selectedToAdd.length === 0}
            className="w-full mt-2"
          >
            Tanlanganlarni guruhga qo'shish ({selectedToAdd.length})
          </Button>
        </div>
      </Modal>

      {/* Xona biriktirish modali */}
      <Modal
        isOpen={isRoomAssignOpen}
        onClose={() => setIsRoomAssignOpen(false)}
        title="Guruhga xona biriktirish"
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Kun va vaqt to'qnashib qolsa, tizim xonani biriktirishga yo'l qo'ymaydi va sababini ko'rsatadi.
          </p>

          {rooms.length === 0 ? (
            <EmptyState
              icon={DoorOpen}
              title="Xonalar mavjud emas"
              description="Avval 'Tizim boshqaruvi' bo'limidan xona qo'shing."
            />
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
              {rooms.map((room) => {
                const isAssignedHere = assignedRooms.some((r) => r._id === room._id);
                const isAssigning = assigningRoomId === room._id;
                const isRemoving = removingRoomId === room._id;

                return (
                  <div key={room._id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 block">{room.name}</span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">Sig'im: {room.size} kishi &middot; Band guruhlar: {room.group_id.length}</span>
                    </div>

                    {isAssignedHere ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 px-2.5 py-1 rounded-md font-medium">
                          Hozirgi xona
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isRemoving}
                          onClick={() => handleUnassignRoom(room._id)}
                        >
                          {isRemoving ? 'Chiqarilmoqda...' : 'Chiqarish'}
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={isAssigning}
                        onClick={() => handleAssignRoom(room._id)}
                      >
                        {isAssigning ? 'Biriktirilmoqda...' : 'Biriktirish'}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
