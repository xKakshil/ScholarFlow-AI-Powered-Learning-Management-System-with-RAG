import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireUser, withErrors } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

export const GET = withErrors<Context>("student/learn", async (req, { params }) => {
  const user = requireUser(req);
  const { id } = await params;

  const enrollment = await prisma.enrollment.findFirst({ where: { userId: user.id, courseId: id } });
  if (!enrollment) return jsonError("Not enrolled", 403);

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      instructor: { select: { name: true, email: true } },
      lessons: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!course) return jsonError("Course not found", 404);

  return NextResponse.json(course);
});
