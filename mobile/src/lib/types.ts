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
