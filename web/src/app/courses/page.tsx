"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { Search, SearchX } from "lucide-react";
import { CourseCard } from "@/components/course";
import { AppShell } from "@/components/shell";
import { AskAiPanel } from "@/components/tutor";
import { EmptyState, ErrorState, PageHeader, Spinner } from "@/components/ui";
import { errorMessage, paths } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Course } from "@/lib/types";

function Catalogue() {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useSWR<Course[]>(paths.courses);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(
    () => [...new Set((data ?? []).map((c) => c.category?.trim()).filter((c): c is string => !!c))].sort(),
    [data],
  );

  const courses = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((c) => {
      if (category && c.category?.trim() !== category) return false;
      if (!q) return true;
      return [c.title, c.description, c.category, c.instructor?.name].some((s) =>
        s?.toLowerCase().includes(q),
      );
    });
  }, [data, query, category]);

  return (
    <>
      <PageHeader
        title="Explore courses"
        description="Every course comes with an AI tutor that answers from its lesson notes."
      />

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center">
        <label className="relative md:w-80">
          <span className="sr-only">Search courses</span>
          <Search
            className="text-faint pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, topic or instructor"
            className="rounded-control border-line bg-surface placeholder:text-faint focus:border-primary focus:ring-primary/20 h-11 w-full border pr-3 pl-10 text-[15px] focus:ring-2 focus:outline-none"
          />
        </label>
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {[null, ...categories].map((c) => {
              const active = c === category;
              return (
                <button
                  key={c ?? "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(c)}
                  className={`h-9 rounded-full border px-4 text-sm font-semibold transition-colors ${
                    active
                      ? "border-primary bg-primary text-white"
                      : "border-line bg-surface hover:border-faint"
                  }`}
                >
                  {c ?? "All"}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={errorMessage(error)} onRetry={() => mutate()} />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={data?.length ? "No courses match" : "No courses yet"}
          description={data?.length ? "Try a different search or category." : "New courses will appear here."}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <CourseCard
              key={c.id}
              course={c}
              href={`/courses/${c.id}`}
              enrolled={(c.enrollments?.length ?? 0) > 0}
            />
          ))}
        </div>
      )}

      {user?.role === "LEARNER" && <AskAiPanel />}
    </>
  );
}

export default function CoursesPage() {
  return (
    <AppShell allowPublic>
      <Catalogue />
    </AppShell>
  );
}
