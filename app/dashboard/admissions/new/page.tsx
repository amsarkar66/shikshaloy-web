import { ShieldAlert } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { requireRoleOrStaffTemplate } from "@/lib/auth/verified-role";
import NewApplicationForm, { type AcademicYearOption, type GradeOption } from "../_components/NewApplicationForm";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins, institution owners, and front-desk staff can add applications.</p>
      </div>
    </div>
  );
}

export default async function NewApplicationPage() {
  try {
    await requireRoleOrStaffTemplate(["admin", "super_admin"], ["receptionist"]);
  } catch {
    return <Unauthorized />;
  }

  const schoolId = await getCurrentSchoolIdOrThrow();
  const [{ data: yearRows }, { data: gradeRows }] = await Promise.all([
    supabaseAdmin
      .from("academic_years")
      .select("id, name")
      .eq("school_id", schoolId)
      .order("name", { ascending: false }),
    supabaseAdmin
      .from("grades")
      .select("id, name, level")
      .eq("school_id", schoolId)
      .order("level"),
  ]);

  const academicYears: AcademicYearOption[] = (yearRows ?? []).map((y) => ({ id: y.id, name: y.name }));
  const grades: GradeOption[] = (gradeRows ?? []).map((g) => ({ id: g.id, name: g.name }));

  return <NewApplicationForm academicYears={academicYears} grades={grades} />;
}
