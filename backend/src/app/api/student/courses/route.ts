import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { withErrors } from "@/lib/http";

// Lesson content is only returned to enrolled learners (see /api/student/learn).
export const GET = withErrors("student/courses", async (req) => {
  const user = getUserFromToken(req);

  const courses = await prisma.course.findMany({
    include: {
      instructor: { select: { name: true, email: true } },
      lessons: { select: { id: true, title: true, createdAt: true }, orderBy: { createdAt: "asc" } },
      enrollments: user ? { where: { userId: user.id } } : { where: { id: "" } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(courses);
});
