"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useSWR from "swr";
import { BarChart3, FileText, Layers, Library, Sparkles, Upload } from "lucide-react";
import { CourseCard } from "@/components/course";
import { Logo } from "@/components/shell";
import { TutorAnswer } from "@/components/tutor";
import { ButtonLink, Spinner } from "@/components/ui";
import { paths } from "@/lib/api";
import { homeFor, useAuth } from "@/lib/auth";
import type { Course, TutorResponse } from "@/lib/types";

const SAMPLE_ANSWER: TutorResponse = {
  answer: "",
  fromNotes:
    "A closure is a function bundled with references to its surrounding scope, so an inner function keeps access to the outer function's variables even after it has returned [1].",
  explanation:
    "Think of makeCounter(): it returns a small function that still holds the count variable. Each call reads and updates that same count, which is how JavaScript gives you private state without a class.",
  usedOutsideKnowledge: false,
  retrieval: "vector",
  sources: [
    {
      id: "sample",
      n: 1,
      content:
        "A closure is a function bundled together with references to its surrounding lexical scope. When a function is created inside another function, it keeps access to the outer function's variables even after the outer function has returned.",
      score: 0.82,
      lessonTitle: "Closures",
      courseTitle: "JavaScript: The Hard Parts",
      cited: true,
    },
  ],
};

const LEARNER_POINTS = [
  {
    icon: Library,
    title: "Courses with real notes",
    text: "Video lessons, written notes and PDFs from your instructors.",
  },
  {
    icon: Sparkles,
    title: "A tutor that cites your notes",
    text: "Ask anything. Every answer shows what your course material says before explaining it.",
  },
  {
    icon: Layers,
    title: "Pick up where you left off",
    text: "Your enrolled courses and lessons, on the web and on your phone.",
  },
];

const INSTRUCTOR_POINTS = [
  {
    icon: Upload,
    title: "Publish in minutes",
    text: "Create a course, then add lessons with a video link, notes and a PDF.",
  },
  {
    icon: FileText,
    title: "Your material trains the tutor",
    text: "Notes and PDFs are indexed automatically, so answers stay grounded in what you teach.",
  },
  {
    icon: BarChart3,
    title: "See what's working",
    text: "Revenue, enrollments and learner progress for every course.",
  },
];

export default function Home() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const { data: courses } = useSWR<Course[]>(ready && !user ? paths.courses : null);

  useEffect(() => {
    if (ready && user) router.replace(homeFor(user.role));
  }, [ready, user, router]);

  if (!ready || user) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 md:px-6">
        <Logo />
        <nav className="hidden sm:block">
          <Link href="/courses" className="text-muted hover:text-ink text-sm font-semibold">
            Courses
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ButtonLink href="/login" variant="ghost" size="sm">
            Log in
          </ButtonLink>
          <ButtonLink href="/register" size="sm">
            Sign up
          </ButtonLink>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-20 md:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div>
            <h1 className="text-[2.6rem] leading-[1.05] font-extrabold sm:text-6xl">
              Ask your course anything. Get answers from your instructor&apos;s notes.
            </h1>
            <p className="text-muted mt-5 max-w-xl text-lg leading-relaxed">
              ScholarFlow is an online learning platform where the AI tutor reads the lessons you&apos;re
              enrolled in, quotes what your notes say, and then explains it in plain words.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/register">Start learning for free</ButtonLink>
              <ButtonLink href="/courses" variant="secondary">
                Browse courses
              </ButtonLink>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-panel bg-primary mb-3 ml-auto w-fit max-w-[85%] rounded-br-md px-4 py-3 text-white">
              Why does a closure remember variables after the function returns?
            </div>
            <div className="rounded-panel border-line bg-surface rounded-bl-md border p-5 shadow-[0_24px_60px_-28px_rgba(22,27,46,0.35)]">
              <TutorAnswer result={SAMPLE_ANSWER} />
            </div>
          </div>
        </section>

        {courses && courses.length > 0 && (
          <section className="border-line bg-surface border-y">
            <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
              <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                <h2 className="text-3xl font-bold">Courses you can start today</h2>
                <Link href="/courses" className="text-primary font-semibold hover:underline">
                  See all courses
                </Link>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {courses.slice(0, 3).map((c) => (
                  <CourseCard key={c.id} course={c} href={`/courses/${c.id}`} />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="mx-auto grid max-w-6xl gap-12 px-4 py-20 md:grid-cols-2 md:px-6">
          {[
            {
              title: "For learners",
              points: LEARNER_POINTS,
              cta: "Create a learner account",
              href: "/register",
            },
            {
              title: "For instructors",
              points: INSTRUCTOR_POINTS,
              cta: "Start teaching",
              href: "/register?role=instructor",
            },
          ].map((group) => (
            <div key={group.title}>
              <h2 className="text-3xl font-bold">{group.title}</h2>
              <ul className="mt-6 flex flex-col gap-6">
                {group.points.map((p) => (
                  <li key={p.title} className="flex gap-4">
                    <span className="rounded-control bg-primary-soft grid size-10 shrink-0 place-items-center">
                      <p.icon className="text-primary size-5" aria-hidden />
                    </span>
                    <span>
                      <span className="block font-semibold">{p.title}</span>
                      <span className="text-muted mt-0.5 block">{p.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <ButtonLink href={group.href} variant="secondary" className="mt-8">
                {group.cta}
              </ButtonLink>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-line border-t">
        <div className="text-muted mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm md:px-6">
          <Logo />
          <p>Learn with your instructor&apos;s notes, anywhere.</p>
        </div>
      </footer>
    </div>
  );
}
