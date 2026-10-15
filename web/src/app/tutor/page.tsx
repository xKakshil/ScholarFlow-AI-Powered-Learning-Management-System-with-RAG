"use client";

import { AppShell } from "@/components/shell";
import { TutorChat } from "@/components/tutor";

export default function TutorPage() {
  return (
    <AppShell roles={["LEARNER"]}>
      <div className="flex h-[calc(100dvh-14rem)] flex-col md:h-[calc(100dvh-6.5rem)]">
        <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
          <TutorChat />
        </div>
      </div>
    </AppShell>
  );
}
