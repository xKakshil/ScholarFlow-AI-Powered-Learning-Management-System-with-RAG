"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Panel } from "./ui";

const fmt = (n: number) => n.toLocaleString("en-IN");

export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Panel className="p-5">
      <div className="text-muted flex items-center gap-2 text-sm font-semibold">
        <Icon className="text-primary size-4" aria-hidden />
        {label}
      </div>
      <p className="font-display mt-2 text-3xl font-bold tracking-tight">{value}</p>
      {hint && <p className="text-muted mt-1 text-sm">{hint}</p>}
    </Panel>
  );
}

export function ChartPanel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Panel className="p-5 md:p-6">
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <p className="text-muted mt-0.5 text-sm">{description}</p>}
      <div className="mt-5">{children}</div>
    </Panel>
  );
}

export type BarItem = { id: string; label: string; value: number; sub?: string };

export function BarList({
  items,
  format = fmt,
  max = 8,
  empty = "No data yet.",
}: {
  items: BarItem[];
  format?: (n: number) => string;
  max?: number;
  empty?: string;
}) {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const shown = sorted.slice(0, max);
  const rest = sorted.slice(max);
  if (rest.length) {
    shown.push({
      id: "other",
      label: `Other (${rest.length})`,
      value: rest.reduce((s, i) => s + i.value, 0),
    });
  }
  const top = Math.max(1, ...shown.map((i) => i.value));
  if (shown.every((i) => i.value === 0)) return <p className="text-muted text-sm">{empty}</p>;

  return (
    <ul className="flex flex-col gap-4">
      {shown.map((item) => (
        <li key={item.id}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{item.label}</span>
            <span className="font-semibold tabular-nums">{format(item.value)}</span>
          </div>
          <div className="bg-page h-2.5 overflow-hidden rounded-full" aria-hidden>
            <div
              className="bg-primary h-full rounded-full"
              style={{ width: `${item.value > 0 ? Math.max(2, (item.value / top) * 100) : 0}%` }}
            />
          </div>
          {item.sub && <p className="text-muted mt-1 text-xs">{item.sub}</p>}
        </li>
      ))}
    </ul>
  );
}

export type ColumnDatum = { key: string; label: string; longLabel: string; value: number };

export function ColumnChart({
  data,
  format = fmt,
  unit = "",
  height = 180,
}: {
  data: ColumnDatum[];
  format?: (n: number) => string;
  unit?: string;
  height?: number;
}) {
  const [active, setActive] = useState<number | null>(null);
  const top = Math.max(1, ...data.map((d) => d.value));
  const shown = data[active ?? data.length - 1];

  if (data.every((d) => d.value === 0)) {
    return <p className="text-muted text-sm">No activity in this period yet.</p>;
  }

  return (
    <div>
      <p className="mb-4 flex items-baseline gap-2" aria-live="polite">
        <span className="font-display text-2xl font-bold tabular-nums">{format(shown.value)}</span>
        <span className="text-muted text-sm">
          {unit && `${unit} in `}
          {shown.longLabel}
        </span>
      </p>
      <div
        className="border-line flex items-end gap-2 border-b"
        style={{ height }}
        onMouseLeave={() => setActive(null)}
      >
        {data.map((d, i) => {
          const h = d.value > 0 ? Math.max(4, (d.value / top) * height) : 0;
          const isActive = (active ?? data.length - 1) === i;
          return (
            <button
              key={d.key}
              type="button"
              aria-label={`${d.longLabel}: ${format(d.value)} ${unit}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
              className="flex h-full flex-1 items-end"
            >
              <span
                className={`block w-full rounded-t-[4px] transition-opacity ${isActive ? "bg-primary" : "bg-primary/45"}`}
                style={{ height: h }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        {data.map((d, i) => (
          <span
            key={d.key}
            className={`flex-1 text-center text-xs ${(active ?? data.length - 1) === i ? "text-ink font-semibold" : "text-faint"}`}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
