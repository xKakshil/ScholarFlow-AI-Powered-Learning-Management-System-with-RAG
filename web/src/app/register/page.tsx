"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { BookOpen, Presentation } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";
import { Button, Input } from "@/components/ui";
import { errorMessage } from "@/lib/api";
import { homeFor, useAuth } from "@/lib/auth";

type SignupRole = "LEARNER" | "INSTRUCTOR";

const ROLES: { value: SignupRole; label: string; icon: typeof BookOpen; text: string }[] = [
  { value: "LEARNER", label: "Learn", icon: BookOpen, text: "Take courses and use the AI tutor" },
  { value: "INSTRUCTOR", label: "Teach", icon: Presentation, text: "Publish courses and track learners" },
];

function RegisterForm() {
  const { signUp, user, ready } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const nextParam = params.get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : null;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<SignupRole>(
    params.get("role") === "instructor" ? "INSTRUCTOR" : "LEARNER",
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && user && !submitting) router.replace(homeFor(user.role));
  }, [ready, user, submitting, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return setError("Enter your name (at least 2 characters).");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Enter a valid email address.");
    if (password.length < 6) return setError("Use a password with at least 6 characters.");
    setError(null);
    setSubmitting(true);
    try {
      const created = await signUp({ name, email, password, role });
      router.replace(created.role === "LEARNER" && next ? next : homeFor(created.role));
    } catch (err) {
      setError(errorMessage(err, "Couldn't create your account. Please try again."));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold">I want to</legend>
        <div className="grid grid-cols-2 gap-3">
          {ROLES.map((r) => {
            const active = role === r.value;
            return (
              <label
                key={r.value}
                className={`rounded-control flex cursor-pointer flex-col gap-1 border-2 p-3.5 transition-colors ${
                  active ? "border-primary bg-primary-soft" : "border-line bg-surface hover:border-faint"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={active}
                  onChange={() => setRole(r.value)}
                  className="sr-only"
                />
                <span
                  className={`flex items-center gap-2 font-semibold ${active ? "text-primary-deep" : ""}`}
                >
                  <r.icon className="size-4" aria-hidden />
                  {r.label}
                </span>
                <span className="text-muted text-xs">{r.text}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <Input label="Full name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
      />
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint="At least 6 characters"
      />
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
      <Button type="submit" loading={submitting} className="mt-2">
        Create account
      </Button>
      <p className="text-muted text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create your account"
      description="Join as a learner or start teaching your own courses."
    >
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}
