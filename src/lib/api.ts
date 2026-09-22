import {
  ApiResponse,
  User,
  Course,
  Topic,
  Group,
  Lesson,
  ClassRoom,
  Grade,
  Attendance,
  Coin,
  Gift,
  HomeworkAssignment,
  Homework,
  Staff
} from '../types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({
    success: false,
    message: 'Server javobida xatolik yuz berdi'
  }));

  if (!res.ok && data.success !== false) {
    data.success = false;
  }

  return data;
}

export const authApi = {
  signIn: (data: { login: string; password: string }) =>
    request<{ user?: User }>('/auth/sign-in', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request<User>('/auth/me'),
};

export const usersApi = {
  getAll: () => request<User[]>('/users'),
  getStudents: () => request<User[]>('/users/students'),
  getOne: (id: string) => request<User>(`/users/${id}`),
  create: (data: { first_name: string; last_name: string; phone: string; data_both: string; password: string; login: string }) =>
    request<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { first_name?: string; last_name?: string; data_both?: string }) =>
    request<User>(`/users/update/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateRole: (id: string, role: string) =>
    request<User>(`/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  delete: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
};

export const groupsApi = {
  getAll: () => request<Group[]>('/groups'),
  getMine: () => request<Group[]>('/groups/mine'),
  getOne: (id: string) => request<Group>(`/groups/${id}`),
  getStudents: (id: string) => request<User[]>(`/groups/${id}/students`),
  create: (data: { name: string; lesson_time: string; lesson_days: string[]; teacher?: string; course_id: string }) =>
    request<Group>('/groups', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Group>) =>
    request<Group>(`/groups/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addStudents: (id: string, students: string[]) =>
    request<Group>(`/groups/${id}/add-students`, { method: 'POST', body: JSON.stringify({ students }) }),
};

export const coursesApi = {
  getAll: () => request<Course[]>('/course'),
  getOne: (id: string) => request<Course>(`/course/${id}`),
  create: (data: { name: string; price: number; description: string }) =>
    request<Course>('/course', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Course>) =>
    request<Course>(`/course/update/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/course/${id}`, { method: 'DELETE' }),
};

export const topicsApi = {
  getAll: () => request<Topic[]>('/topics'),
  getByCourse: (courseId: string) => request<Topic[]>(`/topics/course/${courseId}`),
  create: (data: { course_id: string; name: string; order?: number }) =>
    request<Topic>('/topics', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Topic>) =>
    request<Topic>(`/topics/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/topics/${id}`, { method: 'DELETE' }),
};

export const lessonsApi = {
  getAll: () => request<Lesson[]>('/lessons'),
  getByGroup: (groupId: string) => request<Lesson[]>(`/lessons/group/${groupId}`),
  getOne: (id: string) => request<Lesson>(`/lessons/${id}`),
  create: (data: { name: string; description: string; group_id: string; topic_id?: string; date?: string; video_uri?: string; file_uri?: string }) =>
    request<Lesson>('/lessons', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Lesson>) =>
    request<Lesson>(`/lessons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/lessons/${id}`, { method: 'DELETE' }),
};

export const classRoomsApi = {
  getAll: () => request<ClassRoom[]>('/class-rooms'),
  create: (data: { name: string; size: number; group_id?: string[] }) =>
    request<ClassRoom>('/class-rooms', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<ClassRoom>) =>
    request<ClassRoom>(`/class-rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  assignGroup: (id: string, groupId: string) =>
    request<ClassRoom>(`/class-rooms/${id}/assign-group/${groupId}`, { method: 'POST' }),
  delete: (id: string) => request(`/class-rooms/${id}`, { method: 'DELETE' }),
};

export const gradesApi = {
  getAll: () => request<Grade[]>('/grades'),
  getMe: () => request<Grade[]>('/grades/me'),
  getByLesson: (lessonId: string) => request<Grade[]>(`/grades/lesson/${lessonId}`),
  create: (data: { student_id: string; lesson_id: string; score: number; comment?: string }) =>
    request<Grade>('/grades', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: { score?: number; comment?: string }) =>
    request<Grade>(`/grades/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/grades/${id}`, { method: 'DELETE' }),
};

export const attendanceApi = {
  getAll: () => request<Attendance[]>('/attendance'),
  getMe: () => request<Attendance[]>('/attendance/me'),
  getByLesson: (lessonId: string) => request<Attendance[]>(`/attendance/lesson/${lessonId}`),
  createBulk: (data: { lesson_id: string; records: { student_id: string; status: string }[] }) =>
    request<Attendance[]>('/attendance/bulk', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, status: string) =>
    request<Attendance>(`/attendance/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

export const coinsApi = {
  getAll: () => request<Coin[]>('/coins'),
  getMe: () => request<Coin[]>('/coins/me'),
  getStudent: (id: string) => request<Coin[]>(`/coins/student/${id}`),
  getStudentBalance: (id: string) =>
    request<{ student_id: string; balance: number }>(`/coins/student/${id}/balance`),
  create: (data: { student_id: string; amount: number; reason: string }) =>
    request<Coin>('/coins', { method: 'POST', body: JSON.stringify(data) }),
};

export const giftsApi = {
  getAll: () => request<Gift[]>('/gifts'),
  create: (data: { name: string; price_coin: number; stock: number; description?: string; image?: string }) =>
    request<Gift>('/gifts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Gift>) =>
    request<Gift>(`/gifts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/gifts/${id}`, { method: 'DELETE' }),
  redeem: (giftId: string, studentId: string) =>
    request(`/gifts/${giftId}/redeem/${studentId}`, { method: 'POST' }),
};

export const homeworkAssignmentsApi = {
  getByGroup: (groupId: string) => request<HomeworkAssignment[]>(`/homework-assignments/group/${groupId}`),
  getStatus: (id: string) =>
    request<{ student: User; submission: Homework | null }[]>(`/homework-assignments/${id}/status`),
  create: (data: { group_id: string; topic_id?: string; title: string; description: string; attachment?: string; due_date?: string }) =>
    request<HomeworkAssignment>('/homework-assignments', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/homework-assignments/${id}`, { method: 'DELETE' }),
};

export const homeworkApi = {
  getMe: () => request<Homework[]>('/homework/me'),
  getByAssignment: (assignmentId: string) =>
    request<Homework[]>(`/homework/assignment/${assignmentId}`),
  submit: (assignmentId: string, data: { file_name: string; description: string }) =>
    request<Homework>(`/homework/assignment/${assignmentId}`, { method: 'POST', body: JSON.stringify(data) }),
  review: (assignmentId: string, id: string, data: { status: string; teacher_comment?: string; score?: number }) =>
    request<Homework>(`/homework/assignment/${assignmentId}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const staffApi = {
  getAll: () => request<Staff[]>('/staff'),
  create: (data: Omit<Staff, '_id'>) =>
    request<Staff>('/staff', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Staff>) =>
    request<Staff>(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request(`/staff/${id}`, { method: 'DELETE' }),
};

export const uploadApi = {
  uploadFile: async (file: File): Promise<ApiResponse<{ path: string; filename: string }>> => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/uploads/file', { method: 'POST', body: formData });
  }
};