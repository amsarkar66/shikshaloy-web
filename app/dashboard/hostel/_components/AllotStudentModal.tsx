"use client";

import { useState } from "react";
import { X, Loader2, ChevronDown } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { DatePicker } from "@/components/ui/date-picker";
import { allotStudent } from "../actions";
import type { HostelRoom, EligibleStudentOption, FeeStatus } from "../_data/hostel";

interface AllotStudentModalProps {
  rooms: HostelRoom[];
  students: EligibleStudentOption[];
  onClose: () => void;
  onSaved: () => void;
}

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60 disabled:cursor-not-allowed";

const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function AllotStudentModal({ rooms, students, onClose, onSaved }: AllotStudentModalProps) {
  const [studentId, setStudentId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [joinDate, setJoinDate] = useState(todayIso());
  const [monthlyFee, setMonthlyFee] = useState("");
  const [feeStatus, setFeeStatus] = useState<FeeStatus>("overdue");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableRooms = rooms.filter((r) => r.status !== "maintenance" && r.occupied < r.capacity);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId || !roomId) {
      setError("Select a student and a room.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await allotStudent({
        studentId,
        roomId,
        joinDate,
        monthlyFee: monthlyFee ? Number(monthlyFee) : 0,
        feeStatus,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to allot student");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Allot Student</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Student *</label>
            <div className="relative">
              <select className={selectClass} value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
                <option value="">— Select student —</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.classNum}–{s.section}, {s.rollNo})</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            </div>
            {students.length === 0 && <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">All active students already have a hostel allotment.</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Room *</label>
            <div className="relative">
              <select className={selectClass} value={roomId} onChange={(e) => setRoomId(e.target.value)} required>
                <option value="">— Select room —</option>
                {availableRooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.roomNo} · Block {r.block} ({r.occupied}/{r.capacity})</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            </div>
            {availableRooms.length === 0 && <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">No rooms with free beds right now.</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Join Date *</label>
              <DatePicker value={joinDate} onChange={setJoinDate} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Monthly Fee (₹)</label>
              <input type="number" min={0} className={inputClass} value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} placeholder="0" />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Fee Status</label>
              <div className="flex gap-2">
                {(["paid", "partial", "overdue"] as FeeStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFeeStatus(s)}
                    className={`h-9 flex-1 rounded-lg text-xs font-medium capitalize transition-colors ${feeStatus === s ? "bg-primary-500 text-white" : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
              Cancel
            </button>
            <FancyButton type="submit" disabled={busy} size="sm">
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Allot Student
            </FancyButton>
          </div>
        </form>
      </div>
    </div>
  );
}
