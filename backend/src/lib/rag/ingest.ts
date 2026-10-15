import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { chunkText } from "./chunk";
import { embedTexts, toVectorLiteral } from "./embed";
import { fetchPdfText } from "./pdf";

export type IndexResult = {
  lessonId: string;
  chunks: number;
  embedded: boolean;
  sources: { notes: number; pdf: number };
  pdfPages?: number;
  warnings: string[];
};

type Piece = { source: "notes" | "pdf"; content: string };

// Replaces a lesson's chunks and embeddings. If embedding fails the chunks are
// still stored for keyword search and the error is returned in `warnings`.
export async function indexLesson(lessonId: string): Promise<IndexResult> {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new Error(`Lesson ${lessonId} not found`);

  const warnings: string[] = [];
  const pieces: Piece[] = [];

  if (lesson.notes?.trim()) {
    for (const c of chunkText(lesson.notes)) pieces.push({ source: "notes", content: c });
  }

  let pdfPages: number | undefined;
  if (lesson.pdfUrl?.trim()) {
    try {
      const pages = await fetchPdfText(lesson.pdfUrl);
      pdfPages = pages.length;
      const text = pages.join("\n\n");
      const before = pieces.length;
      for (const c of chunkText(text)) pieces.push({ source: "pdf", content: c });
      if (pieces.length === before) warnings.push("PDF has no extractable text (it may be a scanned image).");
    } catch (e) {
      warnings.push(`PDF not indexed: ${(e as Error).message}`);
    }
  }

  let vectors: number[][] | null = null;
  if (pieces.length > 0) {
    try {
      vectors = await embedTexts(
        pieces.map((p) => p.content),
        "RETRIEVAL_DOCUMENT",
        lesson.title,
      );
    } catch (e) {
      warnings.push(`Embeddings failed, saved for keyword search only: ${(e as Error).message}`);
    }
  }

  const counters = { notes: 0, pdf: 0 };
  const rows = pieces.map((p) => ({ ...p, chunkIndex: counters[p.source]++ }));

  await prisma.$transaction([
    prisma.contentChunk.deleteMany({ where: { lessonId } }),
    ...rows.map(
      (r, i) =>
        prisma.$executeRaw`
        INSERT INTO "ContentChunk" ("id", "content", "source", "chunkIndex", "lessonId", "embedding")
        VALUES (
          ${randomUUID()}, ${r.content}, ${r.source}, ${r.chunkIndex}, ${lessonId},
          ${vectors ? Prisma.sql`${toVectorLiteral(vectors[i])}::vector` : Prisma.sql`NULL`}
        )`,
    ),
  ]);

  return {
    lessonId,
    chunks: rows.length,
    embedded: !!vectors && rows.length > 0,
    sources: counters,
    pdfPages,
    warnings,
  };
}
