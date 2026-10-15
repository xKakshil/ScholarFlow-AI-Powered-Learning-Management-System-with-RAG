import { Search } from "lucide-react";
import type { Role } from "@/lib/types";

export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative mb-5 block md:w-80">
      <span className="sr-only">{placeholder}</span>
      <Search
        className="text-faint pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-control border-line bg-surface placeholder:text-faint focus:border-primary focus:ring-primary/20 h-11 w-full border pr-3 pl-10 text-[15px] focus:ring-2 focus:outline-none"
      />
    </label>
  );
}

const ROLE_STYLE: Record<Role, { label: string; className: string }> = {
  ADMIN: { label: "Admin", className: "bg-danger-soft text-danger" },
  INSTRUCTOR: { label: "Instructor", className: "bg-primary-soft text-primary-deep" },
  LEARNER: { label: "Learner", className: "bg-success-soft text-success" },
};

export function RolePill({ role }: { role: Role }) {
  const style = ROLE_STYLE[role] ?? ROLE_STYLE.LEARNER;
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.className}`}>
      {style.label}
    </span>
  );
}

export function DataTable({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="rounded-panel border-line bg-surface overflow-x-auto border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-line bg-page/60 text-muted border-b">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-5 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-line divide-y">{children}</tbody>
      </table>
    </div>
  );
}
