import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, withErrors } from "@/lib/http";

export const GET = withErrors("student/my-courses", async (req) => {
  const user = requireUser(req);

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: {
      course: {
        include: {
          instructor: { select: { name: true, email: true } },
          lessons: { select: { id: true, title: true }, orderBy: { createdAt: "asc" } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(enrollments);
});
