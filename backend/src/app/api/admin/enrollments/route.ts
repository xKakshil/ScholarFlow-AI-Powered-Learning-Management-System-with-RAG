import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, withErrors } from "@/lib/http";

export const GET = withErrors("admin/enrollments", async (req) => {
  requireUser(req, ["ADMIN"]);

  const enrollments = await prisma.enrollment.findMany({
    include: {
      user: { select: { name: true, email: true } },
      course: { select: { title: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(enrollments);
});
