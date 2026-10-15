"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { ArrowLeft, ChevronDown, FileText, NotebookText, Plus, Video, VideoOff } from "lucide-react";
import { CourseMeta, CourseThumb } from "@/components/course";
import { Dialog } from "@/components/dialog";
import { LessonVideo } from "@/components/lesson-video";
import { AppShell } from "@/components/shell";
import { useToast } from "@/components/toast";
import {
  Badge,
  Button,
  buttonClass,
  EmptyState,
  ErrorState,
  Input,
  Panel,
  Spinner,
  Textarea,
} from "@/components/ui";
import { api, errorMessage, paths } from "@/lib/api";
import { formatPrice, plural } from "@/lib/format";
import type { InstructorCourse, Lesson } from "@/lib/types";

const isUrl = (s: string) => /^https?:\/\/\S+$/i.test(s);

function AddLessonDialog({
  courseId,
  open,
  onClose,
  onCreated,
}: {
  courseId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<unknown>;
}) {
  const toast = useToast();
  const empty = { title: "", videoUrl: "", pdfUrl: "", notes: "" };
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    const v = {
      title: form.title.trim(),
      videoUrl: form.videoUrl.trim(),
      pdfUrl: form.pdfUrl.trim(),
      notes: form.notes.trim(),
    };
    if (v.title.length < 2) next.title = "Give the lesson a title.";
    if (v.videoUrl && !isUrl(v.videoUrl)) next.videoUrl = "Use a full http(s) link.";
    if (v.pdfUrl && !isUrl(v.pdfUrl)) next.pdfUrl = "Use a full http(s) link.";
    if (!v.videoUrl && !v.pdfUrl && !v.notes) next.notes = "Add at least a video, a PDF or some notes.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setFormError(null);
    try {
      const lesson = await api.createLesson({ courseId, ...v });
      await onCreated();
      const rag = lesson.rag;
      if (rag?.warnings?.length) toast(`Lesson added. ${rag.warnings[0]}`, "error");
      else if (rag?.embedded)
        toast(`Lesson added and indexed for the AI tutor (${plural(rag.chunks, "section")}).`);
      else toast("Lesson added.");
      setForm(empty);
      onClose();
    } catch (err) {
      setFormError(errorMessage(err, "Couldn't add the lesson."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} title="Add lesson" wide>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Lesson title"
          value={form.title}
          onChange={set("title")}
          placeholder="Introduction to recursion"
          error={errors.title}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Video link"
            type="url"
            value={form.videoUrl}
            onChange={set("videoUrl")}
            placeholder="YouTube, Vimeo or .mp4"
            error={errors.videoUrl}
          />
          <Input
            label="PDF link"
            type="url"
            value={form.pdfUrl}
            onChange={set("pdfUrl")}
            placeholder="Slides or handout"
            error={errors.pdfUrl}
          />
        </div>
        <Textarea
          label="Notes"
          value={form.notes}
          onChange={set("notes")}
          placeholder="Key points of the lesson"
          className="min-h-48"
          error={errors.notes}
          hint="The AI tutor quotes your notes and PDF when it answers learners."
        />
        {formError && (
          <p role="alert" className="text-danger text-sm">
            {formError}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? "Adding and indexing" : "Add lesson"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function LessonRow({ lesson, index }: { lesson: Lesson; index: number }) {
  const [open, setOpen] = useState(false);
  const parts = [
    { on: !!lesson.videoUrl, icon: Video, label: "Video" },
    { on: !!lesson.pdfUrl, icon: FileText, label: "PDF" },
    { on: !!lesson.notes, icon: NotebookText, label: "Notes" },
  ];
  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="hover:bg-page flex w-full items-center gap-4 px-5 py-4 text-left"
      >
        <span className="text-faint w-6 text-sm font-semibold tabular-nums">{index + 1}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{lesson.title}</span>
          <span className="mt-1 flex flex-wrap gap-3 text-xs">
            {parts.map((p) => (
              <span
                key={p.label}
                className={`flex items-center gap-1 ${p.on ? "text-primary-deep" : "text-faint line-through"}`}
              >
                <p.icon className="size-3.5" aria-hidden />
                {p.label}
              </span>
            ))}
          </span>
        </span>
        <ChevronDown
          className={`text-faint size-5 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && (
        <div className="flex flex-col gap-4 px-5 pb-5 md:pl-15">
          {lesson.videoUrl && <LessonVideo url={lesson.videoUrl} title={lesson.title} />}
          {lesson.pdfUrl && (
            <a
              href={lesson.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className={buttonClass("secondary", "sm", "self-start")}
            >
              <FileText className="size-4" aria-hidden />
              Open PDF
            </a>
          )}
          {lesson.notes && (
            <p className="max-w-[70ch] text-sm leading-relaxed whitespace-pre-wrap">{lesson.notes}</p>
          )}
        </div>
      )}
    </li>
  );
}

function ManageCourse() {
  const { id } = useParams<{ id: string }>();
  const courses = useSWR<InstructorCourse[]>(paths.instructorCourses);
  const lessons = useSWR<Lesson[]>(paths.lessons(id), { revalidateOnMount: true });
  const [adding, setAdding] = useState(false);

  if (courses.isLoading || lessons.isLoading) return <Spinner />;
  const error = courses.error ?? lessons.error;
  if (error)
    return <ErrorState message={errorMessage(error)} onRetry={() => (courses.mutate(), lessons.mutate())} />;
  const course = courses.data?.find((c) => c.id === id);
  if (!course) return <ErrorState message="Course not found, or it belongs to another instructor." />;
  const list = lessons.data ?? [];

  return (
    <>
      <Link
        href="/teach/courses"
        className="text-muted hover:text-ink mb-4 inline-flex items-center gap-1.5 text-sm font-semibold"
      >
        <ArrowLeft className="size-4" aria-hidden />
        My courses
      </Link>

      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start">
        <CourseThumb course={course} className="rounded-panel aspect-video w-full shrink-0 md:w-72" />
        <div className="min-w-0">
          <div className="flex flex-wrap gap-1.5">
            <CourseMeta course={course} />
            <Badge tone="success">{formatPrice(course.price)}</Badge>
          </div>
          <h1 className="mt-2 text-3xl font-bold">{course.title}</h1>
          <p className="text-muted mt-2 max-w-2xl">{course.description}</p>
          <p className="mt-3 text-sm font-semibold">
            {plural(list.length, "lesson")}, {plural(course.enrollments.length, "learner")} enrolled
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Lessons</h2>
        {list.length > 0 && (
          <Button icon={Plus} size="sm" onClick={() => setAdding(true)}>
            Add lesson
          </Button>
        )}
      </div>
      <Panel>
        {list.length === 0 ? (
          <EmptyState
            icon={VideoOff}
            title="No lessons yet"
            description="Add a video, PDF or notes. Learners see lessons in the order you add them."
            action={
              <Button icon={Plus} onClick={() => setAdding(true)}>
                Add first lesson
              </Button>
            }
          />
        ) : (
          <ol className="divide-line divide-y">
            {list.map((l, i) => (
              <LessonRow key={l.id} lesson={l} index={i} />
            ))}
          </ol>
        )}
      </Panel>

      <AddLessonDialog
        courseId={course.id}
        open={adding}
        onClose={() => setAdding(false)}
        onCreated={() => Promise.all([lessons.mutate(), courses.mutate()])}
      />
    </>
  );
}

export default function ManageCoursePage() {
  return (
    <AppShell roles={["INSTRUCTOR"]}>
      <ManageCourse />
    </AppShell>
  );
}
