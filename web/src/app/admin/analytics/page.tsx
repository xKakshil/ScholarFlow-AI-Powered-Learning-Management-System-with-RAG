"use client";

import useSWR from "swr";
import { CircleDollarSign, Receipt, Tag, Wallet } from "lucide-react";
import { BarList, ChartPanel, ColumnChart, StatTile } from "@/components/charts";
import { AppShell } from "@/components/shell";
import { ErrorState, PageHeader, Spinner } from "@/components/ui";
import { errorMessage, paths } from "@/lib/api";
import { formatPrice, monthlySeries, rupees } from "@/lib/format";
import type { AdminCourse, AdminEnrollment, AdminRevenue, AdminStats, AdminUser } from "@/lib/types";

function AdminAnalytics() {
  const opts = { revalidateOnMount: true };
  const stats = useSWR<AdminStats>(paths.adminStats, opts);
  const revenue = useSWR<AdminRevenue>(paths.adminRevenue, opts);
  const enrollments = useSWR<AdminEnrollment[]>(paths.adminEnrollments, opts);
  const users = useSWR<AdminUser[]>(paths.adminUsers, opts);
  const courses = useSWR<AdminCourse[]>(paths.adminCourses, opts);
  const all = [stats, revenue, enrollments, users, courses];

  if (all.some((r) => r.isLoading)) return <Spinner />;
  const error = all.find((r) => r.error)?.error;
  if (error || !stats.data)
    return <ErrorState message={errorMessage(error)} onRetry={() => all.forEach((r) => r.mutate())} />;

  const e = enrollments.data ?? [];
  const u = users.data ?? [];
  const c = courses.data ?? [];
  const listValue = e.reduce((s, x) => s + (x.course?.price ?? 0), 0);
  const paid = e.filter((x) => (x.course?.price ?? 0) > 0).length;

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Revenue, growth and course performance across the platform."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={Wallet}
          label="Revenue"
          value={rupees(stats.data.revenue)}
          hint="Completed payments"
        />
        <StatTile
          icon={CircleDollarSign}
          label="All payment records"
          value={rupees(revenue.data?.revenue ?? 0)}
          hint={`${revenue.data?.transactions ?? 0} records, any status`}
        />
        <StatTile
          icon={Receipt}
          label="Paid-course enrollments"
          value={String(paid)}
          hint={`of ${e.length} total`}
        />
        <StatTile icon={Tag} label="List-price value" value={rupees(listValue)} hint="All enrollments" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartPanel title="Enrollments per month" description="Last 6 months">
          <ColumnChart data={monthlySeries(e.map((x) => x.createdAt))} unit="enrollments" />
        </ChartPanel>
        <ChartPanel title="Enrollment value per month" description="Course list price of each new enrollment">
          <ColumnChart
            data={monthlySeries(
              e.map((x) => x.createdAt),
              6,
              e.map((x) => x.course?.price ?? 0),
            )}
            format={rupees}
          />
        </ChartPanel>
        <ChartPanel title="New users per month" description="Sign-ups across all roles">
          <ColumnChart data={monthlySeries(u.map((x) => x.createdAt))} unit="sign-ups" />
        </ChartPanel>
        <ChartPanel title="Users by role">
          <BarList
            items={[
              { id: "LEARNER", label: "Learners", value: u.filter((x) => x.role === "LEARNER").length },
              {
                id: "INSTRUCTOR",
                label: "Instructors",
                value: u.filter((x) => x.role === "INSTRUCTOR").length,
              },
              { id: "ADMIN", label: "Admins", value: u.filter((x) => x.role === "ADMIN").length },
            ]}
          />
        </ChartPanel>
        <ChartPanel title="Top courses by enrollments">
          <BarList
            items={c.map((x) => ({
              id: x.id,
              label: x.title,
              value: x.enrollments.length,
              sub: `by ${x.instructor?.name || x.instructor?.email}`,
            }))}
            max={6}
            empty="No enrollments yet."
          />
        </ChartPanel>
        <ChartPanel title="Top courses by list-price value" description="Price multiplied by enrollments">
          <BarList
            items={c
              .filter((x) => x.price > 0)
              .map((x) => ({
                id: x.id,
                label: x.title,
                value: x.price * x.enrollments.length,
                sub: `${formatPrice(x.price)} × ${x.enrollments.length}`,
              }))}
            format={rupees}
            max={6}
            empty="No paid-course enrollments yet."
          />
        </ChartPanel>
      </div>
    </>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <AppShell roles={["ADMIN"]}>
      <AdminAnalytics />
    </AppShell>
  );
}
