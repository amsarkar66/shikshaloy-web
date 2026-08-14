"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";

export function StatusReasonDialog({
  actionLabel, onConfirm, onCancel, busy,
}: {
  actionLabel: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xl">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{actionLabel}</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">Add a reason — it&apos;s recorded on the application and shown in the timeline.</p>
        <textarea
          autoFocus
          className="mt-3 h-24 w-full resize-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex h-9 items-center rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <FancyButton onClick={() => onConfirm(reason)} disabled={busy} size="sm">
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirm
          </FancyButton>
        </div>
      </div>
    </div>
  );
}
