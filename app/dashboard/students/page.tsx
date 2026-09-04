import { ShieldAlert } from "lucide-react";
import { getVerifiedRole } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentInstitutionIdOrThrow, getInstitutionSchools } from "@/lib/supabase/institution-context";
import { getStudentCapacity } from "@/lib/billing/plan-limits";
import StudentsClient from "./_components/StudentsClient";
import type { Student } from "./_components/StudentsClient";
import type { SectionOption } from "./_components/add-student-modal";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins can manage students.</p>
      </div>
    </div>
  );
}

interface StudentListRow {
  id: string;
  full_name: string;
  roll_no: string | null;
  attendance_pct: number | null;
  fee_status: string | null;
  status: string | null;
  gender: string | null;
  phone: string | null;
  joined_date: string | null;
  photo_url: string | null;
  school_id: string;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
  student_parents: { parents: { full_name: string | null } | null }[] | null;
}

interface StudentSectionOptionRow {
  id: string;
  name: string | null;
  school_id: string;
  grades: { level: number | null } | null;
}

function toStudent(s: StudentListRow, schoolNameById?: Map<string, string>): Student {
  return {
    id: s.id,
    name: s.full_name,
    rollNo: s.roll_no ?? "",
    class: String(s.sections?.grades?.level ?? ""),
    section: s.sections?.name ?? "",
    parent: s.student_parents?.[0]?.parents?.full_name ?? "—",
    phone: s.phone ?? "—",
    attendance: Math.round(s.attendance_pct ?? 0),
    feeStatus: (s.fee_status ?? "overdue") as Student["feeStatus"],
    active: s.status === "active",
    status: (s.status ?? "active") as Student["status"],
    gender: (s.gender ?? null) as Student["gender"],
    joinedDate: s.joined_date ?? null,
    photoUrl: s.photo_url ?? null,
    schoolId: schoolNameById ? s.school_id : undefined,
    schoolName: schoolNameById ? (schoolNameById.get(s.school_id) ?? "—") : undefined,
  };
}

export default async function StudentsPage() {
  const role = await getVerifiedRole();
  if (role !== "admin" && role !== "super_admin") return <Unauthorized />;

  const institutionId = await getCurrentInstitutionIdOrThrow();
  const [{ maxStudents, atCapacity: atStudentCapacity }, { data: institution }] = await Promise.all([
    getStudentCapacity(institutionId),
    supabaseAdmin.from("institutions").select("country").eq("id", institutionId).maybeSingle(),
  ]);
  const defaultCountry = institution?.country ?? "India";

  if (role === "super_admin") {
    const schools = await getInstitutionSchools(institutionId);
    const schoolIds = schools.map((s) => s.id);
    const schoolNameById = new Map(schools.map((s) => [s.id, s.name]));

    if (schoolIds.length === 0) {
      return <StudentsClient students={[]} sections={[]} schools={schools} atStudentCapacity={atStudentCapacity} maxStudents={maxStudents} defaultCountry={defaultCountry} />;
    }

    const { data: currentYearRows } = await supabaseAdmin
      .from("academic_years")
      .select("id, school_id")
      .in("school_id", schoolIds)
      .eq("is_current", true);
    const currentYearIds = (currentYearRows ?? []).map((y) => y.id);

    const [{ data }, { data: sectionRows }] = await Promise.all([
      supabaseAdmin
        .from("students")
        .select(`
          id, full_name, roll_no, attendance_pct, fee_status, status, gender, phone, joined_date, photo_url, school_id,
          sections ( name, grades ( level ) ),
          student_parents ( parents ( full_name ) )
        `)
        .in("school_id", schoolIds)
        .order("full_name"),

      currentYearIds.length
        ? supabaseAdmin
            .from("sections")
            .select("id, name, school_id, grades ( level )")
            .in("school_id", schoolIds)
            .in("academic_year_id", currentYearIds)
            .order("name")
        : Promise.resolve({ data: [] as StudentSectionOptionRow[] }),
    ]);

    const students: Student[] = ((data ?? []) as unknown as StudentListRow[]).map((s) => toStudent(s, schoolNameById));

    const sections: SectionOption[] = ((sectionRows ?? []) as unknown as StudentSectionOptionRow[])
      .map((s) => ({ id: s.id, name: s.name ?? "", gradeLevel: s.grades?.level ?? 0, schoolId: s.school_id, schoolName: schoolNameById.get(s.school_id) ?? "—" }))
      .sort((a, b) => (a.schoolName ?? "").localeCompare(b.schoolName ?? "") || a.gradeLevel - b.gradeLevel || a.name.localeCompare(b.name));

    return (
      <StudentsClient
        students={students}
        sections={sections}
        schools={schools}
        atStudentCapacity={atStudentCapacity}
        maxStudents={maxStudents}
        defaultCountry={defaultCountry}
      />
    );
  }

  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const [{ data }, { data: sectionRows }] = await Promise.all([
    supabaseAdmin
      .from("students")
      .select(`
        id, full_name, roll_no, attendance_pct, fee_status, status, gender, phone, joined_date, photo_url, school_id,
        sections ( name, grades ( level ) ),
        student_parents ( parents ( full_name ) )
      `)
      .eq("school_id", schoolId)
      .order("full_name"),

    supabaseAdmin
      .from("sections")
      .select("id, name, school_id, grades ( level )")
      .eq("school_id", schoolId)
      .eq("academic_year_id", academicYearId)
      .order("name"),
  ]);

  const students: Student[] = ((data ?? []) as unknown as StudentListRow[]).map((s) => toStudent(s));

  const sections: SectionOption[] = ((sectionRows ?? []) as unknown as StudentSectionOptionRow[])
    .map((s) => ({ id: s.id, name: s.name ?? "", gradeLevel: s.grades?.level ?? 0 }))
    .sort((a: SectionOption, b: SectionOption) => a.gradeLevel - b.gradeLevel || a.name.localeCompare(b.name));

  return (
    <StudentsClient
      students={students}
      sections={sections}
      atStudentCapacity={atStudentCapacity}
      maxStudents={maxStudents}
      defaultCountry={defaultCountry}
    />
  );
}
