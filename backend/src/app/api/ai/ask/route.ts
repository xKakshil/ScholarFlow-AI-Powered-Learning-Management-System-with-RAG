import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/auth";
import { GeminiConfigError, isRateLimitError } from "@/lib/gemini";
import { HttpError, jsonError, requireUser } from "@/lib/http";
import { generateTutorAnswer } from "@/lib/rag/answer";
import { retrieveContext } from "@/lib/rag/retrieve";

export const maxDuration = 30;

const MAX_QUESTION_LENGTH = 1000;

async function readableCourseIds(user: AuthUser, courseId?: unknown) {
  let ids: string[];
  if (user.role === "ADMIN") {
    ids = (await prisma.course.findMany({ select: { id: true } })).map((c) => c.id);
  } else if (user.role === "INSTRUCTOR") {
    ids = (await prisma.course.findMany({ where: { instructorId: user.id }, select: { id: true } })).map(
      (c) => c.id,
    );
  } else {
    ids = (await prisma.enrollment.findMany({ where: { userId: user.id }, select: { courseId: true } })).map(
      (e) => e.courseId,
    );
  }
  return typeof courseId === "string" && courseId ? ids.filter((id) => id === courseId) : ids;
}

export async function POST(req: Request) {
  try {
    const user = requireUser(req);
    const body = await req.json().catch(() => ({}));
    const question = String(body.question ?? "").trim();

    if (!question) return jsonError("Question is required", 400);
    if (question.length > MAX_QUESTION_LENGTH) {
      return jsonError(`Keep questions under ${MAX_QUESTION_LENGTH} characters`, 400);
    }

    const courseIds = await readableCourseIds(user, body.courseId);
    const retrieval = await retrieveContext(question, courseIds);
    if (retrieval.warning) console.warn("[ai/ask]", retrieval.warning);

    const result = await generateTutorAnswer(question, retrieval.chunks);

    const sources = retrieval.chunks.map((chunk, i) => ({
      id: chunk.id,
      n: i + 1,
      content: chunk.content,
      source: chunk.source,
      lessonId: chunk.lessonId,
      lessonTitle: chunk.lessonTitle,
      courseId: chunk.courseId,
      courseTitle: chunk.courseTitle,
      score: Math.round(chunk.score * 1000) / 1000,
      cited: result.citations.includes(i + 1),
    }));

    // Single-string version of the answer for clients that don't render the two parts.
    const answer = [
      result.fromNotes
        ? `📘 Your notes say:\n${result.fromNotes}`
        : "📘 Your course notes don't cover this directly.",
      `🤖 AI explanation:\n${result.explanation}`,
      result.usedOutsideKnowledge ? "This explanation includes knowledge beyond your course notes." : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    return NextResponse.json({
      answer,
      fromNotes: result.fromNotes,
      explanation: result.explanation,
      usedOutsideKnowledge: result.usedOutsideKnowledge,
      sources,
      retrieval: retrieval.method,
      searchedCourses: courseIds.length,
    });
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonError(
        error.status === 401 ? "Please log in to use the AI tutor" : error.message,
        error.status,
      );
    }
    if (isRateLimitError(error)) {
      return jsonError("The AI tutor is busy right now. Please try again in 20–30 seconds.", 429);
    }
    console.error("[ai/ask]", error);
    if (error instanceof GeminiConfigError)
      return jsonError("The AI tutor is not configured on this server", 503);
    return jsonError("The AI tutor is temporarily unavailable. Please try again shortly.", 503);
  }
}
