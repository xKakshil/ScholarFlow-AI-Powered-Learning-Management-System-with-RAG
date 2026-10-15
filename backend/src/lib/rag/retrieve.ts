import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { embedQuery, toVectorLiteral } from "./embed";

export type RetrievedChunk = {
  id: string;
  content: string;
  source: string;
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  courseTitle: string;
  score: number;
};

export type Retrieval = { method: "vector" | "keyword" | "none"; chunks: RetrievedChunk[]; warning?: string };

const TOP_K = 5;
// Minimum cosine similarity for a chunk to be used as context.
const MIN_SCORE = Number(process.env.RAG_MIN_SCORE ?? 0.45);

export async function retrieveContext(question: string, courseIds: string[]): Promise<Retrieval> {
  if (courseIds.length === 0) return { method: "none", chunks: [] };

  try {
    const vector = toVectorLiteral(await embedQuery(question));
    const rows = await prisma.$queryRaw<RetrievedChunk[]>`
      SELECT c."id", c."content", c."source",
             l."id" AS "lessonId", l."title" AS "lessonTitle",
             co."id" AS "courseId", co."title" AS "courseTitle",
             (1 - (c."embedding" <=> ${vector}::vector))::float8 AS "score"
      FROM "ContentChunk" c
      JOIN "Lesson" l ON l."id" = c."lessonId"
      JOIN "Course" co ON co."id" = l."courseId"
      WHERE c."embedding" IS NOT NULL
        AND l."courseId" IN (${Prisma.join(courseIds)})
      ORDER BY c."embedding" <=> ${vector}::vector
      LIMIT ${TOP_K}`;
    return { method: "vector", chunks: rows.filter((r) => r.score >= MIN_SCORE) };
  } catch (e) {
    const keyword = await keywordSearch(question, courseIds);
    return { ...keyword, warning: `Vector search unavailable: ${(e as Error).message}` };
  }
}

const STOPWORDS = new Set(
  "what when where which while about would could should there their these those with from into that this have does doing explain please tell give between".split(
    " ",
  ),
);

// Used when the embedding API is unavailable.
async function keywordSearch(question: string, courseIds: string[]): Promise<Retrieval> {
  const words = [...new Set(question.toLowerCase().match(/[a-z0-9]{4,}/g) ?? [])]
    .filter((w) => !STOPWORDS.has(w))
    .slice(0, 8);
  if (words.length === 0) return { method: "keyword", chunks: [] };

  const candidates = await prisma.contentChunk.findMany({
    where: {
      lesson: { courseId: { in: courseIds } },
      OR: words.map((w) => ({ content: { contains: w, mode: "insensitive" as const } })),
    },
    include: { lesson: { include: { course: { select: { id: true, title: true } } } } },
    take: 50,
  });

  const scored = candidates
    .map((c) => {
      const text = c.content.toLowerCase();
      const hits = words.filter((w) => text.includes(w)).length;
      return {
        id: c.id,
        content: c.content,
        source: c.source,
        lessonId: c.lesson!.id,
        lessonTitle: c.lesson!.title,
        courseId: c.lesson!.course.id,
        courseTitle: c.lesson!.course.title,
        score: hits / words.length,
      };
    })
    .filter((c) => c.score >= 0.34)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K);

  return { method: "keyword", chunks: scored };
}
