"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { submitHomework } from "../actions";

export interface StudentHomeworkItem {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  dueDate: string;
  description: string;
  submitted: boolean;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function StudentHomeworkList({ items, studentId }: { items: StudentHomeworkItem[]; studentId: string }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(homeworkId: string) {
    setPendingId(homeworkId);
    startTransition(async () => {
      await submitHomework(homeworkId, studentId);
      router.refresh();
      setPendingId(null);
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-16 text-center">
        <p className="text-sm text-gray-400 dark:text-zinc-500">No homework assigned yet</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden divide-y divide-gray-100 dark:divide-zinc-700/50">
      {items.map((h) => (
        <div key={h.id} className="flex items-start gap-3 px-5 py-3.5">
          <button
            onClick={() => !h.submitted && handleSubmit(h.id)}
            disabled={h.submitted || (isPending && pendingId === h.id)}
            className="mt-0.5 shrink-0"
            title={h.submitted ? "Submitted" : "Mark as submitted"}
          >
            {isPending && pendingId === h.id ? (
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
            ) : h.submitted ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            ) : (
              <Circle className="h-5 w-5 text-gray-300 dark:text-zinc-600 hover:text-indigo-400 transition-colors" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className={`text-sm font-medium ${h.submitted ? "text-gray-400 dark:text-zinc-500 line-through" : "text-gray-900 dark:text-zinc-100"}`}>{h.title}</p>
              <span className="shrink-0 text-xs text-gray-400 dark:text-zinc-500">Due {formatDate(h.dueDate)}</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{h.subject} · {h.teacher}</p>
            {h.description && <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">{h.description}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
