"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Users } from "lucide-react";
import { AppShell } from "@/components/shell";
import { Avatar, EmptyState, ErrorState, PageHeader, Panel, Spinner } from "@/components/ui";
import { SearchField } from "@/components/table";
import { errorMessage, paths } from "@/lib/api";
import { formatDate, plural } from "@/lib/format";
import type { CourseStudents } from "@/lib/types";

function Students() {
  const { data, error, isLoading, mutate } = useSWR<CourseStudents[]>(paths.instructorStudents, {
    revalidateOnMount: true,
  });
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? [])
      .map((c) => ({
        ...c,
        enrollments: c.enrollments.filter(
          (e) =>
            !q || e.user.email.toLowerCase().includes(q) || (e.user.name ?? "").toLowerCase().includes(q),
        ),
      }))
      .filter((c) => c.enrollments.length > 0);
  }, [data, query]);

  const total = (data ?? []).reduce((s, c) => s + c.enrollments.length, 0);

  return (
    <>
      <PageHeader
        title="Students"
        description={data ? `${plural(total, "enrollment")} across your courses` : undefined}
      />
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => mutate()} />
      ) : total === 0 ? (
        <EmptyState
          icon={Users}
          title="No students yet"
          description="Learners who enroll in your courses will appear here."
        />
      ) : (
        <>
          <SearchField value={query} onChange={setQuery} placeholder="Search by name or email" />
          {groups.length === 0 && (
            <p className="text-muted py-10 text-center">No students match your search.</p>
          )}
          <div className="flex flex-col gap-6">
            {groups.map((c) => (
              <section key={c.id}>
                <h2 className="mb-3 flex items-baseline gap-2 text-lg font-bold">
                  {c.title}
                  <span className="text-muted text-sm font-normal">
                    {plural(c.enrollments.length, "student")}
                  </span>
                </h2>
                <Panel>
                  <ul className="divide-line divide-y">
                    {c.enrollments.map((e) => (
                      <li key={e.id} className="flex items-center gap-3 px-5 py-3">
                        <Avatar label={e.user.name || e.user.email} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{e.user.name || e.user.email}</p>
                          {e.user.name && <p className="text-muted truncate text-sm">{e.user.email}</p>}
                        </div>
                        <span className="text-muted text-sm">Joined {formatDate(e.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                </Panel>
              </section>
            ))}
          </div>
        </>
      )}
    </>
  );
}

export default function StudentsPage() {
  return (
    <AppShell roles={["INSTRUCTOR"]}>
      <Students />
    </AppShell>
  );
}
