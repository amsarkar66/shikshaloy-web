"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Clock, X, Loader2, CheckCircle2 } from "lucide-react";
import { bookPtmSlot, cancelPtmBooking } from "../actions";

export interface ParentPtmSession {
  id: string;
  classLabel: string;
  teacher: string;
  date: string;
  status: string;
  availableSlots: string[]; // "HH:MM"
  eligibleChildren: { id: string; name: string }[];
}

export interface ParentPtmBooking {
  id: string;
  sessionId: string;
  classLabel: string;
  teacher: string;
  date: string;
  slotTime: string; // "HH:MM"
  studentName: string;
  status: string;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function BookingRow({ booking }: { booking: ParentPtmBooking }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    startTransition(async () => {
      await cancelPtmBooking(booking.id);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{booking.classLabel} · {booking.teacher}</p>
        <p className="text-xs text-gray-400 dark:text-zinc-500">
          For {booking.studentName} · {formatDate(booking.date)} at {booking.slotTime}
        </p>
      </div>
      <button
        onClick={handleCancel}
        disabled={isPending || booking.status !== "booked"}
        className="flex h-7 items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 px-2.5 text-xs text-gray-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700 transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
        Cancel
      </button>
    </div>
  );
}

function SessionCard({ session }: { session: ParentPtmSession }) {
  const router = useRouter();
  const [childId, setChildId] = useState(session.eligibleChildren[0]?.id ?? "");
  const [pendingSlot, setPendingSlot] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleBook(slotTime: string) {
    if (!childId) return;
    setPendingSlot(slotTime);
    startTransition(async () => {
      await bookPtmSlot({ sessionId: session.id, studentId: childId, slotTime: `${slotTime}:00` });
      router.refresh();
      setPendingSlot(null);
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{session.classLabel} · {session.teacher}</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500">{formatDate(session.date)}</p>
        </div>
        {session.eligibleChildren.length > 1 && (
          <select
            value={childId}
            onChange={(e) => setChildId(e.target.value)}
            className="h-8 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-xs text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400"
          >
            {session.eligibleChildren.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
      </div>
      {session.availableSlots.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-zinc-500 py-2">All slots are booked for this session.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {session.availableSlots.map((slot) => (
            <button
              key={slot}
              onClick={() => handleBook(slot)}
              disabled={isPending}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 px-3 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50"
            >
              {isPending && pendingSlot === slot ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock className="h-3 w-3" />}
              {slot}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ParentPtmClient({
  sessions, bookings,
}: {
  sessions: ParentPtmSession[];
  bookings: ParentPtmBooking[];
}) {
  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Parent-Teacher Meetings</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Book a slot with your child&apos;s class teacher</p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-primary-500" />
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">My Bookings</p>
        </div>
        {bookings.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-zinc-500 py-10 text-center">No bookings yet.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {bookings.map((b) => <BookingRow key={b.id} booking={b} />)}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 px-1">
          <CalendarClock className="h-4 w-4 text-primary-500" />
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Scheduled Sessions</p>
        </div>
        {sessions.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-16 text-center">
            <p className="text-sm text-gray-400 dark:text-zinc-500">No PTM sessions scheduled yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sessions.map((s) => <SessionCard key={s.id} session={s} />)}
          </div>
        )}
      </div>
    </div>
  );
}
