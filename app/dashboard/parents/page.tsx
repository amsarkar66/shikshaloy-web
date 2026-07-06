import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import ParentsClient from "./_components/ParentsClient";
import type { Parent, Child } from "./_components/ParentsClient";

export default async function ParentsPage() {
  const { data: parentRows } = await supabaseAdmin
    .from("parents")
    .select(`
      id, full_name, occupation, phone, email, active,
      student_parents (
        students (
          id, full_name, roll_no,
          sections ( name, grades ( level ) )
        )
      )
    `)
    .eq("school_id", DEMO_SCHOOL_ID)
    .order("full_name");

  const parents: Parent[] = (parentRows ?? []).map((p: any) => {
    const children: Child[] = (p.student_parents ?? []).flatMap((sp: any) => {
      const s = sp.students;
      if (!s) return [];
      return [{
        id:        s.id,
        name:      s.full_name ?? "Unknown",
        rollNo:    s.roll_no ?? "",
        class:     String(s.sections?.grades?.level ?? ""),
        section:   s.sections?.name ?? "",
        feeStatus: "paid" as const,
      }];
    });

    return {
      id:         p.id,
      name:       p.full_name ?? "Unknown",
      occupation: p.occupation ?? "",
      phone:      p.phone ?? "",
      email:      p.email ?? "",
      active:     p.active ?? true,
      children,
    };
  });

  return <ParentsClient initialParents={parents} />;
}
