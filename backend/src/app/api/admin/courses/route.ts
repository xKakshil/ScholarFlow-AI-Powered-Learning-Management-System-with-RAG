import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, withErrors } from "@/lib/http";

export const GET = withErrors("admin/courses", async (req) => {
  requireUser(req, ["ADMIN"]);

  const courses = await prisma.course.findMany({
    include: {
      instructor: { select: { id: true, name: true, email: true } },
      lessons: { orderBy: { createdAt: "asc" } },
      enrollments: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(courses);
});
