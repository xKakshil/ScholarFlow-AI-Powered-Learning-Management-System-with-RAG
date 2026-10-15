"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  BarChart3,
  Compass,
  Gauge,
  Layers,
  LayoutGrid,
  Library,
  LogOut,
  Receipt,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { homeFor, useAuth } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { Avatar, ButtonLink, Spinner } from "./ui";

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean };

const NAV: Record<Role, NavItem[]> = {
  LEARNER: [
    { href: "/courses", label: "Explore", icon: Compass },
    { href: "/my-learning", label: "My learning", icon: Library },
    { href: "/tutor", label: "AI tutor", icon: Sparkles },
  ],
  INSTRUCTOR: [
    { href: "/teach", label: "Dashboard", icon: LayoutGrid, exact: true },
    { href: "/teach/courses", label: "My courses", icon: Layers },
    { href: "/teach/students", label: "Students", icon: Users },
    { href: "/teach/analytics", label: "Analytics", icon: BarChart3 },
  ],
  ADMIN: [
    { href: "/admin", label: "Overview", icon: Gauge, exact: true },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/courses", label: "Courses", icon: Layers },
    { href: "/admin/enrollments", label: "Enrollments", icon: Receipt },
  ],
};

const ROLE_LABEL: Record<Role, string> = { LEARNER: "Learner", INSTRUCTOR: "Instructor", ADMIN: "Admin" };

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="font-display flex items-center gap-2.5 text-lg font-bold tracking-tight">
      <Image src="/logo.png" alt="" width={32} height={32} className="rounded-lg" priority />
      ScholarFlow
    </Link>
  );
}

function PublicHeader() {
  return (
    <header className="border-line bg-page/90 sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 md:px-6">
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
      </div>
    </header>
  );
}

function Sidebar({ items, pathname }: { items: NavItem[]; pathname: string }) {
  const { user, signOut } = useAuth();
  if (!user) return null;
  return (
    <aside className="border-line bg-surface sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r px-3 py-5 md:flex">
      <div className="px-3">
        <Logo href={homeFor(user.role)} />
      </div>
      <nav className="mt-8 flex flex-col gap-0.5" aria-label="Main">
        {items.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-control flex items-center gap-3 px-3 py-2.5 text-[15px] font-semibold transition-colors ${
                active ? "bg-primary-soft text-primary-deep" : "text-muted hover:bg-page hover:text-ink"
              }`}
            >
              <item.icon className="size-[18px]" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-line mt-auto border-t pt-4">
        <Link
          href="/profile"
          className={`rounded-control flex items-center gap-3 px-3 py-2 ${
            pathname === "/profile" ? "bg-primary-soft" : "hover:bg-page"
          }`}
        >
          <Avatar label={user.email} />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{user.email}</span>
            <span className="text-muted block text-xs">{ROLE_LABEL[user.role]}</span>
          </span>
        </Link>
        <button
          onClick={signOut}
          className="rounded-control text-muted hover:bg-page hover:text-danger mt-1 flex w-full items-center gap-3 px-3 py-2.5 text-sm font-semibold"
        >
          <LogOut className="size-[18px]" aria-hidden />
          Log out
        </button>
      </div>
    </aside>
  );
}

function MobileBars({ items, pathname }: { items: NavItem[]; pathname: string }) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <>
      <header className="border-line bg-surface/95 sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 backdrop-blur md:hidden">
        <Logo href={homeFor(user.role)} />
        <Link href="/profile" aria-label="Profile">
          <Avatar label={user.email} />
        </Link>
      </header>
      <nav
        aria-label="Main"
        className="border-line bg-surface fixed inset-x-0 bottom-0 z-30 flex border-t pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {items.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-semibold ${
                active ? "text-primary" : "text-faint"
              }`}
            >
              <item.icon className="size-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function AppShell({
  children,
  roles,
  allowPublic = false,
}: {
  children: React.ReactNode;
  roles?: Role[];
  allowPublic?: boolean;
}) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const signedOutBlocked = ready && !user && !allowPublic;
  const wrongRole = ready && !!user && !!roles && !roles.includes(user.role);

  useEffect(() => {
    if (signedOutBlocked) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (wrongRole && user) router.replace(homeFor(user.role));
  }, [signedOutBlocked, wrongRole, user, pathname, router]);

  if (!ready || signedOutBlocked || wrongRole) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-dvh">
        <PublicHeader />
        <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">{children}</main>
      </div>
    );
  }

  const items = NAV[user.role];
  return (
    <div className="flex min-h-dvh">
      <Sidebar items={items} pathname={pathname} />
      <div className="min-w-0 flex-1">
        <MobileBars items={items} pathname={pathname} />
        <main className="mx-auto max-w-6xl px-4 pt-6 pb-28 md:px-8 md:pt-10 md:pb-16">{children}</main>
      </div>
    </div>
  );
}
