import { supabaseAdmin, DEMO_SCHOOL_ID, DEMO_AY_ID } from "@/lib/supabase/service";
import StudentsClient from "./_components/StudentsClient";
import type { Student } from "./_components/StudentsClient";
import type { SectionOption } from "./_components/add-student-modal";

export default async function StudentsPage() {
  const [{ data }, { data: sectionRows }] = await Promise.all([
    supabaseAdmin
      .from("students")
      .select(`
        id, full_name, roll_no, attendance_pct, fee_status, status, phone, joined_date, photo_url,
        sections ( name, grades ( level ) ),
        student_parents ( parents ( full_name ) )
      `)
      .eq("school_id", DEMO_SCHOOL_ID)
      .order("full_name"),

    supabaseAdmin
      .from("sections")
      .select("id, name, grades ( level )")
      .eq("school_id", DEMO_SCHOOL_ID)
      .eq("academic_year_id", DEMO_AY_ID)
      .order("name"),
  ]);

  const students: Student[] = (data ?? []).map((s: any) => ({
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
    joinedDate: s.joined_date ?? null,
    photoUrl: s.photo_url ?? null,
  }));

  const sections: SectionOption[] = (sectionRows ?? [])
    .map((s: any) => ({ id: s.id, name: s.name ?? "", gradeLevel: s.grades?.level ?? 0 }))
    .sort((a: SectionOption, b: SectionOption) => a.gradeLevel - b.gradeLevel || a.name.localeCompare(b.name));

  return <StudentsClient students={students} sections={sections} />;
}
