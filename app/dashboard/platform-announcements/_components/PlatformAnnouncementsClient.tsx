"use client";

import { useFormStatus } from "react-dom";
import { Megaphone, Send, Users, Loader2 } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { DatePicker } from "@/components/ui/date-picker";
import { broadcastAnnouncement } from "../actions";

export interface PlatformBroadcast {
  id: string;
  title: string;
  content: string;
  priority: string;
  expiresAt: string | null;
  createdAt: string;
  reach: number;
}

const PRIORITY_BADGE: Record<string, string> = {
  urgent: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  normal: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  info: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function BroadcastButton() {
  const { pending } = useFormStatus();
  return (
    <FancyButton
      type="submit"
      disabled={pending}
      size="sm"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
      {pending ? "Broadcasting…" : "Broadcast to all institutions"}
    </FancyButton>
  );
}

export default function PlatformAnnouncementsClient({ broadcasts }: { broadcasts: PlatformBroadcast[] }) {
  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Announcements</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Broadcast updates to every institution</p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-zinc-50">Broadcast an announcement</h2>
        <p className="mb-4 text-xs text-primary-500 dark:text-zinc-500">
          Sent to every active institution&apos;s Announcements board.
        </p>
        <form action={broadcastAnnouncement} className="space-y-3">
          <input
            name="title"
            required
            placeholder="Title"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
          <textarea
            name="content"
            required
            rows={3}
            placeholder="What do you want every institution to know?"
            className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none"
          />
          <div className="flex flex-wrap items-center gap-3">
            <select
              name="priority"
              defaultValue="normal"
              className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="info">Info</option>
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
            <DatePicker name="expiresAt" placeholder="Expires (optional)" className="w-auto" />
            <div className="flex-1" />
            <BroadcastButton />
          </div>
        </form>
      </div>

      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-zinc-50">Broadcast history</h2>
        {broadcasts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-14 text-center">
            <Megaphone className="h-8 w-8 text-primary-400 dark:text-zinc-600" />
            <p className="text-sm font-medium text-gray-700 dark:text-zinc-400">No broadcasts sent yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {broadcasts.map((b) => (
              <div key={b.id} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{b.title}</h3>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_BADGE[b.priority] ?? PRIORITY_BADGE.normal}`}>
                    {b.priority}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:text-zinc-300">
                    <Users className="h-2.5 w-2.5" /> {b.reach} institution{b.reach === 1 ? "" : "s"}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-gray-600 dark:text-zinc-400">{b.content}</p>
                <p className="mt-2 text-[11px] text-primary-500 dark:text-zinc-500">
                  Sent {formatDateTime(b.createdAt)}
                  {b.expiresAt && ` · Expires ${new Date(b.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
