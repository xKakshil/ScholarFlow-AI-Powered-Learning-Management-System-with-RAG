"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { AppShell } from "@/components/shell";
import { DataTable, RolePill, SearchField } from "@/components/table";
import { Avatar, ErrorState, PageHeader, Spinner } from "@/components/ui";
import { errorMessage, paths } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { AdminUser, Role } from "@/lib/types";

const FILTERS: { key: Role | "ALL"; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "LEARNER", label: "Learners" },
  { key: "INSTRUCTOR", label: "Instructors" },
  { key: "ADMIN", label: "Admins" },
];

function Users() {
  const { data, error, isLoading, mutate } = useSWR<AdminUser[]>(paths.adminUsers, {
    revalidateOnMount: true,
  });
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<Role | "ALL">("ALL");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter(
      (u) =>
        (role === "ALL" || u.role === role) &&
        (!q || u.email.toLowerCase().includes(q) || (u.name ?? "").toLowerCase().includes(q)),
    );
  }, [data, query, role]);

  const count = (key: Role | "ALL") =>
    key === "ALL" ? (data?.length ?? 0) : (data ?? []).filter((u) => u.role === key).length;

  return (
    <>
      <PageHeader title="Users" description={data ? `${data.length} accounts` : undefined} />
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => mutate()} />
      ) : (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
            <SearchField value={query} onChange={setQuery} placeholder="Search by name or email" />
            <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter by role">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  aria-pressed={role === f.key}
                  onClick={() => setRole(f.key)}
                  className={`h-11 rounded-full border px-4 text-sm font-semibold ${
                    role === f.key
                      ? "border-primary bg-primary text-white"
                      : "border-line bg-surface hover:border-faint"
                  }`}
                >
                  {f.label} <span className="opacity-70">{count(f.key)}</span>
                </button>
              ))}
            </div>
          </div>
          <DataTable head={["User", "Email", "Role", "Joined"]}>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted px-5 py-10 text-center">
                  No users match.
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-3">
                      <Avatar label={u.name || u.email} />
                      <span className="font-semibold">{u.name || "No name"}</span>
                    </span>
                  </td>
                  <td className="text-muted px-5 py-3">{u.email}</td>
                  <td className="px-5 py-3">
                    <RolePill role={u.role} />
                  </td>
                  <td className="text-muted px-5 py-3 whitespace-nowrap">{formatDate(u.createdAt)}</td>
                </tr>
              ))
            )}
          </DataTable>
        </>
      )}
    </>
  );
}

export default function AdminUsersPage() {
  return (
    <AppShell roles={["ADMIN"]}>
      <Users />
    </AppShell>
  );
}
