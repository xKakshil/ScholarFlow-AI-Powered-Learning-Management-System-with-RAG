import { API_URL } from "./config";
import type {
  AuthUser,
  Course,
  EnrollResult,
  Lesson,
  NewCourse,
  NewLesson,
  Role,
  TutorResponse,
} from "./types";

const TOKEN_KEY = "scholarflow_token";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new ApiError("Can't reach ScholarFlow. Check your connection and try again.", 0);
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    throw new ApiError(body?.error ?? `Request failed (${res.status})`, res.status);
  }
  return body as T;
}

export const fetcher = <T>(path: string) => request<T>(path);

export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  return error instanceof ApiError || error instanceof Error ? error.message || fallback : fallback;
}

export const paths = {
  courses: "/student/courses",
  myCourses: "/student/my-courses",
  learn: (id: string) => `/student/learn/${id}`,
  instructorCourses: "/instructor/courses",
  lessons: (courseId: string) => `/instructor/lessons?courseId=${encodeURIComponent(courseId)}`,
  instructorAnalytics: "/instructor/analytics",
  instructorStudents: "/instructor/students",
  adminStats: "/admin/stats",
  adminRevenue: "/admin/revenue",
  adminUsers: "/admin/users",
  adminCourses: "/admin/courses",
  adminEnrollments: "/admin/enrollments",
};

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: AuthUser }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (input: { name: string; email: string; password: string; role: Exclude<Role, "ADMIN"> }) =>
    request<{ id: string; email: string; role: Role }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  enroll: (courseId: string) =>
    request<EnrollResult>("/student/enrollments", { method: "POST", body: JSON.stringify({ courseId }) }),
  createCourse: (input: NewCourse) =>
    request<Course>("/instructor/courses", { method: "POST", body: JSON.stringify(input) }),
  createLesson: (input: NewLesson) =>
    request<Lesson & { rag?: { chunks: number; embedded: boolean; warnings: string[] } }>(
      "/instructor/lessons",
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    ),
  askTutor: (question: string, courseId?: string) =>
    request<TutorResponse>("/ai/ask", {
      method: "POST",
      body: JSON.stringify({ question, ...(courseId ? { courseId } : {}) }),
    }),
};
