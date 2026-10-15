"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { AppShell } from "@/components/shell";
import { DataTable, SearchField } from "@/components/table";
import { Avatar, ErrorState, PageHeader, Spinner } from "@/components/ui";
import { errorMessage, paths } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";
import type { AdminEnrollment } from "@/lib/types";

function Enrollments() {
  const { data, error, isLoading, mutate } = useSWR<AdminEnrollment[]>(paths.adminEnrollments, {
    revalidateOnMount: true,
  });
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter(
      (e) =>
        !q || [e.user?.email, e.user?.name, e.course?.title].some((s) => (s ?? "").toLowerCase().includes(q)),
    );
  }, [data, query]);

  return (
    <>
      <PageHeader title="Enrollments" description={data ? `${data.length} enrollments` : undefined} />
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => mutate()} />
      ) : (
        <>
          <SearchField value={query} onChange={setQuery} placeholder="Search learner or course" />
          <DataTable head={["Learner", "Course", "Price", "Date"]}>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted px-5 py-10 text-center">
                  No enrollments match.
                </td>
              </tr>
            ) : (
              rows.map((e) => {
                const who = e.user?.name || e.user?.email || "Deleted user";
                return (
                  <tr key={e.id}>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3">
                        <Avatar label={who} />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{who}</span>
                          {e.user?.name && <span className="text-muted block truncate">{e.user.email}</span>}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3">{e.course?.title}</td>
                    <td className="px-5 py-3 font-semibold whitespace-nowrap">
                      {e.course ? formatPrice(e.course.price) : ""}
                    </td>
                    <td className="text-muted px-5 py-3 whitespace-nowrap">{formatDate(e.createdAt)}</td>
                  </tr>
                );
              })
            )}
          </DataTable>
        </>
      )}
    </>
  );
}

export default function AdminEnrollmentsPage() {
  return (
    <AppShell roles={["ADMIN"]}>
      <Enrollments />
    </AppShell>
  );
}
