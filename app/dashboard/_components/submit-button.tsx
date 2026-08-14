"use client";

import { useFormStatus } from "react-dom";
import type { LucideIcon } from "lucide-react";

const VARIANTS = {
  approve:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-700 dark:hover:text-emerald-300",
  reject:
    "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 hover:text-red-700 dark:hover:text-red-300",
};

export function SubmitButton({
  icon: Icon, label, pendingLabel, variant,
}: {
  icon: LucideIcon;
  label: string;
  pendingLabel?: string;
  variant: keyof typeof VARIANTS;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex w-full items-center justify-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]}`}
    >
      {pending ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
          {pendingLabel ?? label}
        </>
      ) : (
        <>
          <Icon className="h-4 w-4" />
          {label}
        </>
      )}
    </button>
  );
}
