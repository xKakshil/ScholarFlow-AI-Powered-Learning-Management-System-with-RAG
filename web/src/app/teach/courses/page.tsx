"use client";

import useSWR from "swr";
import { Layers, Plus } from "lucide-react";
import { CourseCard } from "@/components/course";
import { AppShell } from "@/components/shell";
import { ButtonLink, EmptyState, ErrorState, PageHeader, Spinner } from "@/components/ui";
import { errorMessage, paths } from "@/lib/api";
import type { InstructorCourse } from "@/lib/types";

function InstructorCourses() {
  const { data, error, isLoading, mutate } = useSWR<InstructorCourse[]>(paths.instructorCourses, {
    revalidateOnMount: true,
  });

  return (
    <>
      <PageHeader
        title="My courses"
        description="Courses you publish appear in the catalogue for every learner."
        action={
          data?.length ? (
            <ButtonLink href="/teach/courses/new" icon={Plus}>
              New course
            </ButtonLink>
          ) : null
        }
      />
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => mutate()} />
      ) : !data?.length ? (
        <EmptyState
          icon={Layers}
          title="You haven't created a course yet"
          description="Create a course, then add lessons. Notes and PDFs are indexed for the AI tutor automatically."
          action={
            <ButtonLink href="/teach/courses/new" icon={Plus}>
              New course
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((c) => (
            <CourseCard
              key={c.id}
              course={{ ...c, _count: { enrollments: c.enrollments.length }, enrollments: [] }}
              href={`/teach/courses/${c.id}`}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default function InstructorCoursesPage() {
  return (
    <AppShell roles={["INSTRUCTOR"]}>
      <InstructorCourses />
    </AppShell>
  );
}
