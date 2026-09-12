"use client";

import { useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Circle, Loader2, Users, MoreHorizontal, Eye, Phone } from "lucide-react";
import { Table, TableHead, TableBody, Th, Td, Tr } from "@/components/ui/data-table";
import { submitHomework, unsubmitHomework } from "../actions";

export interface RosterItem {
  studentId: string;
  fullName: string;
  rollNo: string | null;
  photoUrl: string | null;
  phone: string | null;
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

function RowActionsMenu({
  item, canToggle, busy, open, onToggleOpen, onCloseMenu, onToggleSubmission,
}: {
  item: RosterItem;
  canToggle: boolean;
  busy: boolean;
  open: boolean;
  onToggleOpen: () => void;
  onCloseMenu: () => void;
  onToggleSubmission: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  function handleToggle() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    onToggleOpen();
  }

  const menuItemClass = "flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors";
  const disabledMenuItemClass = "flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-300 dark:text-zinc-600 cursor-not-allowed";

  return (
    <div className="flex justify-end">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        title="More actions"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>

      {open && pos && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={onCloseMenu} />
          <div
            style={{ top: pos.top, right: pos.right }}
            className="fixed z-50 w-48 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg shadow-black/10 py-1"
          >
            <button
              disabled={!canToggle || busy}
              onClick={() => { onCloseMenu(); onToggleSubmission(); }}
              className={!canToggle || busy ? disabledMenuItemClass : `w-full ${menuItemClass}`}
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              ) : item.submitted ? (
                <Circle className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              )}
              {item.submitted ? "Mark as Pending" : "Mark as Submitted"}
            </button>
            <Link href={`/dashboard/students/${item.studentId}`} onClick={onCloseMenu} prefetch={false} className={menuItemClass}>
              <Eye className="h-3.5 w-3.5 shrink-0" /> View Student Profile
            </Link>
            {item.phone ? (
              <a href={`tel:${item.phone}`} className={menuItemClass}>
                <Phone className="h-3.5 w-3.5 shrink-0" /> Call Parent
              </a>
            ) : (
              <span className={disabledMenuItemClass}>
                <Phone className="h-3.5 w-3.5 shrink-0" /> Call Parent
              </span>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

export function SubmissionRoster({
  homeworkId, items, canEdit, locked = false,
}: {
  homeworkId: string;
  items: RosterItem[];
  canEdit: boolean;
  locked?: boolean;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const canToggle = canEdit && !locked;

  function toggle(studentId: string, submitted: boolean) {
    if (!canToggle) return;
    setError(null);
    setPendingId(studentId);
    startTransition(async () => {
      try {
        if (submitted) await unsubmitHomework(homeworkId, studentId);
        else await submitHomework(homeworkId, studentId);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update submission");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      <Table>
      <TableHead>
        <Th position="first">Student</Th>
        <Th>Roll No</Th>
        <Th>Status</Th>
        <Th>Submitted At</Th>
        <Th position="last" align="right">Actions</Th>
      </TableHead>
      <TableBody>
        {items.length === 0 ? (
          <tr>
            <td colSpan={5} className="py-16 text-center">
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
                  <span
                    title={locked ? "This assignment is closed and no longer accepting submissions" : undefined}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${
                      item.submitted
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {busy ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : item.submitted ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Circle className="h-3 w-3" />
                    )}
                    {item.submitted ? "Submitted" : "Pending"}
                  </span>
                </Td>
                <Td>
                  <span className="text-sm text-gray-500 dark:text-zinc-400">
                    {item.submittedAt ? formatDateTime(item.submittedAt) : "—"}
                  </span>
                </Td>
                <Td position="last">
                  <RowActionsMenu
                    item={item}
                    canToggle={canToggle}
                    busy={busy}
                    open={openMenuId === item.studentId}
                    onToggleOpen={() => setOpenMenuId(openMenuId === item.studentId ? null : item.studentId)}
                    onCloseMenu={() => setOpenMenuId(null)}
                    onToggleSubmission={() => toggle(item.studentId, item.submitted)}
                  />
                </Td>
              </Tr>
            );
          })
        )}
      </TableBody>
      </Table>
    </div>
  );
}
