"use client";

import { Check, X, Landmark } from "lucide-react";
import { approveInstitution, rejectInstitution } from "../../actions";
import { PLANS } from "../../billing/_data/billing";
import { SubmitButton } from "../../_components/submit-button";
import type { PendingInstitution } from "@/lib/supabase/admin";

export function StatusBadge({ status }: { status: PendingInstitution["status"] }) {
  const map = {
    pending:  "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
    active:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    rejected: "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${map[status]}`}>
      {status}
    </span>
  );
}

export function TypeBadge({ type }: { type?: string | null }) {
  if (!type) return null;
  return (
    <span className="inline-flex items-center rounded-full border border-primary-500/20 bg-primary-500/10 px-2 py-0.5 text-xs font-medium text-primary-600 dark:text-primary-400">
      {type}
    </span>
  );
}

export function BoardBadge({ board }: { board?: string | null }) {
  if (!board) return null;
  return (
    <span className="inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
      {board}
    </span>
  );
}

export function SchoolCountBadge({ count }: { count: number }) {
  if (count < 2) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary-500/20 bg-primary-500/10 px-2 py-0.5 text-xs font-medium text-primary-600 dark:text-primary-400">
      <Landmark className="h-3 w-3" />
      {count} schools
    </span>
  );
}

// Approve/reinstate + reject/suspend forms, shared across every place an
// institution's status can be acted on (list card, grid card, detail page).
// `compact` drops the plan picker and lays the two forms out side by side
// instead of stacked, to fit a narrower grid card.
export function InstitutionActions({ inst, compact }: { inst: PendingInstitution; compact?: boolean }) {
  return (
    <div className={compact ? "flex gap-2" : "flex shrink-0 flex-col gap-2 sm:w-48"}>
      {inst.status !== "active" && (
        <form action={approveInstitution} className={compact ? "flex-1" : "space-y-2"}>
          <input type="hidden" name="institutionId" value={inst.id} />
          {!compact && inst.status === "pending" && (
            <select
              name="planId"
              defaultValue=""
              className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="">Keep current plan</option>
              {PLANS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          <SubmitButton
            icon={Check}
            label={inst.status === "rejected" ? "Reinstate" : "Approve"}
            pendingLabel={inst.status === "rejected" ? "Reinstating…" : "Approving…"}
            variant="approve"
          />
        </form>
      )}
      {inst.status !== "rejected" && (
        <form action={rejectInstitution} className={compact ? "flex-1" : undefined}>
          <input type="hidden" name="institutionId" value={inst.id} />
          <SubmitButton
            icon={X}
            label={inst.status === "active" ? "Suspend" : "Reject"}
            pendingLabel={inst.status === "active" ? "Suspending…" : "Rejecting…"}
            variant="reject"
          />
        </form>
      )}
    </div>
  );
}
