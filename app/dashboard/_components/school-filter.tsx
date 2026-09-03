import { ChevronDown, Landmark } from "lucide-react";
import type { InstitutionSchool } from "@/lib/supabase/institution-context";

// Shared "All Schools ▾" filter + school column cell for super_admin pages
// that combine data across every school in the institution instead of
// scoping to one active school (see lib/supabase/institution-context.ts'
// getInstitutionSchools and PageSchoolPicker for the single-school case).
export function SchoolFilterSelect({
  schools, value, onChange,
}: {
  schools: InstitutionSchool[];
  value: string;
  onChange: (schoolId: string) => void;
}) {
  if (schools.length < 2) return null;

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
      >
        <option value="all">All Schools</option>
        {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
    </div>
  );
}

export function SchoolCell({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-zinc-300">
      <Landmark className="h-3.5 w-3.5 shrink-0 text-violet-400" />{name}
    </span>
  );
}

export function matchesSchoolFilter(schoolFilter: string, schoolId: string | null | undefined): boolean {
  return schoolFilter === "all" || schoolId === schoolFilter;
}
