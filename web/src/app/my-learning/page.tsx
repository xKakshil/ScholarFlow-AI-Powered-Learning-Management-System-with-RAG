"use client";

import useSWR from "swr";
import { Library } from "lucide-react";
import { CourseCard } from "@/components/course";
import { AppShell } from "@/components/shell";
import { ButtonLink, EmptyState, ErrorState, PageHeader, Spinner } from "@/components/ui";
import { errorMessage, paths } from "@/lib/api";
import type { Enrollment } from "@/lib/types";

function MyLearning() {
  const { data, error, isLoading, mutate } = useSWR<Enrollment[]>(paths.myCourses, {
    revalidateOnMount: true,
  });

  return (
    <>
      <PageHeader title="My learning" description="Courses you're enrolled in." />
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => mutate()} />
      ) : !data?.length ? (
        <EmptyState
          icon={Library}
          title="You haven't enrolled in a course yet"
          description="Find a course to start learning. Your enrolled courses will show up here."
          action={<ButtonLink href="/courses">Explore courses</ButtonLink>}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {data
            .filter((e) => e.course)
            .map((e) => (
              <CourseCard key={e.id} course={e.course} href={`/learn/${e.courseId}`} />
            ))}
        </div>
      )}
    </>
  );
}

export default function MyLearningPage() {
  return (
    <AppShell roles={["LEARNER"]}>
      <MyLearning />
    </AppShell>
  );
}
