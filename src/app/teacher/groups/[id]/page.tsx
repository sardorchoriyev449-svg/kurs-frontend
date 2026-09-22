'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  groupsApi,
  coursesApi,
  lessonsApi,
  topicsApi,
  homeworkAssignmentsApi,
  homeworkApi,
  uploadApi,
  attendanceApi,
  gradesApi
} from '@/lib/api';
import {
  Group,
  Course,
  Lesson,
  Topic,
  User,
  HomeworkAssignment,
  Homework,
  AttendanceStatus
} from '@/types';
import { getRelationId } from '@/lib/utils';
import { suspensionManager } from '@/lib/suspension';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Badge, EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  BookOpen,
  Plus,
  FileCheck,
  Award,
  CalendarCheck,
  FileText,
  CheckCircle2,
  Trash2,
  Edit3,
  ExternalLink,
  Clock,
  Paperclip,
  Users,
  ShieldCheck,
  Ban
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function TeacherGroupFullManagementPage() {
  const { id: groupId } = useParams<{ id: string }>();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'students' | 'lessons' | 'homework' | 'grades' | 'attendance'>('students');
  const [group, setGroup] = useState<Group | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [allGroupStudents, setAllGroupStudents] = useState<User[]>([]); // Guruhdagi barcha o'quvchilar
  const [activeStudents, setActiveStudents] = useState<User[]>([]);     // Faqat to'lov qilgan faollar
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // 1. Dars qo'shish modal holati
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [lessonForm, setLessonForm] = useState({
    name: '',
    description: '',
    topic_mode: 'select' as 'select' | 'custom',
    topic_id: '',
    new_topic_name: '',
    date: new Date().toISOString().split('T')[0],
    video_uri: '',
    file_uri: '',
  });
  const [newLessonAttendance, setNewLessonAttendance] = useState<{ [studentId: string]: AttendanceStatus }>({});
  
  // Darsni tahrirlash modal holati
  const [isLessonEditOpen, setIsLessonEditOpen] = useState(false);
  const [activeEditLesson, setActiveEditLesson] = useState<Lesson | null>(null);
  const [lessonEditForm, setLessonEditForm] = useState({ name: '', description: '', date: '' });

  // 2. Uy vazifasi yaratish modal holati
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    topic_id: '',
    attachment: '',
    due_date: '',
  });

  // 3. Vazifani tekshirish holati
  const [activeAssignmentForReview, setActiveAssignmentForReview] = useState<HomeworkAssignment | null>(null);
  const [reviewList, setReviewList] = useState<{ student: User; submission: Homework | null }[]>([]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedSubmissionToGrade, setSelectedSubmissionToGrade] = useState<Homework | null>(null);
  const [gradeActionForm, setGradeActionForm] = useState({
    status: 'accepted' as 'accepted' | 'rejected',
    score: 80,
    teacher_comment: ''
  });

  // 4. Baholar & Davomat form holatlari
  const [gradesInput, setGradesInput] = useState<{ [studentId: string]: { score: number; comment: string } }>({});
  const [attendanceEditRecords, setAttendanceEditRecords] = useState<{ [studentId: string]: AttendanceStatus }>({});

  const formatPhone = (phone?: string) => {
    if (!phone) return '-';
    if (phone.startsWith('+')) return phone;
    if (phone.startsWith('998')) return `+${phone}`;
    return `+998 ${phone}`;
  };

  const getFileUrl = (path?: string) => {
    if (!path) return '#';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const getCourseName = (course: unknown): string => {
    if (!course) return 'Kurs';
    if (typeof course === 'object' && course !== null && 'name' in course) {
      return String((course as Course).name);
    }
    if (typeof course === 'string') {
      const found = courses.find((c) => c._id === course);
      if (found) return found.name;
    }
    return 'Kurs';
  };

  const getTopicDisplayName = (topic: unknown): string | null => {
    if (!topic) return null;
    if (typeof topic === 'object' && topic !== null && 'name' in topic) {
      return String((topic as { name: unknown }).name);
    }
    const found = topics.find((t) => t._id === String(topic));
    return found ? found.name : null;
  };

  const loadData = useCallback(async () => {
    try {
      const [grpRes, stdRes, lsnRes, hmwRes, crsRes] = await Promise.all([
        groupsApi.getOne(groupId),
        groupsApi.getStudents(groupId),
        lessonsApi.getByGroup(groupId),
        homeworkAssignmentsApi.getByGroup(groupId),
        coursesApi.getAll(),
      ]);

      if (crsRes.success && crsRes.data) setCourses(crsRes.data);

      if (grpRes.success && grpRes.data) {
        setGroup(grpRes.data);
        const courseId = getRelationId(grpRes.data.course_id);
        if (courseId) {
          const topRes = await topicsApi.getByCourse(courseId);
          if (topRes.success && topRes.data) setTopics(topRes.data);
        }
      }

      if (stdRes.success && stdRes.data) {
        setAllGroupStudents(stdRes.data);

        // Faol o'quvchilar (to'lov qilganlar)
        const actives = stdRes.data.filter(
          (s) => !suspensionManager.isSuspended(groupId, s._id)
        );
        setActiveStudents(actives);

        const attMap: { [id: string]: AttendanceStatus } = {};
        actives.forEach((s) => { attMap[s._id] = 'keldi'; });
        setNewLessonAttendance(attMap);
        setAttendanceEditRecords(attMap);
      }

      if (lsnRes.success && lsnRes.data) {
        setLessons(lsnRes.data);
        if (lsnRes.data.length > 0 && !selectedLessonId) {
          setSelectedLessonId(lsnRes.data[0]._id);
        }
      }

      if (hmwRes.success && hmwRes.data) setAssignments(hmwRes.data);
    } catch (err) {
      console.error("Guruh yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  }, [groupId, selectedLessonId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tanlangan dars bo'yicha baholar va davomatni yuklash
  useEffect(() => {
    async function loadLessonGradesAndAttendance() {
      if (!selectedLessonId) return;

      try {
        const [grdRes, attRes] = await Promise.all([
          gradesApi.getByLesson(selectedLessonId),
          attendanceApi.getByLesson(selectedLessonId),
        ]);

        const loadedGrades: { [studentId: string]: { score: number; comment: string } } = {};
        if (grdRes.success && grdRes.data) {
          grdRes.data.forEach((g) => {
            const sid = typeof g.student_id === 'string' ? g.student_id : g.student_id?._id;
            if (sid) {
              loadedGrades[sid] = { score: g.score, comment: g.comment || '' };
            }
          });
        }
        setGradesInput(loadedGrades);

        const loadedAtt: { [studentId: string]: AttendanceStatus } = {};
        activeStudents.forEach((s) => { loadedAtt[s._id] = 'keldi'; });

        if (attRes.success && attRes.data) {
          attRes.data.forEach((a) => {
            const sid = typeof a.student_id === 'string' ? a.student_id : a.student_id?._id;
            if (sid) {
              loadedAtt[sid] = a.status;
            }
          });
        }
        setAttendanceEditRecords(loadedAtt);
      } catch (err) {
        console.error("Dars tafsilotlari yuklanmadi:", err);
      }
    }

    loadLessonGradesAndAttendance();
  }, [selectedLessonId, activeStudents]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, onSuccess: (path: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const res = await uploadApi.uploadFile(file);
    if (res.success && res.data) {
      onSuccess(res.data.path);
      toast.success("Fayl yuklandi");
    } else {
      toast.error(res.message || "Fayl yuklanmadi");
    }
    setIsUploading(false);
  };

  const handleSaveLessonWithAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    let finalTopicId = lessonForm.topic_id || undefined;

    if (lessonForm.topic_mode === 'custom' && lessonForm.new_topic_name.trim()) {
      const courseId = getRelationId(group?.course_id);
      const topRes = await topicsApi.create({
        course_id: courseId,
        name: lessonForm.new_topic_name.trim()
      });
      if (topRes.success && topRes.data) {
        finalTopicId = topRes.data._id;
      }
    }

    const lsnRes = await lessonsApi.create({
      name: lessonForm.name,
      description: lessonForm.description,
      group_id: groupId,
      topic_id: finalTopicId,
      date: lessonForm.date,
      video_uri: lessonForm.video_uri || undefined,
      file_uri: lessonForm.file_uri || undefined,
    });

    if (lsnRes.success && lsnRes.data) {
      const bulkRecords = Object.entries(newLessonAttendance).map(([student_id, status]) => ({
        student_id,
        status,
      }));
      if (bulkRecords.length > 0) {
        await attendanceApi.createBulk({
          lesson_id: lsnRes.data._id,
          records: bulkRecords
        });
      }
      toast.success("Dars yaratildi va davomat belgilandi!");
      setIsLessonModalOpen(false);
      setLessonForm({
        name: '',
        description: '',
        topic_mode: 'select',
        topic_id: '',
        new_topic_name: '',
        date: new Date().toISOString().split('T')[0],
        video_uri: '',
        file_uri: '',
      });
      loadData();
    } else {
      toast.error(lsnRes.message || "Xatolik yuz berdi");
    }
  };

  const openEditLesson = (lesson: Lesson) => {
    setActiveEditLesson(lesson);
    setLessonEditForm({
      name: lesson.name,
      description: lesson.description,
      date: lesson.date,
    });
    setIsLessonEditOpen(true);
  };

  const handleUpdateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditLesson) return;
    const res = await lessonsApi.update(activeEditLesson._id, lessonEditForm);
    if (res.success) {
      toast.success("Dars muvaffaqiyatli yangilandi");
      setIsLessonEditOpen(false);
      loadData();
    } else {
      toast.error(res.message || "Yangilab bo'lmadi");
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Ushbu darsni o'chirmoqchimisiz?")) return;
    const res = await lessonsApi.delete(lessonId);
    if (res.success) {
      toast.success("Dars o'chirildi");
      loadData();
    } else {
      toast.error(res.message || "O'chirib bo'lmadi");
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await homeworkAssignmentsApi.create({
      group_id: groupId,
      title: assignmentForm.title,
      description: assignmentForm.description,
      topic_id: assignmentForm.topic_id || undefined,
      attachment: assignmentForm.attachment || undefined,
      due_date: assignmentForm.due_date || undefined,
    });
    if (res.success) {
      toast.success("Yangi vazifa yaratildi!");
      setIsAssignmentModalOpen(false);
      setAssignmentForm({ title: '', description: '', topic_id: '', attachment: '', due_date: '' });
      loadData();
    } else {
      toast.error(res.message || "Vazifa yaratilmadi");
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("Ushbu uy vazifasini butunlay o'chirmoqchimisiz?")) return;
    const res = await homeworkAssignmentsApi.delete(assignmentId);
    if (res.success) {
      toast.success("Vazifa o'chirildi");
      loadData();
    } else {
      toast.error(res.message || "O'chirib bo'lmadi");
    }
  };

  const openReviewModal = async (assignment: HomeworkAssignment) => {
    setActiveAssignmentForReview(assignment);
    const res = await homeworkAssignmentsApi.getStatus(assignment._id);
    if (res.success && res.data) {
      const activeReviewList = res.data.filter(
        (item) => !suspensionManager.isSuspended(groupId, item.student._id)
      );
      setReviewList(activeReviewList);
      setReviewModalOpen(true);
    } else {
      toast.error("Ma'lumotlarni yuklab bo'lmadi");
    }
  };

  const handleReviewSubmission = async () => {
    if (!selectedSubmissionToGrade || !activeAssignmentForReview) return;
    const res = await homeworkApi.review(
      activeAssignmentForReview._id,
      selectedSubmissionToGrade._id,
      {
        status: gradeActionForm.status,
        score: gradeActionForm.status === 'accepted' ? Number(gradeActionForm.score) : 0,
        teacher_comment: gradeActionForm.teacher_comment
      }
    );
    if (res.success) {
      toast.success("Javob tekshirildi va ball qo'yildi");
      setSelectedSubmissionToGrade(null);
      const updated = await homeworkAssignmentsApi.getStatus(activeAssignmentForReview._id);
      if (updated.success && updated.data) {
        const activeReviewList = updated.data.filter(
          (item) => !suspensionManager.isSuspended(groupId, item.student._id)
        );
        setReviewList(activeReviewList);
      }
      loadData();
    } else {
      toast.error(res.message || "Tekshirishda xatolik");
    }
  };

  const handleSaveGradesTab = async () => {
    if (!selectedLessonId) {
      toast.error("Darsni tanlang");
      return;
    }
    try {
      for (const [studentId, data] of Object.entries(gradesInput)) {
        if (data.score !== undefined && data.score >= 0) {
          await gradesApi.create({
            lesson_id: selectedLessonId,
            student_id: studentId,
            score: Number(data.score),
            comment: data.comment,
          });
        }
      }
      toast.success("Baholar saqlandi");
    } catch {
      toast.error("Baholarni saqlashda xatolik");
    }
  };

  const handleSaveAttendanceTab = async () => {
    if (!selectedLessonId) {
      toast.error("Darsni tanlang");
      return;
    }
    const records = Object.entries(attendanceEditRecords).map(([student_id, status]) => ({
      student_id,
      status
    }));
    const res = await attendanceApi.createBulk({
      lesson_id: selectedLessonId,
      records
    });
    if (res.success) {
      toast.success("Davomat muvaffaqiyatli yangilandi");
    } else {
      toast.error(res.message || "Davomat yangilanmadi");
    }
  };

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
      {/* Sarlavha qismi */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {getCourseName(group?.course_id)}
            </span>
            <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {group?.lesson_time} ({Array.isArray(group?.lesson_days) ? group?.lesson_days.join(', ') : ''})
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{group?.name}</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Guruh a'zolari: <span className="font-semibold text-zinc-700">{allGroupStudents.length} nafar o'quvchi</span> ({activeStudents.length} nafari faol)
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsLessonModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Dars & Davomat
          </Button>
          <Button variant="secondary" onClick={() => setIsAssignmentModalOpen(true)}>
            <FileCheck className="w-4 h-4 mr-1.5" /> Yangi vazifa
          </Button>
        </div>
      </div>

      {/* Tablar */}
      <div className="flex items-center gap-2 border-b border-zinc-200 overflow-x-auto">
        {[
          { key: 'students', label: `O'quvchilar (${allGroupStudents.length})`, icon: Users },
          { key: 'lessons', label: `Darslar (${lessons.length})`, icon: BookOpen },
          { key: 'homework', label: `Vazifalar (${assignments.length})`, icon: FileCheck },
          { key: 'grades', label: 'Baholash', icon: Award },
          { key: 'attendance', label: 'Davomatni tuzatish', icon: CalendarCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                active ? 'border-indigo-600 text-indigo-600 font-semibold' : 'border-transparent text-zinc-500 hover:text-zinc-700'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* 0. O'quvchilar Tabi (YANGI QO'SHILDI) */}
      {activeTab === 'students' && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-xs">
          {allGroupStudents.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Guruhda hali o'quvchilar yo'q"
              description="Administrator hali bu guruhga talabalarni biriktirmagan."
            />
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">F.I.SH</th>
                  <th className="px-6 py-3.5">Telefon raqam</th>
                  <th className="px-6 py-3.5">Login</th>
                  <th className="px-6 py-3.5 text-right">To'lov / Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {allGroupStudents.map((std) => {
                  const isSuspended = suspensionManager.isSuspended(groupId, std._id);

                  return (
                    <tr key={std._id} className={isSuspended ? 'bg-rose-50/40' : 'hover:bg-zinc-50/50'}>
                      <td className="px-6 py-4 font-medium text-zinc-900">
                        {std.first_name} {std.last_name}
                      </td>
                      <td className="px-6 py-4 text-zinc-500 font-mono text-xs">{formatPhone(std.phone)}</td>
                      <td className="px-6 py-4 text-zinc-500 font-mono text-xs">{std.login}</td>
                      <td className="px-6 py-4 text-right">
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                            <Ban className="w-3.5 h-3.5" /> To'lov qilinmagan (Muzlatilgan)
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
          )}
        </div>
      )}

      {/* 1. Darslar Tabi */}
      {activeTab === 'lessons' && (
        <div className="space-y-4">
          {lessons.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Darslar mavjud emas"
              description="Yuqoridagi 'Dars & Davomat' tugmasi orqali yangi dars qo'shing."
            />
          ) : (
            lessons.map((lesson) => {
              const topicName = getTopicDisplayName(lesson.topic_id);

              return (
                <div key={lesson._id} className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-mono text-zinc-400">{lesson.date}</span>
                        {topicName && <Badge variant="zinc">{topicName}</Badge>}
                      </div>
                      <h3 className="text-base font-bold text-zinc-900">{lesson.name}</h3>
                      <p className="text-sm text-zinc-600 mt-1 whitespace-pre-line leading-relaxed">
                        {lesson.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditLesson(lesson)}
                        className="p-1.5 text-zinc-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                        title="Tahrirlash"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLesson(lesson._id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {(lesson.video_uri || lesson.file_uri) && (
                    <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-wrap items-center gap-4 text-xs">
                      {lesson.video_uri && (
                        <a
                          href={getFileUrl(lesson.video_uri)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-1 font-medium"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Video darsni ochish
                        </a>
                      )}
                      {lesson.file_uri && (
                        <a
                          href={getFileUrl(lesson.file_uri)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-zinc-700 hover:underline flex items-center gap-1 font-medium"
                        >
                          <Paperclip className="w-3.5 h-3.5" /> Biriktirilgan faylni yuklab olish
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 2. Uy Vazifalari Tabi */}
      {activeTab === 'homework' && (
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <EmptyState
              icon={FileCheck}
              title="Vazifalar berilmagan"
              description="O'quvchilar bilimini mustahkamlash uchun yangi vazifa e'lon qiling."
            />
          ) : (
            assignments.map((assignment) => {
              const topicName = getTopicDisplayName(assignment.topic_id);

              return (
                <div
                  key={assignment._id}
                  className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Muddat: {assignment.due_date || 'Belgilanmagan'}
                      </span>
                      {topicName && <Badge variant="zinc">{topicName}</Badge>}
                    </div>
                    <h3 className="text-base font-bold text-zinc-900">{assignment.title}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5 max-w-xl">{assignment.description}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs">
                      <span className="text-indigo-600 font-medium">
                        Topshirganlar: {assignment.submitted_count || 0} ta
                      </span>
                      <span className="text-emerald-600 font-medium">
                        Qabul qilingan: {assignment.accepted_count || 0} ta
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <Button size="sm" onClick={() => openReviewModal(assignment)}>
                      Javoblarni tekshirish
                    </Button>
                    <button
                      onClick={() => handleDeleteAssignment(assignment._id)}
                      className="p-2 text-zinc-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 3. Baholash Tabi */}
      {activeTab === 'grades' && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          {lessons.length === 0 ? (
            <EmptyState
              icon={Award}
              title="Darslar mavjud emas"
              description="Baholash uchun avval ushbu guruhga darslar qo'shilgan bo'lishi lozim."
            />
          ) : (
            <>
              <div className="max-w-xs">
                <label className="block text-xs font-medium text-zinc-700 mb-1">Darsni tanlang</label>
                <select
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="w-full text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2"
                >
                  {lessons.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.name} ({l.date})
                    </option>
                  ))}
                </select>
              </div>

              <div className="divide-y divide-zinc-100">
                {activeStudents.map((s) => (
                  <div key={s._id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-sm font-medium text-zinc-900">{s.first_name} {s.last_name}</span>
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
                        className="w-28 text-sm font-mono border border-zinc-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Izoh..."
                        value={gradesInput[s._id]?.comment ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGradesInput((prev) => ({
                            ...prev,
                            [s._id]: { ...prev[s._id], comment: val },
                          }));
                        }}
                        className="w-56 text-sm border border-zinc-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={handleSaveGradesTab}>
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Baholarni saqlash
              </Button>
            </>
          )}
        </div>
      )}

      {/* 4. Davomatni Tuzatish Tabi */}
      {activeTab === 'attendance' && (
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          {lessons.length === 0 ? (
            <EmptyState
              icon={CalendarCheck}
              title="Darslar mavjud emas"
              description="Davomat belgilash uchun avval ushbu guruhga darslar qo'shilgan bo'lishi kerak."
            />
          ) : (
            <>
              <div className="max-w-xs">
                <label className="block text-xs font-medium text-zinc-700 mb-1">Darsni tanlang</label>
                <select
                  value={selectedLessonId}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="w-full text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2"
                >
                  {lessons.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.name} ({l.date})
                    </option>
                  ))}
                </select>
              </div>

              <div className="divide-y divide-zinc-100">
                {activeStudents.map((s) => (
                  <div key={s._id} className="py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-900">{s.first_name} {s.last_name}</span>
                    <div className="flex gap-1.5">
                      {(['keldi', 'kechikdi', 'sababli', 'kelmadi'] as AttendanceStatus[]).map((st) => {
                        const active = attendanceEditRecords[s._id] === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setAttendanceEditRecords((prev) => ({ ...prev, [s._id]: st }))}
                            className={`text-xs px-3 py-1.5 rounded-lg capitalize font-medium transition-colors ${
                              active
                                ? st === 'keldi'
                                  ? 'bg-emerald-600 text-white'
                                  : st === 'kechikdi'
                                  ? 'bg-amber-500 text-white'
                                  : st === 'sababli'
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-rose-600 text-white'
                                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                            }`}
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={handleSaveAttendanceTab}>
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Davomatni yangilash
              </Button>
            </>
          )}
        </div>
      )}

      {/* Modal: Vazifa yaratish */}
      <Modal isOpen={isAssignmentModalOpen} onClose={() => setIsAssignmentModalOpen(false)} title="Yangi uy vazifasi yaratish">
        <form onSubmit={handleCreateAssignment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Mavzu nomi / Sarlavha</label>
            <input
              required
              value={assignmentForm.title}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
              placeholder="Masalan: Array metodlari bo'yicha 5 ta masala"
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">O'quv rejadagi mavzu (ixtiyoriy)</label>
            <select
              value={assignmentForm.topic_id}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, topic_id: e.target.value })}
              className="w-full text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2"
            >
              <option value="">Tanlang</option>
              {topics.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Topshirish muddati (Due Date)</label>
            <input
              type="date"
              value={assignmentForm.due_date}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Vazifa sharti va tavsifi</label>
            <textarea
              rows={3}
              required
              value={assignmentForm.description}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Namuna yoki manba fayl (zip, pdf)</label>
            <input
              type="file"
              onChange={(e) => handleUpload(e, (p) => setAssignmentForm((prev) => ({ ...prev, attachment: p })))}
              className="text-xs text-zinc-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-zinc-100"
            />
            {assignmentForm.attachment && <span className="text-[11px] text-emerald-600 block mt-1">Fayl biriktirildi</span>}
          </div>

          <Button type="submit" isLoading={isUploading} className="w-full">
            E'lon qilish
          </Button>
        </form>
      </Modal>

      {/* Modal: Vazifa javoblarini tekshirish */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedSubmissionToGrade(null);
        }}
        title={`Tekshiruv: ${activeAssignmentForReview?.title}`}
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="divide-y divide-zinc-100 max-h-96 overflow-y-auto">
            {reviewList.map(({ student, submission }) => (
              <div key={student._id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900">{student.first_name} {student.last_name}</h4>
                  {submission ? (
                    <div className="text-xs text-zinc-500 mt-0.5 space-y-1">
                      <p className="truncate max-w-sm"><span className="text-zinc-700">Izoh:</span> {submission.description}</p>
                      {submission.file_name && (
                        <a
                          href={getFileUrl(submission.file_name)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline flex items-center gap-1 font-medium"
                        >
                          <FileText className="w-3.5 h-3.5" /> Yuborilgan faylni ko'rish
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-rose-500 font-medium">Topshirmagan</span>
                  )}
                </div>

                <div>
                  {submission ? (
                    <div className="flex items-center gap-2">
                      <Badge variant={submission.status === 'accepted' ? 'emerald' : submission.status === 'rejected' ? 'rose' : 'amber'}>
                        {submission.status === 'accepted' ? `${submission.score} ball` : submission.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedSubmissionToGrade(submission);
                          setGradeActionForm({
                            status: submission.status === 'rejected' ? 'rejected' : 'accepted',
                            score: submission.score || 80,
                            teacher_comment: submission.teacher_comment || ''
                          });
                        }}
                      >
                        Baholash
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-300">-</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {selectedSubmissionToGrade && (
            <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-3 mt-4">
              <h5 className="text-xs font-bold text-zinc-800 uppercase tracking-wider">Topshiriqni baholash</h5>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Qaror</label>
                  <select
                    value={gradeActionForm.status}
                    onChange={(e) => setGradeActionForm({ ...gradeActionForm, status: e.target.value as any })}
                    className="w-full text-xs bg-white border border-zinc-200 rounded-lg px-2.5 py-1.5"
                  >
                    <option value="accepted">Qabul qilish</option>
                    <option value="rejected">Qaytarish (Rad etish)</option>
                  </select>
                </div>
                {gradeActionForm.status === 'accepted' && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1">Ball (0-100)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={gradeActionForm.score}
                      onChange={(e) => setGradeActionForm({ ...gradeActionForm, score: Number(e.target.value) })}
                      className="w-full text-xs border border-zinc-200 rounded-lg px-2.5 py-1.5"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">O'qituvchi fikri / izoh</label>
                <input
                  value={gradeActionForm.teacher_comment}
                  onChange={(e) => setGradeActionForm({ ...gradeActionForm, teacher_comment: e.target.value })}
                  placeholder="Yaxshi yozilgan, ammo..."
                  className="w-full text-xs border border-zinc-200 rounded-lg px-2.5 py-1.5"
                />
              </div>
              <Button size="sm" onClick={handleReviewSubmission}>
                Tasdiqlash
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal: Yangi Dars + Davomat */}
      <Modal
        isOpen={isLessonModalOpen}
        onClose={() => setIsLessonModalOpen(false)}
        title="Dars yaratish & Davomat"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveLessonWithAttendance} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Dars nomi</label>
              <input
                required
                value={lessonForm.name}
                onChange={(e) => setLessonForm({ ...lessonForm, name: e.target.value })}
                className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Sana</label>
              <input
                type="date"
                required
                value={lessonForm.date}
                onChange={(e) => setLessonForm({ ...lessonForm, date: e.target.value })}
                className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
              />
            </div>
          </div>

          <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-800">Dars mavzusi</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setLessonForm({ ...lessonForm, topic_mode: 'select' })}
                  className={`text-xs px-2.5 py-1 rounded-lg ${lessonForm.topic_mode === 'select' ? 'bg-white shadow-xs text-indigo-600 font-bold' : 'text-zinc-500'}`}
                >
                  Rejadan
                </button>
                <button
                  type="button"
                  onClick={() => setLessonForm({ ...lessonForm, topic_mode: 'custom' })}
                  className={`text-xs px-2.5 py-1 rounded-lg ${lessonForm.topic_mode === 'custom' ? 'bg-white shadow-xs text-indigo-600 font-bold' : 'text-zinc-500'}`}
                >
                  + Yangi
                </button>
              </div>
            </div>

            {lessonForm.topic_mode === 'select' ? (
              <select
                value={lessonForm.topic_id}
                onChange={(e) => setLessonForm({ ...lessonForm, topic_id: e.target.value })}
                className="w-full text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2"
              >
                <option value="">Tanlang (ixtiyoriy)</option>
                {topics.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            ) : (
              <input
                placeholder="Yangi mavzu nomini yozing..."
                value={lessonForm.new_topic_name}
                onChange={(e) => setLessonForm({ ...lessonForm, new_topic_name: e.target.value })}
                className="w-full text-sm bg-white border border-zinc-200 rounded-xl px-3 py-2"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Dars tavsifi</label>
            <textarea
              rows={2}
              required
              value={lessonForm.description}
              onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="border border-zinc-200 rounded-xl p-2.5">
              <label className="block text-xs font-medium text-zinc-700 mb-1">Video dars</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleUpload(e, (p) => setLessonForm((prev) => ({ ...prev, video_uri: p })))}
                className="text-xs text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:bg-zinc-100"
              />
            </div>
            <div className="border border-zinc-200 rounded-xl p-2.5">
              <label className="block text-xs font-medium text-zinc-700 mb-1">Fayl (zip, pdf)</label>
              <input
                type="file"
                onChange={(e) => handleUpload(e, (p) => setLessonForm((prev) => ({ ...prev, file_uri: p })))}
                className="text-xs text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:bg-zinc-100"
              />
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-3">
            <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider mb-2">
              Davomatni belgilash (+30 coin avtomatik)
            </h4>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {activeStudents.map((std) => (
                <div key={std._id} className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 border border-zinc-100">
                  <span className="text-xs font-medium text-zinc-800">{std.first_name} {std.last_name}</span>
                  <div className="flex gap-1">
                    {(['keldi', 'kechikdi', 'sababli', 'kelmadi'] as AttendanceStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setNewLessonAttendance((prev) => ({ ...prev, [std._id]: st }))}
                        className={`text-[11px] px-2 py-0.5 rounded-md font-medium capitalize ${
                          newLessonAttendance[std._id] === st
                            ? st === 'keldi' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-white'
                            : 'bg-white border border-zinc-200 text-zinc-600'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" isLoading={isUploading} className="w-full">
            Dars va davomatni birga saqlash
          </Button>
        </form>
      </Modal>

      {/* Modal: Darsni tahrirlash */}
      <Modal isOpen={isLessonEditOpen} onClose={() => setIsLessonEditOpen(false)} title="Darsni tahrirlash">
        <form onSubmit={handleUpdateLesson} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Dars nomi</label>
            <input
              required
              value={lessonEditForm.name}
              onChange={(e) => setLessonEditForm({ ...lessonEditForm, name: e.target.value })}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Sana</label>
            <input
              type="date"
              required
              value={lessonEditForm.date}
              onChange={(e) => setLessonEditForm({ ...lessonEditForm, date: e.target.value })}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 mb-1">Tavsif</label>
            <textarea
              rows={3}
              required
              value={lessonEditForm.description}
              onChange={(e) => setLessonEditForm({ ...lessonEditForm, description: e.target.value })}
              className="w-full text-sm border border-zinc-200 rounded-xl px-3 py-2"
            />
          </div>
          <Button type="submit" className="w-full">Saqlash</Button>
        </form>
      </Modal>
    </div>
  );
}