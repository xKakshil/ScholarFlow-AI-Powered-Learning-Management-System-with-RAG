"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, BookOpen, ChevronDown, Info, Loader2, Sparkles, X } from "lucide-react";
import { api, ApiError, errorMessage } from "@/lib/api";
import type { AiSource, TutorResponse } from "@/lib/types";

type Message =
  | { id: string; role: "user"; text: string; scope?: string }
  | { id: string; role: "assistant"; result: TutorResponse; scoped: boolean }
  | { id: string; role: "error"; text: string; retryOf: string };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function withCitations(text: string) {
  return text.split(/(\[\d+\])/g).map((part, i) =>
    /^\[\d+\]$/.test(part) ? (
      <sup key={i} className="text-primary-deep ml-0.5 font-semibold">
        {part}
      </sup>
    ) : (
      part
    ),
  );
}

export function TutorAnswer({ result, scoped = false }: { result: TutorResponse; scoped?: boolean }) {
  const [showSources, setShowSources] = useState(false);
  const sources = result.sources ?? [];
  const cited = sources.filter((s) => s.cited);
  const chips = (cited.length ? cited : sources).slice(0, 3);

  if (result.explanation === undefined) {
    return <p className="leading-relaxed whitespace-pre-wrap">{result.answer}</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-control border-highlight-edge border-l-4 bg-[#fffbea] px-4 py-3.5">
        <h3 className="text-warning mb-2 flex items-center gap-2 font-sans text-sm font-bold">
          <BookOpen className="size-4" aria-hidden />
          Your notes say
        </h3>
        {result.fromNotes ? (
          <p className="leading-relaxed">
            <span className="highlighted">{withCitations(result.fromNotes)}</span>
          </p>
        ) : (
          <p className="text-muted text-sm italic">
            {result.retrieval === "none"
              ? scoped
                ? "Enroll in this course to get answers from its notes."
                : "You're not enrolled in any course yet, so there are no notes to search."
              : "Your course notes don't cover this directly."}
          </p>
        )}
        {chips.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {chips.map((s) => (
              <span
                key={s.id}
                className="bg-surface text-ink ring-highlight-edge/60 rounded-full px-2.5 py-1 text-xs font-semibold ring-1"
              >
                [{s.n}] {s.lessonTitle}
                {s.source === "pdf" ? " (PDF)" : ""}
              </span>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-primary-deep mb-1.5 flex items-center gap-2 font-sans text-sm font-bold">
          <Sparkles className="size-4" aria-hidden />
          AI explanation
        </h3>
        <p className="leading-relaxed whitespace-pre-wrap">{result.explanation}</p>
        {result.usedOutsideKnowledge && (
          <p className="rounded-control bg-warning-soft text-warning mt-3 flex items-center gap-2 px-3 py-2 text-sm">
            <Info className="size-4 shrink-0" aria-hidden />
            Includes knowledge beyond your course notes.
          </p>
        )}
      </section>

      {sources.length > 0 && (
        <div className="border-line border-t pt-3">
          <button
            type="button"
            onClick={() => setShowSources((v) => !v)}
            aria-expanded={showSources}
            className="text-muted hover:text-ink flex items-center gap-1.5 text-sm font-semibold"
          >
            {showSources ? "Hide" : "Show"} {sources.length} matched{" "}
            {sources.length === 1 ? "excerpt" : "excerpts"}
            <ChevronDown
              className={`size-4 transition-transform ${showSources ? "rotate-180" : ""}`}
              aria-hidden
            />
          </button>
          {showSources && (
            <ol className="mt-3 flex flex-col gap-3">
              {sources.map((s) => (
                <SourceItem key={s.id} source={s} />
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

function SourceItem({ source }: { source: AiSource }) {
  return (
    <li className="border-line border-l-2 pl-3">
      <p className="text-xs font-semibold">
        [{source.n}] {source.courseTitle}, {source.lessonTitle}
        {source.source === "pdf" ? " (PDF)" : ""}
        {typeof source.score === "number" && (
          <span className="text-muted font-normal"> ({Math.round(source.score * 100)}% match)</span>
        )}
      </p>
      <p className="text-muted mt-1 line-clamp-5 text-sm">{source.content}</p>
    </li>
  );
}

const DEFAULT_SUGGESTIONS = [
  "Explain the key idea of my latest lesson",
  "Give me 3 practice questions on this topic",
  "Summarise my course notes in simple words",
];

export function TutorChat({
  courseId,
  courseTitle,
  lessonTitle,
  enrolled = true,
  onClearScope,
  compact = false,
}: {
  courseId?: string;
  courseTitle?: string;
  lessonTitle?: string;
  enrolled?: boolean;
  onClearScope?: () => void;
  compact?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, pending]);

  const suggestions = lessonTitle
    ? [
        `Explain "${lessonTitle}" in simple words`,
        `Give me 3 practice questions on "${lessonTitle}"`,
        "What are the key points of this lesson?",
      ]
    : courseTitle
      ? [
          `What will I learn in ${courseTitle}?`,
          "Summarise the main ideas of this course",
          "Give me 3 practice questions",
        ]
      : DEFAULT_SUGGESTIONS;

  async function send(question: string) {
    const q = question.trim();
    if (!q || pending) return;
    const id = String(Date.now());
    setMessages((m) => [
      ...m.filter((x) => !(x.role === "error" && x.retryOf === q)),
      { id, role: "user", text: q, scope: courseId ? courseTitle : undefined },
    ]);
    setInput("");
    setPending(true);
    setStatus("Searching your course notes…");
    const slowTimer = setTimeout(() => setStatus("Still working on your answer…"), 6000);

    try {
      let result: TutorResponse | null = null;
      for (let attempt = 0; attempt < 3 && !result; attempt++) {
        try {
          result = await api.askTutor(q, courseId);
        } catch (e) {
          if (!(e instanceof ApiError && e.status === 429) || attempt === 2) throw e;
          setStatus(`The tutor is busy. Retrying in ${10 * (attempt + 1)}s…`);
          await sleep(10_000 * (attempt + 1));
        }
      }
      setMessages((m) => [...m, { id: `${id}a`, role: "assistant", result: result!, scoped: !!courseId }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: `${id}e`,
          role: "error",
          text: errorMessage(e, "The AI tutor is unavailable right now."),
          retryOf: q,
        },
      ]);
    } finally {
      clearTimeout(slowTimer);
      setPending(false);
      setStatus(null);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={`min-h-0 flex-1 overflow-y-auto ${compact ? "px-4 py-4" : "py-2"}`}>
        {messages.length === 0 ? (
          <div className="mx-auto flex max-w-lg flex-col gap-3 py-6">
            <h2 className="text-2xl font-bold">
              {lessonTitle ? "Stuck on this lesson?" : "Ask about your courses"}
            </h2>
            <p className="text-muted">
              {enrolled
                ? "Answers start with what your instructor's notes and PDFs say, then explain it in plain words."
                : "Enroll in this course to get answers from its notes. Until then, answers use general knowledge."}
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-control border-line bg-surface hover:border-primary/50 border px-4 py-3 text-left text-[15px]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((m) =>
              m.role === "user" ? (
                <div
                  key={m.id}
                  className="rounded-panel bg-primary ml-auto max-w-[85%] rounded-br-md px-4 py-3 text-white"
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.scope && <p className="mt-1 text-xs text-white/75">in {m.scope}</p>}
                </div>
              ) : m.role === "error" ? (
                <div key={m.id} className="rounded-panel bg-danger-soft max-w-[90%] px-4 py-3">
                  <p className="text-danger">{m.text}</p>
                  <button
                    type="button"
                    onClick={() => send(m.retryOf)}
                    className="text-primary mt-2 text-sm font-semibold hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <div
                  key={m.id}
                  className="rounded-panel border-line bg-surface max-w-[95%] rounded-bl-md border p-4 md:p-5"
                >
                  <TutorAnswer result={m.result} scoped={m.scoped} />
                </div>
              ),
            )}
            {pending && (
              <p className="text-muted flex items-center gap-2 text-sm" role="status">
                <Loader2 className="text-primary size-4 animate-spin" aria-hidden />
                {status}
              </p>
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className={compact ? "border-line border-t px-4 py-3" : "pt-3"}>
        {courseId && (
          <div className="rounded-control bg-primary-soft text-primary-deep mb-2 flex items-center gap-2 px-3 py-2 text-sm font-semibold">
            <span className="min-w-0 flex-1 truncate">Searching only: {courseTitle ?? "this course"}</span>
            {onClearScope && (
              <button
                type="button"
                onClick={onClearScope}
                aria-label="Search all my courses"
                className="hover:text-ink"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-end gap-2"
        >
          <label htmlFor="tutor-question" className="sr-only">
            Your question
          </label>
          <textarea
            id="tutor-question"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            maxLength={1000}
            placeholder="Ask a question about your course…"
            className="rounded-control border-line bg-surface placeholder:text-faint focus:border-primary focus:ring-primary/20 max-h-36 min-h-12 flex-1 resize-none border px-4 py-3 text-[15px] focus:ring-2 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || pending}
            aria-label="Send question"
            className="rounded-control bg-primary hover:bg-primary-deep grid size-12 shrink-0 place-items-center text-white disabled:opacity-40"
          >
            <ArrowUp className="size-5" aria-hidden />
          </button>
        </form>
      </div>
    </div>
  );
}

export function AskAiPanel({
  courseId,
  courseTitle,
  lessonTitle,
  enrolled,
}: {
  courseId?: string;
  courseTitle?: string;
  lessonTitle?: string;
  enrolled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [scoped, setScoped] = useState(true);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-primary hover:bg-primary-deep fixed right-4 bottom-20 z-40 flex h-12 items-center gap-2 rounded-full px-5 font-semibold text-white shadow-[0_8px_24px_rgba(55,48,163,0.35)] md:right-8 md:bottom-8"
        >
          <Sparkles className="size-[18px]" aria-hidden />
          Ask AI
        </button>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            aria-label="Close AI tutor"
            className="bg-ink/30 absolute inset-0"
            onClick={() => setOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="AI tutor"
            className="bg-page relative flex h-full w-full max-w-md flex-col shadow-2xl"
          >
            <div className="border-line bg-surface flex items-center justify-between border-b px-4 py-3">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Sparkles className="text-primary size-5" aria-hidden />
                AI tutor
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close AI tutor"
                className="rounded-control hover:bg-page grid size-9 place-items-center"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <TutorChat
                compact
                courseId={scoped ? courseId : undefined}
                courseTitle={courseTitle}
                lessonTitle={scoped ? lessonTitle : undefined}
                enrolled={enrolled}
                onClearScope={() => setScoped(false)}
              />
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
