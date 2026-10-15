"use client";

import { Fragment, useMemo, useState } from "react";
import useSWR from "swr";
import { ChevronDown, FileText, PlayCircle } from "lucide-react";
import { AppShell } from "@/components/shell";
import { DataTable, SearchField } from "@/components/table";
import { Badge, ErrorState, PageHeader, Spinner } from "@/components/ui";
import { errorMessage, paths } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { AdminCourse } from "@/lib/types";

function Courses() {
  const { data, error, isLoading, mutate } = useSWR<AdminCourse[]>(paths.adminCourses, {
    revalidateOnMount: true,
  });
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter(
      (c) =>
        !q ||
        [c.title, c.category, c.instructor?.email, c.instructor?.name].some((s) =>
          (s ?? "").toLowerCase().includes(q),
        ),
    );
  }, [data, query]);

  return (
    <>
      <PageHeader title="Courses" description={data ? `${data.length} courses on the platform` : undefined} />
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => mutate()} />
      ) : (
        <>
          <SearchField value={query} onChange={setQuery} placeholder="Search title, category or instructor" />
          <DataTable head={["Course", "Instructor", "Price", "Lessons", "Enrolled", ""]}>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted px-5 py-10 text-center">
                  No courses match.
                </td>
              </tr>
            ) : (
              rows.map((c) => {
                const expanded = open === c.id;
                return (
                  <Fragment key={c.id}>
                    <tr
                      className="hover:bg-page cursor-pointer"
                      onClick={() => setOpen(expanded ? null : c.id)}
                    >
                      <td className="px-5 py-3">
                        <p className="font-semibold">{c.title}</p>
                        <div className="mt-1 flex gap-1.5">
                          {c.category && <Badge tone="primary">{c.category}</Badge>}
                          {c.level && <Badge>{c.level}</Badge>}
                        </div>
                      </td>
                      <td className="text-muted px-5 py-3">{c.instructor?.name || c.instructor?.email}</td>
                      <td className="px-5 py-3 font-semibold whitespace-nowrap">{formatPrice(c.price)}</td>
                      <td className="px-5 py-3 tabular-nums">{c.lessons.length}</td>
                      <td className="px-5 py-3 tabular-nums">{c.enrollments.length}</td>
                      <td className="px-5 py-3 text-right">
                        <button
                          type="button"
                          aria-expanded={expanded}
                          aria-label={`${expanded ? "Hide" : "Show"} lessons for ${c.title}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpen(expanded ? null : c.id);
                          }}
                          className="rounded-control hover:bg-surface grid size-8 place-items-center"
                        >
                          <ChevronDown
                            className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                            aria-hidden
                          />
                        </button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="bg-page/50">
                        <td colSpan={6} className="px-5 py-4">
                          <p className="text-muted max-w-3xl">{c.description}</p>
                          {c.lessons.length === 0 ? (
                            <p className="text-muted mt-3">No lessons yet.</p>
                          ) : (
                            <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
                              {c.lessons.map((l, i) => (
                                <li key={l.id} className="flex items-center gap-2">
                                  {l.videoUrl ? (
                                    <PlayCircle className="text-faint size-4" aria-hidden />
                                  ) : (
                                    <FileText className="text-faint size-4" aria-hidden />
                                  )}
                                  {i + 1}. {l.title}
                                </li>
                              ))}
                            </ol>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })
            )}
          </DataTable>
        </>
      )}
    </>
  );
}

export default function AdminCoursesPage() {
  return (
    <AppShell roles={["ADMIN"]}>
      <Courses />
    </AppShell>
  );
}
