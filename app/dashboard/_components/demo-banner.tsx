"use client";

import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import { DEMO_ACCOUNTS } from "@/lib/demo/config";
import { signOutToDemo } from "../actions";

export function DemoBanner({ role }: { role: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [exiting, setExiting] = useState(false);

  if (dismissed) return null;

  const roleLabel = (DEMO_ACCOUNTS.find((a) => a.role === role)?.label ?? role).toLowerCase();

  return (
    <div className="flex h-9 shrink-0 items-center justify-center gap-3 border-b border-primary-100 dark:border-zinc-800 bg-primary-50 dark:bg-zinc-900 px-4 text-xs sm:text-sm">
      <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary-500" />
      <p className="min-w-0 truncate text-primary-800 dark:text-zinc-300">
        You&apos;re viewing the full platform {roleLabel} demo. We&apos;d love to hear your feedback.
      </p>
      <div className="flex shrink-0 items-center gap-3">
        <button
          onClick={() => {
            setExiting(true);
            void signOutToDemo();
          }}
          disabled={exiting}
          className="font-medium text-primary-700 dark:text-primary-400 hover:underline disabled:opacity-60"
        >
          {exiting ? "Exiting…" : "Exit demo"}
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="text-primary-400 hover:text-primary-700 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
