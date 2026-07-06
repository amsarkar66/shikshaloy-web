import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import StudentsClient from "./_components/StudentsClient";
import type { Student } from "./_components/StudentsClient";

export default async function StudentsPage() {
  const { data } = await supabaseAdmin
    .from("students")
    .select(`
      id, full_name, roll_no, attendance_pct, fee_status, status, phone,
      sections ( name, grades ( level ) ),
      student_parents ( parents ( full_name ) )
    `)
    .eq("school_id", DEMO_SCHOOL_ID)
    .order("full_name");

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
  }));

  return <StudentsClient students={students} />;
}
