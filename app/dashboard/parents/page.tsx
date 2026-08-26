import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import ParentsClient from "./_components/ParentsClient";
import type { Parent, Child } from "./_components/ParentsClient";

interface ParentRow {
  id: string;
  full_name: string | null;
  occupation: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
  student_parents: {
    students: {
      id: string;
      full_name: string | null;
      roll_no: string | null;
      fee_status: string | null;
      sections: { name: string | null; grades: { level: number | null } | null } | null;
    } | null;
  }[] | null;
}

export default async function ParentsPage() {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data: parentRows } = await supabaseAdmin
    .from("parents")
    .select(`
      id, full_name, occupation, phone, email, status,
      student_parents (
        students (
          id, full_name, roll_no, fee_status,
          sections ( name, grades ( level ) )
        )
      )
    `)
    .eq("school_id", schoolId)
    .order("full_name");

  const parents: Parent[] = ((parentRows ?? []) as unknown as ParentRow[]).map((p) => {
    const children: Child[] = (p.student_parents ?? []).flatMap((sp) => {
      const s = sp.students;
      if (!s) return [];
      return [{
        id:        s.id,
        name:      s.full_name ?? "Unknown",
        rollNo:    s.roll_no ?? "",
        class:     String(s.sections?.grades?.level ?? ""),
        section:   s.sections?.name ?? "",
        feeStatus: (s.fee_status ?? "overdue") as Child["feeStatus"],
      }];
    });

    return {
      id:         p.id,
      name:       p.full_name ?? "Unknown",
      occupation: p.occupation ?? "",
      phone:      p.phone ?? "",
      email:      p.email ?? "",
      active:     p.status !== "inactive",
      children,
    };
  });

  return <ParentsClient initialParents={parents} />;
}
