export type UserRole = 'admin' | 'super_admin' | 'teacher' | 'student' | 'viwer';

export interface User {
  _id: string;
  first_name: string;
  last_name: string;
  data_both: string;
  phone: string;
  login: string;
  role: UserRole;
  avatar?: string;
  createdAt?: string;
}

export interface Course {
  _id: string;
  name: string;
  price: number;
  description: string;
}

export interface Topic {
  _id: string;
  course_id: string | { _id: string; name: string };
  name: string;
  order: number;
  description?: string;
}

export interface Group {
  _id: string;
  name: string;
  lesson_time: string;
  lesson_days: string[];
  teacher?: string | Partial<User>;
  students: (string | Partial<User>)[];
  course_id: string | { _id: string; name: string; price: number };
}

// Bitta guruh doirasida bir talabaning muzlatish yozuvi (alohida "freeze"
// kolleksiyasida saqlanadi). Yozuv mavjudligi = hozir muzlatilgan degani.
export interface Freeze {
  _id: string;
  group: string;
  student: string | Partial<User>;
  suspended_at: string;
}

export interface Lesson {
  _id: string;
  name: string;
  description: string;
  author: string | Partial<User>;
  group_id: string | { _id: string; name: string };
  topic_id?: string | { _id: string; name: string };
  date: string;
  video_uri?: string;
  file_uri?: string;
}

export interface ClassRoom {
  _id: string;
  name: string;
  size: number;
  group_id: (string | { _id: string; name: string })[];
}

export interface Grade {
  _id: string;
  student_id: string | Partial<User>;
  lesson_id: string | { _id: string; name: string };
  score: number;
  comment?: string;
  graded_by: string | Partial<User>;
}

export type AttendanceStatus = 'keldi' | 'kelmadi' | 'sababli' | 'kechikdi';

export interface Attendance {
  _id: string;
  lesson_id: string | { _id: string; name: string };
  student_id: string | Partial<User>;
  status: AttendanceStatus;
  marked_by: string | Partial<User>;
}

export interface Coin {
  _id: string;
  student_id: string | Partial<User>;
  amount: number;
  reason: string;
  given_by?: string | Partial<User>;
  createdAt: string;
}

export interface Gift {
  _id: string;
  name: string;
  price_coin: number;
  stock: number;
  description?: string;
  image?: string;
}

export interface HomeworkAssignment {
  _id: string;
  group_id: string | { _id: string; name: string };
  topic_id?: string | { _id: string; name: string };
  title: string;
  description: string;
  attachment?: string;
  due_date?: string;
  created_by: string | Partial<User>;
  submitted_count?: number;
  accepted_count?: number;
}

export type HomeworkStatus = 'pending' | 'accepted' | 'rejected';

export interface Homework {
  _id: string;
  file_name: string;
  description: string;
  student_id: string | Partial<User>;
  assignment_id: string | { _id: string; title: string };
  status: HomeworkStatus;
  teacher_comment?: string;
  reviewed_by?: string | Partial<User>;
  score?: number;
  coin_awarded: boolean;
}

export interface Staff {
  _id: string;
  first_name: string;
  last_name: string;
  phone: string;
  position: string;
  salary: number;
  hire_date: string;
  address?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  length?: number;
  balance?: number;
}