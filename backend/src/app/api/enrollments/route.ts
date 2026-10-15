import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, withErrors } from "@/lib/http";
import { enrollLearner } from "@/lib/enroll";

export const POST = withErrors("enrollments", async (req) => {
  const user = requireUser(req);
  const body = await req.json().catch(() => ({}));
  return NextResponse.json(await enrollLearner(user, body.courseId), { status: 201 });
});

export const GET = withErrors("enrollments", async (req) => {
  const user = requireUser(req);

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id },
    include: { course: true },
  });

  return NextResponse.json(enrollments);
});
