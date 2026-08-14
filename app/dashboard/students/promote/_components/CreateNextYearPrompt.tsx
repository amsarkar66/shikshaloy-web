"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarPlus, Loader2 } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { createAcademicYear } from "@/lib/academic-years/actions";

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

export default function CreateNextYearPrompt({ currentYearName }: { currentYearName: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name || !startDate || !endDate) {
      setError("Name, start date and end date are all required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createAcademicYear({ name, startDate, endDate });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create academic year");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full px-6 py-6">
      <Link href="/dashboard/students" className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Students
      </Link>

      <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
          <CalendarPlus className="h-6 w-6" />
        </div>
        <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-zinc-50">Set up the next academic year first</p>
        <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">
          {currentYearName} is the only academic year configured. Promoting students moves them into a different year — create one below (this also copies the current classes &amp; sections over).
        </p>

        <div className="mt-5 space-y-3 text-left">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="2027-28" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
            </div>
          </div>
          <FancyButton disabled={busy} onClick={handleCreate} size="sm" className="w-full">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Create Academic Year
          </FancyButton>
        </div>
      </div>
    </div>
  );
}
