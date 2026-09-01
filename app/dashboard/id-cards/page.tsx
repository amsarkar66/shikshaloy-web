import { ShieldAlert } from "lucide-react";
import { requireRole } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import IdCardsClient from "./_components/IdCardsClient";
import type { CardPerson } from "./_data/people";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins can generate ID cards.</p>
      </div>
    </div>
  );
}

interface IdCardStudentRow {
  id: string;
  full_name: string;
  roll_no: string | null;
  admission_no: string | null;
  dob: string | null;
  blood_group: string | null;
  phone: string | null;
  photo_url: string | null;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
}

interface IdCardStaffRow {
  id: string;
  full_name: string;
  employee_id: string | null;
  designation: string | null;
  blood_group: string | null;
  phone: string | null;
}

function formatDate(d: string | null | undefined): string | null {
  if (!d) return null;
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function IdCardsPage() {
  try {
    await requireRole(["admin"]);
  } catch {
    return <Unauthorized />;
  }

  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const [{ data: schoolRow }, { data: ayRow }, { data: studentRows }, { data: staffRows }] = await Promise.all([
    supabaseAdmin.from("schools").select("name, logo_url").eq("id", schoolId).maybeSingle(),

    supabaseAdmin.from("academic_years").select("end_date").eq("id", academicYearId).single(),

    supabaseAdmin
      .from("students")
      .select("id, full_name, roll_no, admission_no, dob, blood_group, phone, photo_url, sections ( name, grades ( level ) )")
      .eq("school_id", schoolId)
      .order("full_name"),

    supabaseAdmin
      .from("staff_members")
      .select("id, full_name, employee_id, designation, blood_group, phone")
      .eq("school_id", schoolId)
      .order("full_name"),
  ]);

  const validTill = formatDate(ayRow?.end_date) ?? "—";

  const students: CardPerson[] = ((studentRows ?? []) as unknown as IdCardStudentRow[]).map((s) => ({
    id: s.id,
    type: "student" as const,
    name: s.full_name,
    idNumber: s.roll_no ?? "—",
    admissionNo: s.admission_no ?? null,
    gradeLevel: s.sections?.grades?.level ?? null,
    section: s.sections?.name ?? null,
    subtitle: `Class ${s.sections?.grades?.level ?? "?"}-${s.sections?.name ?? ""}`,
    bloodGroup: s.blood_group ?? "—",
    phone: s.phone ?? null,
    dob: formatDate(s.dob),
    photoUrl: s.photo_url ?? null,
    validTill,
  }));

  const staff: CardPerson[] = ((staffRows ?? []) as unknown as IdCardStaffRow[]).map((s) => ({
    id: s.id,
    type: "staff" as const,
    name: s.full_name,
    idNumber: s.employee_id ?? "—",
    admissionNo: null,
    gradeLevel: null,
    section: null,
    subtitle: s.designation ?? "Staff",
    bloodGroup: s.blood_group ?? "—",
    phone: s.phone ?? null,
    dob: null,
    photoUrl: null,
    validTill,
  }));

  return (
    <IdCardsClient
      people={[...students, ...staff]}
      schoolName={schoolRow?.name ?? "Shikshaloy"}
      schoolLogoUrl={schoolRow?.logo_url ?? null}
    />
  );
}
