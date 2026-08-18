"use client";

import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { replySupportRequest } from "@/lib/support/actions";
import type { SupportRequestThread, SupportSenderRole } from "@/lib/support/types";
import { formatSupportDateTime } from "@/lib/support/format";

export function SupportThreadView({
  thread, viewerRole, onReplied,
}: {
  thread: SupportRequestThread;
  viewerRole: SupportSenderRole;
  onReplied?: () => void;
}) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleReply() {
    const body = message.trim();
    if (!body) return;
    setError(null);
    startTransition(async () => {
      try {
        await replySupportRequest({ requestId: thread.id, message: body });
        setMessage("");
        onReplied?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send reply");
      }
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-1">
        {thread.messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">No messages yet</p>
        ) : (
          thread.messages.map((m) => {
            const mine = m.senderRole === viewerRole;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm ${
                    mine
                      ? "bg-primary-500 text-white"
                      : "bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-zinc-200"
                  }`}
                >
                  <div className={`mb-1 flex items-center gap-2 text-[11px] font-medium ${mine ? "text-white/80" : "text-gray-500 dark:text-zinc-400"}`}>
                    <span>{m.senderRole === "kernel" ? "Shikshaloy Support" : m.senderName}</span>
                    <span>·</span>
                    <span>{formatSupportDateTime(m.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-3 space-y-2 border-t border-gray-100 dark:border-zinc-800 pt-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Write a reply…"
          className="w-full resize-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex justify-end">
          <FancyButton size="sm" onClick={handleReply} disabled={!message.trim() || isPending}>
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Reply
          </FancyButton>
        </div>
      </div>
    </div>
  );
}
