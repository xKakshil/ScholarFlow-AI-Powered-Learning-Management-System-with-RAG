import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { HttpError, jsonError, requireUser, withErrors } from "@/lib/http";
import { indexLesson } from "@/lib/rag/ingest";

export const maxDuration = 60;

async function requireOwnCourse(courseId: unknown, instructorId: string) {
  if (typeof courseId !== "string" || !courseId) throw new HttpError("courseId is required", 400);
  const course = await prisma.course.findFirst({
    where: { id: courseId, instructorId },
    select: { id: true },
  });
  if (!course) throw new HttpError("Course not found", 404);
  return course.id;
}

export const GET = withErrors("instructor/lessons", async (req) => {
  const user = requireUser(req, ["INSTRUCTOR"]);
  const courseId = await requireOwnCourse(new URL(req.url).searchParams.get("courseId"), user.id);

  const lessons = await prisma.lesson.findMany({
    where: { courseId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(lessons);
});

export const POST = withErrors("instructor/lessons", async (req) => {
  const user = requireUser(req, ["INSTRUCTOR"]);
  const body = await req.json().catch(() => ({}));

  const title = String(body.title ?? "").trim();
  if (!title) return jsonError("Title is required", 400);
  const courseId = await requireOwnCourse(body.courseId, user.id);

  const lesson = await prisma.lesson.create({
    data: {
      title,
      videoUrl: body.videoUrl || "",
      notes: body.notes || "",
      pdfUrl: body.pdfUrl || "",
      courseId,
    },
  });

  let rag;
  try {
    rag = await indexLesson(lesson.id);
  } catch (error) {
    console.error("[instructor/lessons] indexing failed", error);
    rag = {
      lessonId: lesson.id,
      chunks: 0,
      embedded: false,
      warnings: ["Indexing failed. Run `npm run rag:reindex` to retry."],
    };
  }

  return NextResponse.json({ ...lesson, rag }, { status: 201 });
});
