"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { getSupportRequestThread } from "@/lib/support/actions";
import type { SupportRequestThread, SupportSenderRole } from "@/lib/support/types";
import { SupportThreadView } from "./support-thread";

export function SupportThreadModal({
  requestId, viewerRole, onClose, onReplied, headerExtra,
}: {
  requestId: string;
  viewerRole: SupportSenderRole;
  onClose: () => void;
  onReplied?: () => void;
  headerExtra?: (thread: SupportRequestThread) => React.ReactNode;
}) {
  const [thread, setThread] = useState<SupportRequestThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getSupportRequestThread(requestId)
      .then((t) => { if (!cancelled) setThread(t); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [requestId, refreshKey]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-zinc-50">{thread?.subject ?? "Loading…"}</p>
            {thread && headerExtra && <div className="mt-1.5">{headerExtra(thread)}</div>}
          </div>
          <button onClick={onClose} className="shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden px-5 py-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
          ) : error ? (
            <p className="py-10 text-center text-sm text-red-500">{error}</p>
          ) : thread ? (
            <SupportThreadView
              thread={thread}
              viewerRole={viewerRole}
              onReplied={() => {
                setRefreshKey((k) => k + 1);
                onReplied?.();
              }}
            />
          ) : (
            <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">Request not found</p>
          )}
        </div>
      </div>
    </div>
  );
}
