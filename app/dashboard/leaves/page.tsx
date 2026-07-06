import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import LeavesClient from "./_components/LeavesClient";
import type { Leave } from "./_components/LeavesClient";

export default async function LeavesPage() {
  const { data } = await supabaseAdmin
    .from("leave_requests")
    .select(`
      id, leave_type, from_date, to_date, days, reason, status, applied_on,
      staff_members ( full_name, designation, department )
    `)
    .eq("school_id", DEMO_SCHOOL_ID)
    .order("applied_on", { ascending: false });

  const leaves: Leave[] = (data ?? []).map((l: any) => ({
    id: l.id,
    staffName: l.staff_members?.full_name ?? "Unknown",
    role: l.staff_members?.designation ?? "",
    department: l.staff_members?.department ?? "",
    leaveType: l.leave_type,
    from: l.from_date ?? "",
    to: l.to_date ?? "",
    days: l.days ?? 1,
    reason: l.reason ?? "",
    status: l.status ?? "pending",
    appliedOn: l.applied_on ?? "",
    approvedBy: undefined,
  }));

  return <LeavesClient initialLeaves={leaves} />;
}
