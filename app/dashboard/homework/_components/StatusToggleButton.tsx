"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, RotateCcw } from "lucide-react";
import { setHomeworkStatus } from "../actions";
import type { HomeworkStatus } from "../_data/homework";

export function StatusToggleButton({ homeworkId, status }: { homeworkId: string; status: HomeworkStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const nextStatus: HomeworkStatus = status === "active" ? "closed" : "active";

  function handleClick() {
    startTransition(async () => {
      await setHomeworkStatus(homeworkId, nextStatus);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-60"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : status === "active" ? (
        <Lock className="h-3.5 w-3.5" />
      ) : (
        <RotateCcw className="h-3.5 w-3.5" />
      )}
      {status === "active" ? "Close Assignment" : "Reopen Assignment"}
    </button>
  );
}
