"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { ArrowLeft, ChevronLeft, ChevronRight, FileText, PlayCircle, VideoOff } from "lucide-react";
import { LessonVideo } from "@/components/lesson-video";
import { AppShell } from "@/components/shell";
import { AskAiPanel } from "@/components/tutor";
import { Button, buttonClass, EmptyState, ErrorState, Panel, Spinner } from "@/components/ui";
import { ApiError, errorMessage, paths } from "@/lib/api";
import type { Course } from "@/lib/types";

function Learn() {
  const { id } = useParams<{ id: string }>();
  const { data: course, error, isLoading, mutate } = useSWR<Course>(paths.learn(id));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isLoading) return <Spinner />;
  if (error) {
    const notEnrolled = error instanceof ApiError && error.status === 403;
    return notEnrolled ? (
      <EmptyState
        icon={PlayCircle}
        title="Enroll to start this course"
        description="Lessons open once you're enrolled."
        action={
          <Link href={`/courses/${id}`} className={buttonClass()}>
            View course
          </Link>
        }
      />
    ) : (
      <ErrorState message={errorMessage(error)} onRetry={() => mutate()} />
    );
  }
  if (!course) return null;

  const lessons = course.lessons ?? [];
  const lesson = lessons.find((l) => l.id === selectedId) ?? lessons[0];
  const index = lesson ? lessons.indexOf(lesson) : -1;
  const prev = index > 0 ? lessons[index - 1] : undefined;
  const next = index >= 0 ? lessons[index + 1] : undefined;

  return (
    <>
      <Link
        href="/my-learning"
        className="text-muted hover:text-ink mb-4 inline-flex items-center gap-1.5 text-sm font-semibold"
      >
        <ArrowLeft className="size-4" aria-hidden />
        My learning
      </Link>
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">{course.title}</h1>

      {!lesson ? (
        <Panel>
          <EmptyState
            icon={VideoOff}
            title="No lessons yet"
            description="The instructor hasn't published lessons for this course."
          />
        </Panel>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0">
            {lesson.videoUrl ? (
              <LessonVideo key={lesson.id} url={lesson.videoUrl} title={lesson.title} />
            ) : (
              <div className="rounded-panel bg-primary-soft text-primary-deep grid aspect-video place-items-center">
                <span className="flex items-center gap-2 font-semibold">
                  <FileText className="size-5" aria-hidden />
                  This lesson is notes only
                </span>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-primary text-sm font-semibold">
                  Lesson {index + 1} of {lessons.length}
                </p>
                <h2 className="mt-1 text-2xl font-bold">{lesson.title}</h2>
              </div>
              {lesson.pdfUrl && (
                <a
                  href={lesson.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonClass("secondary", "sm")}
                >
                  <FileText className="size-4" aria-hidden />
                  Open lesson PDF
                </a>
              )}
            </div>

            {lesson.notes && (
              <Panel className="mt-5 p-5 md:p-6">
                <h3 className="mb-3 text-lg font-bold">Notes</h3>
                <div className="max-w-[70ch] leading-relaxed whitespace-pre-wrap">{lesson.notes}</div>
              </Panel>
            )}

            <div className="mt-6 flex gap-3">
              <Button
                variant="secondary"
                icon={ChevronLeft}
                disabled={!prev}
                onClick={() => prev && setSelectedId(prev.id)}
              >
                Previous
              </Button>
              <Button disabled={!next} onClick={() => next && setSelectedId(next.id)}>
                Next lesson
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>

          <aside className="lg:sticky lg:top-10 lg:self-start">
            <Panel>
              <h2 className="border-line border-b px-5 py-4 text-base font-bold">Lessons</h2>
              <ol className="max-h-[60vh] overflow-y-auto py-1">
                {lessons.map((l, i) => {
                  const active = l.id === lesson.id;
                  return (
                    <li key={l.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(l.id)}
                        aria-current={active ? "true" : undefined}
                        className={`flex w-full items-start gap-3 px-5 py-3 text-left text-sm ${
                          active ? "bg-primary-soft text-primary-deep font-semibold" : "hover:bg-page"
                        }`}
                      >
                        <span className="text-faint w-5 shrink-0 tabular-nums">{i + 1}</span>
                        <span className="flex-1">{l.title}</span>
                        {l.videoUrl ? (
                          <PlayCircle className="mt-0.5 size-4 shrink-0 opacity-60" aria-hidden />
                        ) : (
                          <FileText className="mt-0.5 size-4 shrink-0 opacity-60" aria-hidden />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </Panel>
          </aside>
        </div>
      )}

      <AskAiPanel courseId={course.id} courseTitle={course.title} lessonTitle={lesson?.title} />
    </>
  );
}

export default function LearnPage() {
  return (
    <AppShell roles={["LEARNER"]}>
      <Learn />
    </AppShell>
  );
}
