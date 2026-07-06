import { supabaseAdmin, DEMO_SCHOOL_ID, DEMO_AY_ID } from "@/lib/supabase/service";
import IdCardsClient from "./_components/IdCardsClient";
import type { CardPerson } from "./_data/people";

export default async function IdCardsPage() {
  const [{ data: ayRow }, { data: studentRows }, { data: staffRows }] = await Promise.all([
    supabaseAdmin.from("academic_years").select("end_date").eq("id", DEMO_AY_ID).single(),

    supabaseAdmin
      .from("students")
      .select("id, full_name, roll_no, blood_group, sections ( name, grades ( level ) )")
      .eq("school_id", DEMO_SCHOOL_ID)
      .order("full_name"),

    supabaseAdmin
      .from("staff_members")
      .select("id, full_name, employee_id, designation, blood_group")
      .eq("school_id", DEMO_SCHOOL_ID)
      .order("full_name"),
  ]);

  const validTill = ayRow?.end_date
    ? new Date(ayRow.end_date).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "—";

  const students: CardPerson[] = ((studentRows ?? []) as any[]).map((s) => ({
    id: s.id,
    type: "student" as const,
    name: s.full_name,
    idNumber: s.roll_no ?? "—",
    subtitle: `Class ${s.sections?.grades?.level ?? "?"}-${s.sections?.name ?? ""}`,
    bloodGroup: s.blood_group ?? "—",
    validTill,
  }));

  const staff: CardPerson[] = ((staffRows ?? []) as any[]).map((s) => ({
    id: s.id,
    type: "staff" as const,
    name: s.full_name,
    idNumber: s.employee_id ?? "—",
    subtitle: s.designation ?? "Staff",
    bloodGroup: s.blood_group ?? "—",
    validTill,
  }));

  return <IdCardsClient people={[...students, ...staff]} />;
}
