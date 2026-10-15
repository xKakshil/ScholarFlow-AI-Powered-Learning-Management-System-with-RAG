"use client";

import Link from "next/link";
import useSWR from "swr";
import { GraduationCap, Layers, Presentation, Receipt, Users, Wallet } from "lucide-react";
import { StatTile } from "@/components/charts";
import { AppShell } from "@/components/shell";
import { RolePill } from "@/components/table";
import { Avatar, ErrorState, PageHeader, Panel, Spinner } from "@/components/ui";
import { errorMessage, paths } from "@/lib/api";
import { formatDate, plural, rupees } from "@/lib/format";
import type { AdminStats } from "@/lib/types";

function Section({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold">{title}</h2>
        <Link href={href} className="text-primary text-sm font-semibold hover:underline">
          See all
        </Link>
      </div>
      <Panel>{children}</Panel>
    </section>
  );
}

function Overview() {
  const { data, error, isLoading, mutate } = useSWR<AdminStats>(paths.adminStats, {
    revalidateOnMount: true,
  });

  if (isLoading) return <Spinner />;
  if (error || !data) return <ErrorState message={errorMessage(error)} onRetry={() => mutate()} />;

  return (
    <>
      <PageHeader title="Overview" description="Platform activity at a glance." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatTile icon={Wallet} label="Revenue" value={rupees(data.revenue)} hint="Completed payments" />
        <StatTile icon={Receipt} label="Enrollments" value={String(data.enrollments)} />
        <StatTile icon={Layers} label="Courses" value={String(data.courses)} />
        <StatTile icon={Users} label="Users" value={String(data.totalUsers)} />
        <StatTile icon={GraduationCap} label="Learners" value={String(data.students)} />
        <StatTile icon={Presentation} label="Instructors" value={String(data.instructors)} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Section title="Newest users" href="/admin/users">
          {data.recentUsers.length === 0 ? (
            <p className="text-muted p-5">No users yet.</p>
          ) : (
            <ul className="divide-line divide-y">
              {data.recentUsers.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar label={u.name || u.email} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{u.name || u.email}</p>
                    <p className="text-muted text-sm">Joined {formatDate(u.createdAt)}</p>
                  </div>
                  <RolePill role={u.role} />
                </li>
              ))}
            </ul>
          )}
        </Section>
        <Section title="Newest courses" href="/admin/courses">
          {data.recentCourses.length === 0 ? (
            <p className="text-muted p-5">No courses yet.</p>
          ) : (
            <ul className="divide-line divide-y">
              {data.recentCourses.map((c) => (
                <li key={c.id} className="px-5 py-3">
                  <p className="truncate font-semibold">{c.title}</p>
                  <p className="text-muted truncate text-sm">
                    {c.instructor?.email}, {plural(c._count.lessons, "lesson")}, {c._count.enrollments}{" "}
                    enrolled
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </>
  );
}

export default function AdminOverviewPage() {
  return (
    <AppShell roles={["ADMIN"]}>
      <Overview />
    </AppShell>
  );
}
