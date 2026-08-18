import { supabaseAdmin } from "@/lib/supabase/service";
import { PLANS } from "@/app/dashboard/billing/_data/billing";

export async function getSchoolCapacity(institutionId: string) {
  const [{ data: subscription }, { count: schoolCount }] = await Promise.all([
    supabaseAdmin.from("school_subscriptions").select("max_schools").eq("institution_id", institutionId).maybeSingle(),
    supabaseAdmin.from("schools").select("id", { count: "exact", head: true }).eq("institution_id", institutionId),
  ]);
  const maxSchools = subscription?.max_schools ?? 1;
  const schoolsUsed = schoolCount ?? 0;
  return { maxSchools, schoolsUsed, atCapacity: schoolsUsed >= maxSchools };
}

export async function getStudentCapacity(institutionId: string) {
  const [{ data: subscription }, { data: schoolRows }] = await Promise.all([
    supabaseAdmin.from("school_subscriptions").select("plan_id").eq("institution_id", institutionId).maybeSingle(),
    supabaseAdmin.from("schools").select("id").eq("institution_id", institutionId),
  ]);

  const plan = PLANS.find((p) => p.id === subscription?.plan_id);
  const maxStudents = plan?.maxStudents ?? null; // null = unlimited

  const schoolIds = (schoolRows ?? []).map((s) => s.id);
  const { count: studentCount } = schoolIds.length
    ? await supabaseAdmin.from("students").select("id", { count: "exact", head: true }).in("school_id", schoolIds)
    : { count: 0 };

  const studentsUsed = studentCount ?? 0;
  return {
    maxStudents,
    studentsUsed,
    atCapacity: maxStudents !== null && studentsUsed >= maxStudents,
  };
}
