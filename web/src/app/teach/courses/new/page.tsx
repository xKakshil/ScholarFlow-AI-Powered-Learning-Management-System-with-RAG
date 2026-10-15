"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSWRConfig } from "swr";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/shell";
import { useToast } from "@/components/toast";
import { Button, Input, PageHeader, Panel, Textarea } from "@/components/ui";
import { api, errorMessage, paths } from "@/lib/api";

const LEVELS = ["Beginner", "Intermediate", "Advanced"];

function NewCourse() {
  const router = useRouter();
  const toast = useToast();
  const { mutate } = useSWRConfig();
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    level: "Beginner",
    thumbnail: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    const price = form.price.trim() === "" ? 0 : Number(form.price);
    if (form.title.trim().length < 3) next.title = "Give the course a title of at least 3 characters.";
    if (form.description.trim().length < 10)
      next.description = "Add a description of at least 10 characters.";
    if (!Number.isInteger(price) || price < 0)
      next.price = "Enter a whole number of rupees, or leave it empty for free.";
    if (form.thumbnail.trim() && !/^https?:\/\//i.test(form.thumbnail.trim()))
      next.thumbnail = "Use an http(s) image link.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    setFormError(null);
    try {
      const course = await api.createCourse({
        title: form.title.trim(),
        description: form.description.trim(),
        price,
        category: form.category.trim(),
        level: form.level,
        thumbnail: form.thumbnail.trim() || undefined,
      });
      await Promise.all([
        mutate(paths.instructorCourses),
        mutate(paths.instructorAnalytics),
        mutate(paths.courses),
      ]);
      toast("Course created. Add your first lesson.");
      router.push(`/teach/courses/${course.id}`);
    } catch (err) {
      setFormError(errorMessage(err, "Couldn't create the course."));
      setSaving(false);
    }
  }

  return (
    <>
      <Link
        href="/teach/courses"
        className="text-muted hover:text-ink mb-4 inline-flex items-center gap-1.5 text-sm font-semibold"
      >
        <ArrowLeft className="size-4" aria-hidden />
        My courses
      </Link>
      <PageHeader title="New course" description="You can add lessons right after creating the course." />
      <Panel className="max-w-2xl p-6">
        <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
          <Input
            label="Title"
            value={form.title}
            onChange={set("title")}
            placeholder="Data Structures in Python"
            error={errors.title}
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={set("description")}
            placeholder="What will learners be able to do after this course?"
            error={errors.description}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Price (₹)"
              inputMode="numeric"
              value={form.price}
              onChange={set("price")}
              placeholder="0"
              hint="Leave empty for a free course"
              error={errors.price}
            />
            <Input
              label="Category"
              value={form.category}
              onChange={set("category")}
              placeholder="Programming"
            />
          </div>
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold">Level</legend>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((level) => (
                <label
                  key={level}
                  className={`rounded-control cursor-pointer border-2 px-4 py-2 text-sm font-semibold transition-colors ${
                    form.level === level
                      ? "border-primary bg-primary-soft text-primary-deep"
                      : "border-line hover:border-faint"
                  }`}
                >
                  <input
                    type="radio"
                    name="level"
                    value={level}
                    checked={form.level === level}
                    onChange={() => setForm((f) => ({ ...f, level }))}
                    className="sr-only"
                  />
                  {level}
                </label>
              ))}
            </div>
          </fieldset>
          <Input
            label="Thumbnail image link"
            type="url"
            value={form.thumbnail}
            onChange={set("thumbnail")}
            placeholder="https://"
            hint="Optional"
            error={errors.thumbnail}
          />
          {formError && (
            <p role="alert" className="text-danger text-sm">
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Link
              href="/teach/courses"
              className="text-muted hover:text-ink inline-flex h-11 items-center px-4 font-semibold"
            >
              Cancel
            </Link>
            <Button type="submit" loading={saving}>
              Create course
            </Button>
          </div>
        </form>
      </Panel>
    </>
  );
}

export default function NewCoursePage() {
  return (
    <AppShell roles={["INSTRUCTOR"]}>
      <NewCourse />
    </AppShell>
  );
}
