import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, withErrors } from "@/lib/http";

export const GET = withErrors("instructor/analytics", async (req) => {
  const user = requireUser(req, ["INSTRUCTOR"]);

  const courses = await prisma.course.findMany({
    where: { instructorId: user.id },
    include: {
      lessons: { select: { id: true } },
      enrollments: { include: { user: { select: { name: true, email: true } } } },
      payments: { where: { status: "SUCCESS" }, select: { amount: true } },
      progress: { select: { percentage: true } },
    },
  });

  const progress = courses.flatMap((c) => c.progress.map((p) => p.percentage));

  return NextResponse.json({
    totalCourses: courses.length,
    totalStudents: courses.reduce((sum, c) => sum + c.enrollments.length, 0),
    revenue: courses.reduce((sum, c) => sum + c.payments.reduce((s, p) => s + p.amount, 0), 0),
    avgProgress: progress.length ? Math.round(progress.reduce((a, b) => a + b, 0) / progress.length) : 0,
    courses: courses.map((c) => ({
      id: c.id,
      title: c.title,
      lessons: c.lessons.length,
      students: c.enrollments.length,
      learners: c.enrollments.map((e) => e.user),
    })),
  });
});
