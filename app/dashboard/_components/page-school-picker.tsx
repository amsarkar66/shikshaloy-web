"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Landmark, ChevronDown } from "lucide-react";
import { setActiveSchool } from "./school-switcher-actions";
import type { InstitutionSchool } from "@/lib/supabase/institution-context";

// In-page school switcher, for pages that are
// inherently single-school workflows (attendance, timetable, settings, …)
// and so can't just combine data across schools — a super_admin still needs
// to pick which one school they're operating on. Writes to the same
// active_school_id cookie via setActiveSchool, so the choice sticks when
// navigating to another page that reads getCurrentSchoolId().
export function PageSchoolPicker({
  schools, activeSchoolId,
}: {
  schools: InstitutionSchool[];
  activeSchoolId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (schools.length < 2) return null;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const schoolId = e.target.value;
    startTransition(async () => {
      await setActiveSchool(schoolId);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <Landmark className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-violet-400" />
      <select
        value={activeSchoolId ?? ""}
        onChange={handleChange}
        disabled={isPending}
        aria-label="Switch school"
        className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-8 pr-8 text-sm font-medium text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60"
      >
        {schools.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
    </div>
  );
}
