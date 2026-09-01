import { ShieldAlert } from "lucide-react";
import { getVerifiedRole } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import ExamPreferenceClient, { type PreferenceSectionOption } from "../_components/ExamPreferenceClient";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins and institution owners can manage exam preferences.</p>
      </div>
    </div>
  );
}

export default async function ExamPreferencePage() {
  const role = await getVerifiedRole();
  if (role !== "admin" && role !== "super_admin") return <Unauthorized />;

  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const { data: sectionRows } = await supabaseAdmin
    .from("sections")
    .select("id, name, grades ( level )")
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId);

  const sections: PreferenceSectionOption[] = (sectionRows ?? [])
    .map((s) => {
      const grades = s.grades as unknown as { level: number | null } | { level: number | null }[] | null;
      const level = Array.isArray(grades) ? grades[0]?.level : grades?.level;
      return { id: s.id, label: `Class ${level ?? "?"}-${s.name ?? ""}` };
    })
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

  return <ExamPreferenceClient sections={sections} />;
}
