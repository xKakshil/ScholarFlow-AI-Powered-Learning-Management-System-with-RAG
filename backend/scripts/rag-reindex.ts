/**
 * Rebuilds lesson embeddings.
 *
 *   npm run rag:reindex
 *   npm run rag:reindex -- <courseId>
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { indexLesson } from "../src/lib/rag/ingest";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const courseId = process.argv[2];
  const lessons = await prisma.lesson.findMany({
    where: courseId ? { courseId } : {},
    select: { id: true, title: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(`Indexing ${lessons.length} lesson(s)…`);

  let ok = 0;
  for (const [i, l] of lessons.entries()) {
    try {
      const r = await indexLesson(l.id);
      ok++;
      console.log(
        `[${i + 1}/${lessons.length}] ${l.title}: ${r.chunks} chunks (notes ${r.sources.notes}, pdf ${r.sources.pdf})` +
          (r.embedded ? "" : " — NOT embedded") +
          (r.warnings.length ? `\n    ⚠ ${r.warnings.join("\n    ⚠ ")}` : ""),
      );
    } catch (e) {
      console.error(`[${i + 1}/${lessons.length}] ${l.title}: FAILED — ${(e as Error).message}`);
    }
    await sleep(300);
  }
  console.log(`Done: ${ok}/${lessons.length} lessons indexed.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
