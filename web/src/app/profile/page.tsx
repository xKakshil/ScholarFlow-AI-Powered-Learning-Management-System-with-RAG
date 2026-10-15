"use client";

import { LogOut } from "lucide-react";
import { AppShell } from "@/components/shell";
import { Avatar, Badge, Button, PageHeader, Panel } from "@/components/ui";
import { useAuth } from "@/lib/auth";

const ROLE_LABEL = { LEARNER: "Learner", INSTRUCTOR: "Instructor", ADMIN: "Admin" } as const;

function Profile() {
  const { user, signOut } = useAuth();
  if (!user) return null;
  return (
    <>
      <PageHeader title="Profile" />
      <Panel className="flex max-w-xl flex-col gap-6 p-6 sm:flex-row sm:items-center">
        <Avatar label={user.email} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold">{user.email}</p>
          <div className="mt-1.5">
            <Badge tone="primary">{ROLE_LABEL[user.role]}</Badge>
          </div>
        </div>
        <Button variant="danger" icon={LogOut} onClick={signOut}>
          Log out
        </Button>
      </Panel>
    </>
  );
}

export default function ProfilePage() {
  return (
    <AppShell>
      <Profile />
    </AppShell>
  );
}
