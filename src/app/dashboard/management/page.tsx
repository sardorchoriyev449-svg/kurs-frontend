'use client';

import React, { useEffect, useState } from 'react';
import { coursesApi, topicsApi, classRoomsApi, staffApi, groupsApi } from '@/lib/api';
import { Course, Topic, ClassRoom, Staff, Group } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Plus, Trash2, Edit3, Layers, BookCheck, DoorOpen, Briefcase } from 'lucide-react';

export default function ManagementPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'courses' | 'topics' | 'rooms' | 'staff'>('courses');

  // Kurslar
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isCourseEditOpen, setIsCourseEditOpen] = useState(false);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [courseForm, setCourseForm] = useState({ name: '', price: 0, description: '' });

  // Mavzular
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedCourseForTopic, setSelectedCourseForTopic] = useState('');
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [isTopicEditOpen, setIsTopicEditOpen] = useState(false);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [topicForm, setTopicForm] = useState<{ name: string; order: number | ''; description: string }>({ name: '', order: '', description: '' });

  // Xonalar
  const [rooms, setRooms] = useState<ClassRoom[]>([]);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isRoomEditOpen, setIsRoomEditOpen] = useState(false);
  const [activeRoom, setActiveRoom] = useState<ClassRoom | null>(null);
  const [roomForm, setRoomForm] = useState({ name: '', size: 20 });

  // Xodimlar
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isStaffEditOpen, setIsStaffEditOpen] = useState(false);
  const [activeStaff, setActiveStaff] = useState<Staff | null>(null);
  const [staffForm, setStaffForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    position: '',
    salary: 0,
    hire_date: new Date().toISOString().split('T')[0],
  });

  const loadData = async () => {
    const [c, r, s] = await Promise.all([
      coursesApi.getAll(),
      classRoomsApi.getAll(),
      staffApi.getAll(),
    ]);
    if (c.success && c.data) {
      setCourses(c.data);
      if (c.data.length > 0 && !selectedCourseForTopic) {
        setSelectedCourseForTopic(c.data[0]._id);
      }
    }
    if (r.success && r.data) setRooms(r.data);
    if (s.success && s.data) setStaff(s.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadTopics = async (courseId: string) => {
    if (!courseId) return;
    const res = await topicsApi.getByCourse(courseId);
    if (res.success && res.data) setTopics(res.data);
  };

  useEffect(() => {
    if (selectedCourseForTopic) {
      loadTopics(selectedCourseForTopic);
    }
  }, [selectedCourseForTopic]);

  // KURSLAR AMALLARI
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await coursesApi.create(courseForm);
    if (res.success) {
      toast.success("Kurs qo'shildi");
      setIsCourseModalOpen(false);
      setCourseForm({ name: '', price: 0, description: '' });
      loadData();
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse) return;
    const res = await coursesApi.update(activeCourse._id, courseForm);
    if (res.success) {
      toast.success("Kurs yangilandi");
      setIsCourseEditOpen(false);
      loadData();
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Kursni o'chirmoqchimisiz?")) return;
    const res = await coursesApi.delete(id);
    if (res.success) {
      toast.success("Kurs o'chirildi");
      loadData();
    }
  };

  // MAVZULAR AMALLARI
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await topicsApi.create({
      course_id: selectedCourseForTopic,
      name: topicForm.name,
      description: topicForm.description || undefined,
      ...(topicForm.order !== '' ? { order: Number(topicForm.order) } : {}),
    });
    if (res.success) {
      toast.success("Mavzu qo'shildi");
      setIsTopicModalOpen(false);
      setTopicForm({ name: '', order: '', description: '' });
      loadTopics(selectedCourseForTopic);
    }
  };

  const handleUpdateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTopic) return;
    const res = await topicsApi.update(activeTopic._id, {
      name: topicForm.name,
      description: topicForm.description || undefined,
      ...(topicForm.order !== '' ? { order: Number(topicForm.order) } : {}),
    });
    if (res.success) {
      toast.success("Mavzu yangilandi");
      setIsTopicEditOpen(false);
      loadTopics(selectedCourseForTopic);
    }
  };

  // XONALAR AMALLARI
  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await classRoomsApi.create(roomForm);
    if (res.success) {
      toast.success("Xona yaratildi");
      setIsRoomModalOpen(false);
      setRoomForm({ name: '', size: 20 });
      loadData();
    }
  };

  const handleUpdateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoom) return;
    const res = await classRoomsApi.update(activeRoom._id, roomForm);
    if (res.success) {
      toast.success("Xona yangilandi");
      setIsRoomEditOpen(false);
      loadData();
    }
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm("Xonani o'chirmoqchimisiz?")) return;
    const res = await classRoomsApi.delete(id);
    if (res.success) {
      toast.success("Xona o'chirildi");
      loadData();
    }
  };

  // XODIMLAR AMALLARI
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await staffApi.create(staffForm);
    if (res.success) {
      toast.success("Xodim qo'shildi");
      setIsStaffModalOpen(false);
      loadData();
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStaff) return;
    const res = await staffApi.update(activeStaff._id, staffForm);
    if (res.success) {
      toast.success("Xodim ma'lumotlari yangilandi");
      setIsStaffEditOpen(false);
      loadData();
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Xodimni o'chirmoqchimisiz?")) return;
    const res = await staffApi.delete(id);
    if (res.success) {
      toast.success("Xodim o'chirildi");
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Tizim boshqaruvi</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">Kurslar, o'quv rejalari, auditoriyalar va markaz xodimlari</p>
      </div>

      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {[
          { key: 'courses', label: 'Kurslar', icon: Layers },
          { key: 'topics', label: 'O\'quv reja (Mavzular)', icon: BookCheck },
          { key: 'rooms', label: 'Xonalar', icon: DoorOpen },
          { key: 'staff', label: 'Xodimlar', icon: Briefcase },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold' : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 hover:dark:text-zinc-300'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. Kurslar Tabi */}
      {activeTab === 'courses' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setCourseForm({ name: '', price: 0, description: '' });
                setIsCourseModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" /> Yangi kurs
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div key={course._id} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">ID: {course._id.slice(-6)}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setActiveCourse(course);
                          setCourseForm({ name: course.name, price: course.price, description: course.description });
                          setIsCourseEditOpen(true);
                        }}
                        className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-indigo-600 hover:dark:text-indigo-400 rounded-md hover:bg-zinc-100 hover:dark:bg-zinc-800"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(course._id)}
                        className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 hover:dark:text-rose-400 rounded-md hover:bg-zinc-100 hover:dark:bg-zinc-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">{course.name}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{course.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{formatPrice(course.price)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Mavzular Tabi */}
      {activeTab === 'topics' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
            <div className="w-64">
              <select
                value={selectedCourseForTopic}
                onChange={(e) => setSelectedCourseForTopic(e.target.value)}
                className="w-full text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
              >
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <Button
              onClick={() => {
                setTopicForm({ name: '', order: topics.length + 1, description: '' });
                setIsTopicModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" /> Mavzu qo'shish
            </Button>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase">
                <tr>
                  <th className="px-6 py-3.5">Tartib</th>
                  <th className="px-6 py-3.5">Mavzu nomi</th>
                  <th className="px-6 py-3.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {topics.map((t) => (
                  <tr key={t._id}>
                    <td className="px-6 py-4 font-mono text-xs">{t.order}</td>
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">{t.name}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setActiveTopic(t);
                            setTopicForm({ name: t.name, order: t.order, description: t.description || '' });
                            setIsTopicEditOpen(true);
                          }}
                          className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-indigo-600 hover:dark:text-indigo-400 rounded-lg hover:bg-indigo-50 hover:dark:bg-indigo-500/15"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm("Mavzuni o'chirasizmi?")) {
                              await topicsApi.delete(t._id);
                              loadTopics(selectedCourseForTopic);
                            }
                          }}
                          className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 hover:dark:text-rose-400 rounded-lg hover:bg-rose-50 hover:dark:bg-rose-500/15"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Xonalar Tabi */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setRoomForm({ name: '', size: 20 });
                setIsRoomModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" /> Xona qo'shish
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <div key={room._id} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">Sig'im: {room.size} kishi</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setActiveRoom(room);
                          setRoomForm({ name: room.name, size: room.size });
                          setIsRoomEditOpen(true);
                        }}
                        className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-indigo-600 hover:dark:text-indigo-400 rounded-md hover:bg-zinc-100 hover:dark:bg-zinc-800"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room._id)}
                        className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 hover:dark:text-rose-400 rounded-md hover:bg-zinc-100 hover:dark:bg-zinc-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-50">{room.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Xodimlar Tabi */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setStaffForm({
                  first_name: '',
                  last_name: '',
                  phone: '',
                  position: '',
                  salary: 0,
                  hire_date: new Date().toISOString().split('T')[0],
                });
                setIsStaffModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" /> Xodim qo'shish
            </Button>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200/80 dark:border-zinc-800/80 text-zinc-500 dark:text-zinc-400 text-xs font-semibold uppercase">
                <tr>
                  <th className="px-6 py-3.5">F.I.SH</th>
                  <th className="px-6 py-3.5">Lavozim</th>
                  <th className="px-6 py-3.5">Telefon</th>
                  <th className="px-6 py-3.5">Oylik maosh</th>
                  <th className="px-6 py-3.5 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {staff.map((st) => (
                  <tr key={st._id}>
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-50">{st.first_name} {st.last_name}</td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{st.position}</td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 font-mono text-xs">{st.phone}</td>
                    <td className="px-6 py-4 font-bold text-zinc-900 dark:text-zinc-50">{formatPrice(st.salary)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setActiveStaff(st);
                            setStaffForm({
                              first_name: st.first_name,
                              last_name: st.last_name,
                              phone: st.phone,
                              position: st.position,
                              salary: st.salary,
                              hire_date: st.hire_date || '',
                            });
                            setIsStaffEditOpen(true);
                          }}
                          className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-indigo-600 hover:dark:text-indigo-400 rounded-lg hover:bg-indigo-50 hover:dark:bg-indigo-500/15"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStaff(st._id)}
                          className="p-1.5 text-zinc-400 dark:text-zinc-500 hover:text-rose-600 hover:dark:text-rose-400 rounded-lg hover:bg-rose-50 hover:dark:bg-rose-500/15"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kurs qo'shish / tahrirlash modali */}
      <Modal
        isOpen={isCourseModalOpen || isCourseEditOpen}
        onClose={() => { setIsCourseModalOpen(false); setIsCourseEditOpen(false); }}
        title={isCourseEditOpen ? "Kursni tahrirlash" : "Yangi kurs qo'shish"}
      >
        <form onSubmit={isCourseEditOpen ? handleUpdateCourse : handleCreateCourse} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Kurs nomi</label>
            <input
              required
              value={courseForm.name}
              onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Oylik to'lov narxi</label>
            <input
              type="number"
              required
              value={courseForm.price || ''}
              onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tavsif</label>
            <textarea
              rows={2}
              required
              value={courseForm.description}
              onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            />
          </div>
          <Button type="submit" className="w-full">Saqlash</Button>
        </form>
      </Modal>

      {/* Mavzu qo'shish modali */}
      <Modal isOpen={isTopicModalOpen} onClose={() => setIsTopicModalOpen(false)} title="Yangi mavzu qo'shish">
        <form onSubmit={handleCreateTopic} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Mavzu nomi</label>
            <input
              required
              value={topicForm.name}
              onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Tartib raqami <span className="text-zinc-400 font-normal">(bo'sh qoldirsangiz avtomatik beriladi)</span>
            </label>
            <input
              type="number"
              value={topicForm.order}
              onChange={(e) => setTopicForm({ ...topicForm, order: e.target.value === '' ? '' : Number(e.target.value) })}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Tavsif <span className="text-zinc-400 font-normal">(ixtiyoriy)</span>
            </label>
            <textarea
              rows={2}
              value={topicForm.description}
              onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            />
          </div>
          <Button type="submit" className="w-full">Qo'shish</Button>
        </form>
      </Modal>

      {/* Mavzu tahrirlash modali */}
      <Modal isOpen={isTopicEditOpen} onClose={() => setIsTopicEditOpen(false)} title="Mavzuni tahrirlash">
        <form onSubmit={handleUpdateTopic} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Mavzu nomi</label>
            <input
              required
              value={topicForm.name}
              onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Tartib raqami</label>
            <input
              type="number"
              value={topicForm.order}
              onChange={(e) => setTopicForm({ ...topicForm, order: e.target.value === '' ? '' : Number(e.target.value) })}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Tavsif <span className="text-zinc-400 font-normal">(ixtiyoriy)</span>
            </label>
            <textarea
              rows={2}
              value={topicForm.description}
              onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            />
          </div>
          <Button type="submit" className="w-full">Saqlash</Button>
        </form>
      </Modal>

      {/* Xona qo'shish modali */}
      <Modal isOpen={isRoomModalOpen} onClose={() => setIsRoomModalOpen(false)} title="Yangi xona qo'shish">
        <form onSubmit={handleCreateRoom} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Xona nomi</label>
            <input
              required
              value={roomForm.name}
              onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Sig'im</label>
            <input
              type="number"
              required
              value={roomForm.size}
              onChange={(e) => setRoomForm({ ...roomForm, size: Number(e.target.value) })}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            />
          </div>
          <Button type="submit" className="w-full">Qo'shish</Button>
        </form>
      </Modal>

      {/* Xona tahrirlash modali */}
      <Modal isOpen={isRoomEditOpen} onClose={() => setIsRoomEditOpen(false)} title="Xonani tahrirlash">
        <form onSubmit={handleUpdateRoom} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Xona nomi</label>
            <input
              required
              value={roomForm.name}
              onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Sig'im</label>
            <input
              type="number"
              required
              value={roomForm.size}
              onChange={(e) => setRoomForm({ ...roomForm, size: Number(e.target.value) })}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            />
          </div>
          <Button type="submit" className="w-full">Saqlash</Button>
        </form>
      </Modal>

      {/* Xodim qo'shish modali */}
      <Modal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} title="Yangi xodim qo'shish">
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Ism</label>
              <input
                required
                value={staffForm.first_name}
                onChange={(e) => setStaffForm({ ...staffForm, first_name: e.target.value })}
                className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Familiya</label>
              <input
                required
                value={staffForm.last_name}
                onChange={(e) => setStaffForm({ ...staffForm, last_name: e.target.value })}
                className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Telefon</label>
            <input
              required
              value={staffForm.phone}
              onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Lavozim</label>
            <input
              required
              value={staffForm.position}
              onChange={(e) => setStaffForm({ ...staffForm, position: e.target.value })}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Oylik maosh</label>
              <input
                type="number"
                required
                value={staffForm.salary || ''}
                onChange={(e) => setStaffForm({ ...staffForm, salary: Number(e.target.value) })}
                className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Ishga kirgan sana</label>
              <input
                type="date"
                required
                value={staffForm.hire_date}
                onChange={(e) => setStaffForm({ ...staffForm, hire_date: e.target.value })}
                className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
              />
            </div>
          </div>
          <Button type="submit" className="w-full">Qo'shish</Button>
        </form>
      </Modal>

      {/* Xodim tahrirlash modali */}
      <Modal isOpen={isStaffEditOpen} onClose={() => setIsStaffEditOpen(false)} title="Xodimni tahrirlash">
        <form onSubmit={handleUpdateStaff} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Ism</label>
              <input
                required
                value={staffForm.first_name}
                onChange={(e) => setStaffForm({ ...staffForm, first_name: e.target.value })}
                className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Familiya</label>
              <input
                required
                value={staffForm.last_name}
                onChange={(e) => setStaffForm({ ...staffForm, last_name: e.target.value })}
                className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Lavozim</label>
            <input
              required
              value={staffForm.position}
              onChange={(e) => setStaffForm({ ...staffForm, position: e.target.value })}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Oylik maosh</label>
            <input
              type="number"
              required
              value={staffForm.salary}
              onChange={(e) => setStaffForm({ ...staffForm, salary: Number(e.target.value) })}
              className="w-full text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2"
            />
          </div>
          <Button type="submit" className="w-full">Saqlash</Button>
        </form>
      </Modal>
    </div>
  );
}