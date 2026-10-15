"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { CircleUser, Lock, PlayCircle, ShieldCheck } from "lucide-react";
import { CourseMeta, CourseThumb } from "@/components/course";
import { Dialog } from "@/components/dialog";
import { AppShell } from "@/components/shell";
import { useToast } from "@/components/toast";
import { AskAiPanel } from "@/components/tutor";
import { Badge, Button, ButtonLink, ErrorState, Panel, Spinner } from "@/components/ui";
import { api, errorMessage, paths } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPrice, plural } from "@/lib/format";
import type { Course } from "@/lib/types";

function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { data, error, isLoading, mutate } = useSWR<Course[]>(paths.courses);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState message={errorMessage(error)} onRetry={() => mutate()} />;
  const course = data?.find((c) => c.id === id);
  if (!course) return <ErrorState message="This course isn't available anymore." />;

  const enrolled = (course.enrollments?.length ?? 0) > 0;
  const lessons = course.lessons ?? [];
  const paid = course.price > 0;
  const isLearner = user?.role === "LEARNER";

  async function enroll() {
    setEnrolling(true);
    setEnrollError(null);
    try {
      await api.enroll(course!.id);
      await mutate();
      toast(paid ? "Purchase complete. You're enrolled." : "You're enrolled.");
      router.push(`/learn/${course!.id}`);
    } catch (e) {
      const message = errorMessage(e, "Couldn't enroll. Please try again.");
      if (message === "Already enrolled") router.push(`/learn/${course!.id}`);
      else setEnrollError(message);
      setEnrolling(false);
    }
  }

  const cta = !user ? (
    <ButtonLink href={`/login?next=/courses/${course.id}`} className="w-full">
      Log in to enroll
    </ButtonLink>
  ) : !isLearner ? (
    <p className="text-muted text-sm">Enrollment is available to learner accounts.</p>
  ) : enrolled ? (
    <ButtonLink href={`/learn/${course.id}`} icon={PlayCircle} className="w-full">
      Continue learning
    </ButtonLink>
  ) : (
    <Button
      className="w-full"
      loading={enrolling && !paid}
      onClick={() => (paid ? setCheckoutOpen(true) : enroll())}
    >
      {paid ? `Buy for ${formatPrice(course.price)}` : "Enroll for free"}
    </Button>
  );

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <CourseThumb course={course} className="rounded-panel mb-6 aspect-[21/9]" />
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <CourseMeta course={course} />
            {enrolled && <Badge tone="success">Enrolled</Badge>}
          </div>
          <h1 className="text-3xl font-bold md:text-[2.75rem] md:leading-tight">{course.title}</h1>
          {course.instructor && (
            <p className="text-muted mt-3 flex items-center gap-2">
              <CircleUser className="size-5" aria-hidden />
              {course.instructor.name || course.instructor.email}
            </p>
          )}
          <p className="mt-6 max-w-2xl text-lg leading-relaxed">{course.description}</p>

          <h2 className="mt-10 mb-4 text-2xl font-bold">Curriculum</h2>
          {lessons.length === 0 ? (
            <p className="text-muted">Lessons haven&apos;t been published yet.</p>
          ) : (
            <Panel>
              <ol className="divide-line divide-y">
                {lessons.map((l, i) => (
                  <li key={l.id} className="flex items-center gap-4 px-5 py-4">
                    <span className="text-faint w-6 text-sm font-semibold tabular-nums">{i + 1}</span>
                    <span className="flex-1">{l.title}</span>
                    {enrolled ? (
                      <PlayCircle className="text-primary size-5" aria-label="Available" />
                    ) : (
                      <Lock className="text-faint size-4" aria-label="Locked" />
                    )}
                  </li>
                ))}
              </ol>
            </Panel>
          )}
        </div>

        <aside className="lg:sticky lg:top-10 lg:self-start">
          <Panel className="p-6">
            <p className="font-display text-4xl font-bold">{formatPrice(course.price)}</p>
            <dl className="mt-4 mb-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted">Lessons</dt>
                <dd className="font-semibold">{lessons.length}</dd>
              </div>
              <div>
                <dt className="text-muted">Learners</dt>
                <dd className="font-semibold">{course._count?.enrollments ?? 0}</dd>
              </div>
            </dl>
            {cta}
            {enrollError && (
              <p role="alert" className="text-danger mt-3 text-sm">
                {enrollError}
              </p>
            )}
            <p className="text-muted mt-4 text-sm">
              Includes the AI tutor for this course, with answers drawn from{" "}
              {plural(lessons.length, "lesson")}.
            </p>
          </Panel>
        </aside>
      </div>

      <Dialog
        open={checkoutOpen}
        onClose={() => !enrolling && setCheckoutOpen(false)}
        title="Confirm purchase"
      >
        <div className="rounded-control border-line flex gap-4 border p-4">
          <CourseThumb course={course} className="rounded-control size-16 shrink-0 [&_span]:text-2xl" />
          <div className="min-w-0">
            <p className="font-semibold">{course.title}</p>
            <p className="font-display mt-1 text-2xl font-bold">{formatPrice(course.price)}</p>
          </div>
        </div>
        <p className="rounded-control bg-warning-soft text-warning mt-4 flex items-start gap-2 px-3 py-2.5 text-sm">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          Test mode: no real payment will be taken.
        </p>
        {enrollError && (
          <p role="alert" className="text-danger mt-3 text-sm">
            {enrollError}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setCheckoutOpen(false)} disabled={enrolling}>
            Cancel
          </Button>
          <Button onClick={enroll} loading={enrolling}>
            Pay {formatPrice(course.price)}
          </Button>
        </div>
      </Dialog>

      {isLearner && <AskAiPanel courseId={course.id} courseTitle={course.title} enrolled={enrolled} />}
    </>
  );
}

export default function CourseDetailPage() {
  return (
    <AppShell allowPublic>
      <CourseDetail />
    </AppShell>
  );
}
