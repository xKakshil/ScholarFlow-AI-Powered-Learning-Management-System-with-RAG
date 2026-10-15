import Link from "next/link";
import { forwardRef, useId } from "react";
import { CloudOff, Loader2, type LucideIcon } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors disabled:pointer-events-none disabled:opacity-55";
const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-deep",
  secondary: "border border-line bg-surface text-ink hover:border-faint",
  ghost: "text-primary hover:bg-primary-soft",
  danger: "bg-danger-soft text-danger hover:bg-red-100",
};
const sizes: Record<Size, string> = { sm: "h-9 px-3 text-sm", md: "h-11 px-5 text-[15px]" };

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: LucideIcon;
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon: Icon,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        Icon && <Icon className="size-4" aria-hidden />
      )}
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  icon: Icon,
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {Icon && <Icon className="size-4" aria-hidden />}
      {children}
    </Link>
  );
}

const fieldClass =
  "w-full rounded-control border border-line bg-surface px-3.5 text-[15px] text-ink placeholder:text-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

type FieldProps = { label: string; error?: string | null; hint?: string };

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & FieldProps>(
  function Input({ label, error, hint, className = "", ...rest }, ref) {
    const id = useId();
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          className={`${fieldClass} h-11 ${error ? "border-danger" : ""} ${className}`}
          {...rest}
        />
        {error ? (
          <p className="text-danger text-sm">{error}</p>
        ) : hint ? (
          <p className="text-muted text-sm">{hint}</p>
        ) : null}
      </div>
    );
  },
);

export function Textarea({
  label,
  error,
  hint,
  className = "",
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <textarea
        id={id}
        aria-invalid={!!error}
        className={`${fieldClass} min-h-28 py-3 leading-relaxed ${error ? "border-danger" : ""} ${className}`}
        {...rest}
      />
      {error ? (
        <p className="text-danger text-sm">{error}</p>
      ) : hint ? (
        <p className="text-muted text-sm">{hint}</p>
      ) : null}
    </div>
  );
}

type BadgeTone = "neutral" | "primary" | "success" | "danger";
const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-page text-muted",
  primary: "bg-primary-soft text-primary-deep",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
};

export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: BadgeTone }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeTones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-panel border-line bg-surface border ${className}`}>{children}</div>;
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold md:text-[2.5rem] md:leading-tight">{title}</h1>
        {description && <p className="text-muted mt-1.5 max-w-2xl">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="text-muted flex items-center justify-center py-20">
      <Loader2 className="text-primary size-6 animate-spin" aria-hidden />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="bg-primary-soft mb-4 grid size-14 place-items-center rounded-full">
        <Icon className="text-primary size-6" aria-hidden />
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <p className="text-muted mt-1 max-w-sm text-sm">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <CloudOff className="text-faint mb-3 size-8" aria-hidden />
      <p className="text-muted max-w-sm">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function Avatar({ label, size = "md" }: { label: string; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden
      className={`bg-primary-soft font-display text-primary-deep grid shrink-0 place-items-center rounded-full font-bold ${
        size === "lg" ? "size-16 text-2xl" : "size-9 text-sm"
      }`}
    >
      {(label.trim().charAt(0) || "?").toUpperCase()}
    </span>
  );
}
