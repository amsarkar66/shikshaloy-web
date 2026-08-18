"use client";

import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";

export function PlanLimitModal({
  open, onClose, resource, limit,
}: {
  open: boolean;
  onClose: () => void;
  resource: string;
  limit: number | null;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-6 text-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-500">
          <Sparkles className="h-5 w-5" />
        </div>
        <h2 className="mt-4 text-base font-bold text-gray-900 dark:text-zinc-50">You&rsquo;ve reached your plan limit</h2>
        <p className="mt-1.5 text-sm text-gray-500 dark:text-zinc-400">
          Your current plan supports up to {limit ?? "a limited number of"} {resource}. Upgrade for a higher limit, or contact sales for unlimited {resource}.
        </p>

        <div className="mt-5 flex flex-col gap-2">
          <FancyButton href="/dashboard/billing" size="sm" className="w-full justify-center">
            Upgrade plan
          </FancyButton>
          <Link
            href="/dashboard/help"
            className="flex h-9 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          >
            Contact sales for unlimited
          </Link>
          <button onClick={onClose} className="mt-1 text-xs text-gray-400 dark:text-zinc-500 hover:underline">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
