-- RAG upgrade: Gemini embeddings (768 dims) + chunk metadata.
-- Existing chunks were stored without embeddings (whole notes, never vectorised),
-- so they are removed here; run `npm run rag:reindex` after deploying to rebuild them.

DELETE FROM "ContentChunk";

-- Swap the unused 384-dim column for a 768-dim one
ALTER TABLE "ContentChunk" DROP COLUMN "embedding";
ALTER TABLE "ContentChunk" ADD COLUMN "embedding" vector(768);

-- Chunk metadata
ALTER TABLE "ContentChunk" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'notes',
ADD COLUMN "chunkIndex" INTEGER NOT NULL DEFAULT 0;

-- Chunks belong to a lesson and go away with it
ALTER TABLE "ContentChunk" DROP CONSTRAINT "ContentChunk_lessonId_fkey";
ALTER TABLE "ContentChunk" ADD CONSTRAINT "ContentChunk_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ContentChunk_lessonId_idx" ON "ContentChunk"("lessonId");
