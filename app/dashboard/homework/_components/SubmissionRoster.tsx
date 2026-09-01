"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Loader2, Users } from "lucide-react";
import { Table, TableHead, TableBody, Th, Td, Tr } from "@/components/ui/data-table";
import { submitHomework, unsubmitHomework } from "../actions";

export interface RosterItem {
  studentId: string;
  fullName: string;
  rollNo: string | null;
  photoUrl: string | null;
  submitted: boolean;
  submittedAt: string | null;
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500",
];

function avatarColor(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function SubmissionRoster({
  homeworkId, items, canEdit,
}: {
  homeworkId: string;
  items: RosterItem[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle(studentId: string, submitted: boolean) {
    if (!canEdit) return;
    setPendingId(studentId);
    startTransition(async () => {
      if (submitted) await unsubmitHomework(homeworkId, studentId);
      else await submitHomework(homeworkId, studentId);
      router.refresh();
      setPendingId(null);
    });
  }

  return (
    <Table>
      <TableHead>
        <Th position="first">Student</Th>
        <Th>Roll No</Th>
        <Th>Status</Th>
        <Th>Submitted At</Th>
      </TableHead>
      <TableBody>
        {items.length === 0 ? (
          <tr>
            <td colSpan={4} className="py-16 text-center">
              <div className="flex flex-col items-center gap-2">
                <Users className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
                <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No students in this class</p>
              </div>
            </td>
          </tr>
        ) : (
          items.map((item) => {
            const busy = isPending && pendingId === item.studentId;
            return (
              <Tr key={item.studentId}>
                <Td position="first">
                  <div className="flex items-center gap-3">
                    {item.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.photoUrl} alt={item.fullName} className="h-8 w-8 shrink-0 rounded-full object-cover" />
                    ) : (
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(item.studentId)}`}>
                        {initials(item.fullName)}
                      </div>
                    )}
                    <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{item.fullName}</p>
                  </div>
                </Td>
                <Td>
                  <span className="text-sm text-gray-700 dark:text-zinc-300">{item.rollNo ?? "—"}</span>
                </Td>
                <Td>
                  <button
                    onClick={() => toggle(item.studentId, item.submitted)}
                    disabled={!canEdit || busy}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors ${
                      item.submitted
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    } ${canEdit ? "cursor-pointer hover:opacity-80" : ""}`}
                  >
                    {busy ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : item.submitted ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Circle className="h-3 w-3" />
                    )}
                    {item.submitted ? "Submitted" : "Pending"}
                  </button>
                </Td>
                <Td>
                  <span className="text-sm text-gray-500 dark:text-zinc-400">
                    {item.submittedAt ? formatDateTime(item.submittedAt) : "—"}
                  </span>
                </Td>
              </Tr>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
