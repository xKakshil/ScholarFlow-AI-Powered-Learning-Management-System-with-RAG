import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, withErrors } from "@/lib/http";

export const GET = withErrors("instructor/students", async (req) => {
  const user = requireUser(req, ["INSTRUCTOR"]);

  const courses = await prisma.course.findMany({
    where: { instructorId: user.id },
    include: {
      enrollments: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return NextResponse.json(courses);
});
