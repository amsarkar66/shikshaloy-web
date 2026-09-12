"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, MoreHorizontal, Lock, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { AssignmentModal } from "./AssignmentModal";
import { DeleteHomeworkModal } from "./DeleteHomeworkModal";
import { setHomeworkStatus } from "../actions";
import type { Homework, HomeworkStatus } from "../_data/homework";

interface Subject { id: string; name: string }
interface Section { id: string; label: string }
interface Teacher { id: string; name: string; designation: string }

function MoreMenu({
  status, statusPending, open, onToggle, onToggleStatus, onDelete,
}: {
  status: HomeworkStatus;
  statusPending: boolean;
  open: boolean;
  onToggle: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        title="More actions"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute right-0 top-full mt-1.5 z-20 w-48 overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg shadow-black/10 py-1">
            <button
              disabled={statusPending}
              onClick={() => { onToggle(); onToggleStatus(); }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors disabled:opacity-50"
            >
              {statusPending ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              ) : status === "active" ? (
                <Lock className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5 shrink-0" />
              )}
              {status === "active" ? "Close Assignment" : "Reopen Assignment"}
            </button>
            <button
              onClick={() => { onToggle(); onDelete(); }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              Delete Assignment
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function HomeworkDetailActions({
  homework, subjects, sections, teachers,
}: {
  homework: Homework;
  subjects: Subject[];
  sections: Section[];
  teachers: Teacher[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [statusPending, startStatusTransition] = useTransition();

  function toggleStatus() {
    const nextStatus: HomeworkStatus = homework.status === "active" ? "closed" : "active";
    startStatusTransition(async () => {
      await setHomeworkStatus(homework.id, nextStatus);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <FancyButton size="sm" onClick={() => setEditing(true)}>
        <Pencil className="h-3.5 w-3.5" /> Edit
      </FancyButton>
      <MoreMenu
        status={homework.status}
        statusPending={statusPending}
        open={menuOpen}
        onToggle={() => setMenuOpen((o) => !o)}
        onToggleStatus={toggleStatus}
        onDelete={() => setDeleting(true)}
      />

      {editing && (
        <AssignmentModal
          open
          onClose={() => setEditing(false)}
          subjects={subjects}
          sections={sections}
          teachers={teachers}
          existing={homework}
          onSaved={() => router.refresh()}
        />
      )}

      {deleting && (
        <DeleteHomeworkModal
          homework={homework}
          onClose={() => setDeleting(false)}
          onDeleted={() => router.push("/dashboard/homework")}
        />
      )}
    </div>
  );
}
