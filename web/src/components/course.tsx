import Image from "next/image";
import Link from "next/link";
import { PlayCircle, Users } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Course } from "@/lib/types";
import { Badge } from "./ui";

const FALLBACK_TINTS = ["#4f46e5", "#3730a3", "#5b51f0", "#433ad1"];

export function CourseThumb({ course, className = "" }: { course: Course; className?: string }) {
  if (course.thumbnail) {
    return (
      <div className={`bg-primary-soft relative overflow-hidden ${className}`}>
        <Image
          src={course.thumbnail}
          alt=""
          fill
          unoptimized
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 400px"
        />
      </div>
    );
  }
  const tint = FALLBACK_TINTS[course.title.length % FALLBACK_TINTS.length];
  return (
    <div
      className={`relative grid place-items-center overflow-hidden ${className}`}
      style={{ background: tint }}
      aria-hidden
    >
      <span className="font-display text-6xl font-bold text-white/90">
        {course.title.trim().charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

export function CourseMeta({ course }: { course: Course }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {course.category && <Badge tone="primary">{course.category}</Badge>}
      {course.level && <Badge>{course.level}</Badge>}
    </div>
  );
}

export function CourseCard({ course, href, enrolled }: { course: Course; href: string; enrolled?: boolean }) {
  const lessons = course.lessons?.length ?? 0;
  return (
    <Link
      href={href}
      className="group rounded-panel border-line bg-surface hover:border-primary/40 flex flex-col overflow-hidden border transition-colors"
    >
      <CourseThumb course={course} className="aspect-[16/9]" />
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          <CourseMeta course={course} />
          {enrolled && <Badge tone="success">Enrolled</Badge>}
        </div>
        <h3 className="group-hover:text-primary-deep text-lg leading-snug font-bold">{course.title}</h3>
        <p className="text-muted line-clamp-2 text-sm">{course.description}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-muted flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1">
              <PlayCircle className="size-4" aria-hidden />
              {lessons} {lessons === 1 ? "lesson" : "lessons"}
            </span>
            {course._count && (
              <span className="flex items-center gap-1">
                <Users className="size-4" aria-hidden />
                {course._count.enrollments}
              </span>
            )}
          </span>
          <span className="font-display text-lg font-bold">{formatPrice(course.price)}</span>
        </div>
      </div>
    </Link>
  );
}
