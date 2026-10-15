import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireUser, withErrors } from "@/lib/http";

export const GET = withErrors("instructor/courses", async (req) => {
  const user = requireUser(req, ["INSTRUCTOR"]);

  const courses = await prisma.course.findMany({
    where: { instructorId: user.id },
    include: { lessons: { orderBy: { createdAt: "asc" } }, enrollments: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(courses);
});

export const POST = withErrors("instructor/courses", async (req) => {
  const user = requireUser(req, ["INSTRUCTOR"]);
  const body = await req.json().catch(() => ({}));

  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const price = Number(body.price) || 0;

  if (!title || !description) return jsonError("Title and description are required", 400);
  if (!Number.isInteger(price) || price < 0) return jsonError("Price must be a whole number of rupees", 400);

  const course = await prisma.course.create({
    data: {
      title,
      description,
      price,
      thumbnail: body.thumbnail || null,
      category: body.category || "",
      level: body.level || "",
      instructorId: user.id,
    },
  });

  return NextResponse.json(course, { status: 201 });
});
