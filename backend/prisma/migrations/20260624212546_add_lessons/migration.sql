/*
  Warnings:

  - You are about to drop the column `courseId` on the `ContentChunk` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Course` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrl` on the `Course` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ContentChunk" DROP CONSTRAINT "ContentChunk_courseId_fkey";

-- AlterTable
ALTER TABLE "ContentChunk" DROP COLUMN "courseId",
ADD COLUMN     "lessonId" TEXT;

-- AlterTable
ALTER TABLE "Course" DROP COLUMN "content",
DROP COLUMN "updatedAt",
DROP COLUMN "videoUrl",
ALTER COLUMN "price" DROP DEFAULT;

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "videoUrl" TEXT,
    "notes" TEXT,
    "pdfUrl" TEXT,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentChunk" ADD CONSTRAINT "ContentChunk_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progress" ADD CONSTRAINT "Progress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
