export type Role = "ADMIN" | "INSTRUCTOR" | "LEARNER";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  exp?: number;
};

export type Lesson = {
  id: string;
  title: string;
  videoUrl?: string | null;
  notes?: string | null;
  pdfUrl?: string | null;
  courseId: string;
  createdAt: string;
};

export type Course = {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail?: string | null;
  category?: string | null;
  level?: string | null;
  instructorId: string;
  instructor?: { name?: string | null; email: string };
  lessons?: Lesson[];
  enrollments?: { id: string; userId: string }[];
  _count?: { enrollments: number };
  createdAt: string;
};

export type Enrollment = {
  id: string;
  userId: string;
  courseId: string;
  course: Course;
  createdAt: string;
};

export type AiSource = {
  id: string;
  n?: number;
  content: string;
  source?: "notes" | "pdf" | string;
  lessonId?: string | null;
  lessonTitle?: string;
  courseId?: string;
  courseTitle?: string;
  score?: number;
  cited?: boolean;
};

export type TutorResponse = {
  answer: string;
  fromNotes?: string;
  explanation?: string;
  usedOutsideKnowledge?: boolean;
  sources?: AiSource[];
  retrieval?: "vector" | "keyword" | "none";
  searchedCourses?: number;
};

export type InstructorCourse = Course & { lessons: Lesson[]; enrollments: { id: string; userId: string }[] };

export type InstructorAnalytics = {
  totalCourses: number;
  totalStudents: number;
  revenue: number;
  avgProgress: number;
  courses: {
    id: string;
    title: string;
    lessons: number;
    students: number;
    learners: { name?: string | null; email: string }[];
  }[];
};

export type CourseStudents = Omit<Course, "enrollments"> & {
  enrollments: { id: string; createdAt: string; user: { name?: string | null; email: string } }[];
};

export type NewCourse = {
  title: string;
  description: string;
  price: number;
  category?: string;
  level?: string;
  thumbnail?: string;
};

export type NewLesson = {
  courseId: string;
  title: string;
  videoUrl?: string;
  pdfUrl?: string;
  notes?: string;
};

export type AdminUser = { id: string; name?: string | null; email: string; role: Role; createdAt: string };

export type AdminStats = {
  totalUsers: number;
  students: number;
  instructors: number;
  courses: number;
  enrollments: number;
  revenue: number;
  recentUsers: AdminUser[];
  recentCourses: (Course & { _count: { enrollments: number; lessons: number } })[];
};

export type AdminCourse = Course & {
  instructor: { id: string; name?: string | null; email: string };
  lessons: Lesson[];
  enrollments: { id: string; userId: string }[];
};

export type AdminEnrollment = {
  id: string;
  createdAt: string;
  user: { name?: string | null; email: string };
  course: { title: string; price: number };
};

export type AdminRevenue = { revenue: number; transactions: number };

export type EnrollResult = Enrollment & {
  payment: { id: string; amount: number; status: string; mode: string } | null;
};
