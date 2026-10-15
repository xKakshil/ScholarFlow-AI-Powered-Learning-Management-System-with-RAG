"use client";

import { useState } from "react";
import useSWR from "swr";
import { ChevronDown, Layers, TrendingUp, Users, Wallet } from "lucide-react";
import { BarList, ChartPanel, ColumnChart, StatTile } from "@/components/charts";
import { AppShell } from "@/components/shell";
import { ErrorState, PageHeader, Panel, Spinner } from "@/components/ui";
import { errorMessage, paths } from "@/lib/api";
import { formatPrice, monthlySeries, plural, rupees } from "@/lib/format";
import type { CourseStudents, InstructorAnalytics, InstructorCourse } from "@/lib/types";

function Analytics() {
  const analytics = useSWR<InstructorAnalytics>(paths.instructorAnalytics, { revalidateOnMount: true });
  const courses = useSWR<InstructorCourse[]>(paths.instructorCourses);
  const students = useSWR<CourseStudents[]>(paths.instructorStudents, { revalidateOnMount: true });
  const [open, setOpen] = useState<string | null>(null);

  if (analytics.isLoading || courses.isLoading || students.isLoading) return <Spinner />;
  const error = analytics.error ?? courses.error ?? students.error;
  if (error || !analytics.data) {
    return (
      <ErrorState
        message={errorMessage(error)}
        onRetry={() => (analytics.mutate(), courses.mutate(), students.mutate())}
      />
    );
  }

  const data = analytics.data;
  const price = new Map((courses.data ?? []).map((c) => [c.id, c.price]));
  const perCourse = data.courses.map((c) => ({ ...c, price: price.get(c.id) ?? 0 }));
  const listValue = perCourse.reduce((s, c) => s + c.price * c.students, 0);
  const enrollments = (students.data ?? []).flatMap((c) =>
    c.enrollments.map((e) => ({ at: e.createdAt, price: c.price })),
  );

  return (
    <>
      <PageHeader title="Analytics" description="Revenue, enrollments and progress across your courses." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={Wallet} label="Revenue" value={rupees(data.revenue)} hint="From completed payments" />
        <StatTile icon={Users} label="Enrollments" value={String(data.totalStudents)} />
        <StatTile icon={TrendingUp} label="Average progress" value={`${data.avgProgress}%`} />
        <StatTile
          icon={Layers}
          label="Courses"
          value={String(data.totalCourses)}
          hint={`List-price value ${rupees(listValue)}`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartPanel title="Enrollments per month" description="Last 6 months">
          <ColumnChart data={monthlySeries(enrollments.map((e) => e.at))} unit="enrollments" />
        </ChartPanel>
        <ChartPanel title="Enrollment value per month" description="Course list price of each new enrollment">
          <ColumnChart
            data={monthlySeries(
              enrollments.map((e) => e.at),
              6,
              enrollments.map((e) => e.price),
            )}
            format={rupees}
          />
        </ChartPanel>
        <ChartPanel title="Students by course">
          <BarList
            items={perCourse.map((c) => ({ id: c.id, label: c.title, value: c.students }))}
            empty="No enrollments yet."
          />
        </ChartPanel>
        <ChartPanel title="List-price value by course" description="Price multiplied by students">
          <BarList
            items={perCourse
              .filter((c) => c.price > 0)
              .map((c) => ({
                id: c.id,
                label: c.title,
                value: c.price * c.students,
                sub: `${formatPrice(c.price)} × ${c.students}`,
              }))}
            format={rupees}
            empty="No paid enrollments yet."
          />
        </ChartPanel>
      </div>

      <h2 className="mt-10 mb-4 text-2xl font-bold">Course breakdown</h2>
      <Panel>
        {perCourse.length === 0 ? (
          <p className="text-muted p-5">No courses yet.</p>
        ) : (
          <ul className="divide-line divide-y">
            {perCourse.map((c) => {
              const expanded = open === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? null : c.id)}
                    className="hover:bg-page flex w-full items-center gap-4 px-5 py-4 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{c.title}</span>
                      <span className="text-muted mt-0.5 block text-sm">
                        {plural(c.lessons, "lesson")}, {plural(c.students, "student")}, {formatPrice(c.price)}
                      </span>
                    </span>
                    <ChevronDown
                      className={`text-faint size-5 transition-transform ${expanded ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>
                  {expanded && (
                    <ul className="text-muted px-5 pb-4 text-sm">
                      {c.learners.length === 0 ? (
                        <li>No learners yet.</li>
                      ) : (
                        c.learners.map((l) => (
                          <li key={l.email} className="py-1">
                            <span className="text-ink">{l.name || "Learner"}</span> ({l.email})
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}

export default function InstructorAnalyticsPage() {
  return (
    <AppShell roles={["INSTRUCTOR"]}>
      <Analytics />
    </AppShell>
  );
}
