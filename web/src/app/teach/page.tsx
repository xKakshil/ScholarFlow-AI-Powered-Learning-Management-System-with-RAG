"use client";

import Link from "next/link";
import useSWR from "swr";
import { ChevronRight, Layers, Plus, TrendingUp, Users, Wallet } from "lucide-react";
import { StatTile } from "@/components/charts";
import { AppShell } from "@/components/shell";
import { ButtonLink, EmptyState, ErrorState, PageHeader, Panel, Spinner } from "@/components/ui";
import { errorMessage, paths } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { plural, rupees } from "@/lib/format";
import type { InstructorAnalytics } from "@/lib/types";

function Dashboard() {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<InstructorAnalytics>(paths.instructorAnalytics, {
    revalidateOnMount: true,
  });

  if (isLoading) return <Spinner />;
  if (error || !data) return <ErrorState message={errorMessage(error)} onRetry={() => mutate()} />;

  const courses = [...data.courses].sort((a, b) => b.students - a.students);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Signed in as ${user?.email}`}
        action={
          <ButtonLink href="/teach/courses/new" icon={Plus}>
            New course
          </ButtonLink>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Wallet} label="Revenue" value={rupees(data.revenue)} />
        <StatTile icon={Users} label="Enrollments" value={String(data.totalStudents)} />
        <StatTile icon={TrendingUp} label="Average progress" value={`${data.avgProgress}%`} />
        <StatTile icon={Layers} label="Courses" value={String(data.totalCourses)} />
      </div>

      <div className="mt-10 mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your courses</h2>
        {courses.length > 0 && (
          <Link href="/teach/analytics" className="text-primary text-sm font-semibold hover:underline">
            View analytics
          </Link>
        )}
      </div>
      <Panel>
        {courses.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="Create your first course"
            description="Add a title and description, then add lessons with videos, notes and PDFs."
            action={
              <ButtonLink href="/teach/courses/new" icon={Plus}>
                New course
              </ButtonLink>
            }
          />
        ) : (
          <ul className="divide-line divide-y">
            {courses.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/teach/courses/${c.id}`}
                  className="hover:bg-page flex items-center gap-4 px-5 py-4"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{c.title}</span>
                    <span className="text-muted mt-0.5 block text-sm">
                      {plural(c.lessons, "lesson")}, {plural(c.students, "student")}
                    </span>
                  </span>
                  <ChevronRight className="text-faint size-5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

export default function TeachPage() {
  return (
    <AppShell roles={["INSTRUCTOR"]}>
      <Dashboard />
    </AppShell>
  );
}
