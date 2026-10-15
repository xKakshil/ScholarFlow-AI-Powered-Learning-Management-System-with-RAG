import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, withErrors } from "@/lib/http";

export const GET = withErrors("admin/stats", async (req) => {
  requireUser(req, ["ADMIN"]);

  const [users, courses, revenue] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.course.findMany({
      include: {
        instructor: { select: { email: true } },
        _count: { select: { enrollments: true, lessons: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
  ]);

  return NextResponse.json({
    totalUsers: users.length,
    students: users.filter((u) => u.role === "LEARNER").length,
    instructors: users.filter((u) => u.role === "INSTRUCTOR").length,
    courses: courses.length,
    enrollments: courses.reduce((sum, c) => sum + c._count.enrollments, 0),
    revenue: revenue._sum.amount ?? 0,
    recentUsers: users.slice(0, 5),
    recentCourses: courses.slice(0, 5),
  });
});
