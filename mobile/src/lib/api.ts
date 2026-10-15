import { create, isAxiosError, type AxiosError } from "axios";
import { API_URL } from "./config";
import type { AuthUser, Course, Enrollment, Lesson, Role, TutorResponse } from "./types";

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export const api = create({
  baseURL: API_URL,
  timeout: 60_000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401 && authToken) onUnauthorized?.();
    return Promise.reject(error);
  },
);

export function errorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (isAxiosError(error)) {
    if (error.code === "ECONNABORTED") return "The server took too long to respond. Please try again.";
    if (!error.response) return "Can't reach ScholarFlow. Check your internet connection.";
    const data = error.response.data as { error?: string } | undefined;
    if (data?.error) return data.error;
  }
  return fallback;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<{ token: string; user: AuthUser }>("/auth/login", {
    email,
    password,
  });
  return data;
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  role: Exclude<Role, "ADMIN">;
}) {
  const { data } = await api.post<{ id: string; email: string; role: Role }>("/auth/register", input);
  return data;
}

export async function getCourses() {
  const { data } = await api.get<Course[]>("/student/courses");
  return Array.isArray(data) ? data : [];
}

export async function getMyCourses() {
  const { data } = await api.get<Enrollment[]>("/student/my-courses");
  return Array.isArray(data) ? data : [];
}

export async function enroll(courseId: string) {
  const { data } = await api.post("/student/enrollments", { courseId });
  return data;
}

export async function getLearnCourse(courseId: string) {
  const { data } = await api.get<Course>(`/student/learn/${courseId}`);
  return data;
}

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

export async function getInstructorCourses() {
  const { data } = await api.get<InstructorCourse[]>("/instructor/courses");
  return Array.isArray(data) ? data : [];
}

export async function createCourse(input: NewCourse) {
  const { data } = await api.post<Course>("/instructor/courses", input);
  return data;
}

export async function getLessons(courseId: string) {
  const { data } = await api.get<Lesson[]>("/instructor/lessons", { params: { courseId } });
  return Array.isArray(data) ? data : [];
}

export async function createLesson(input: NewLesson) {
  const { data } = await api.post<Lesson>("/instructor/lessons", input);
  return data;
}

export async function getInstructorAnalytics() {
  const { data } = await api.get<InstructorAnalytics>("/instructor/analytics");
  return data;
}

export async function getInstructorStudents() {
  const { data } = await api.get<CourseStudents[]>("/instructor/students");
  return Array.isArray(data) ? data : [];
}

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

export async function getAdminStats() {
  const { data } = await api.get<AdminStats>("/admin/stats");
  return data;
}

export async function getAdminRevenue() {
  const { data } = await api.get<{ revenue: number; transactions: number }>("/admin/revenue");
  return data;
}

export async function getAdminUsers() {
  const { data } = await api.get<AdminUser[]>("/admin/users");
  return Array.isArray(data) ? data : [];
}

export async function getAdminCourses() {
  const { data } = await api.get<AdminCourse[]>("/admin/courses");
  return Array.isArray(data) ? data : [];
}

export async function getAdminEnrollments() {
  const { data } = await api.get<AdminEnrollment[]>("/admin/enrollments");
  return Array.isArray(data) ? data : [];
}

export async function askTutor(question: string, courseId?: string) {
  const { data } = await api.post<TutorResponse>("/ai/ask", { question, ...(courseId ? { courseId } : {}) });
  return data;
}
