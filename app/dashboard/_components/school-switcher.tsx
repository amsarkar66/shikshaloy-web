"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown } from "lucide-react";
import { setActiveSchool } from "./school-switcher-actions";

export function SchoolSwitcher({
  schools, activeSchoolId,
}: {
  schools: { id: string; name: string }[];
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
    <div className="relative px-3 pb-2">
      <ChevronsUpDown className="pointer-events-none absolute right-6 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
      <select
        value={activeSchoolId ?? ""}
        onChange={handleChange}
        disabled={isPending}
        className="w-full appearance-none rounded-lg border border-primary-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 py-1.5 pl-2.5 pr-7 text-xs font-medium text-gray-700 dark:text-zinc-300 disabled:opacity-60"
        aria-label="Switch school"
      >
        {schools.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </div>
  );
}
