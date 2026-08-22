"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolId, getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";

// Front desk operations are principal/owner work, but day-to-day they're
// run by reception staff (auth role "staff", nav template "receptionist"),
// so this allows staff too rather than restricting to admin/super_admin.
async function requireFrontDeskAccess() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role as string | undefined;
  if (!user || (role !== "admin" && role !== "super_admin" && role !== "staff")) {
    throw new Error("Unauthorized");
  }
  return user;
}

// ── Visitor Log ────────────────────────────────────────────────────────────

export async function addVisitor(input: { visitorName: string; phone: string; purpose: string; meetingWith: string }) {
  const user = await requireFrontDeskAccess();
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin.from("visitor_logs").insert({
    school_id: schoolId,
    visitor_name: input.visitorName,
    phone: input.phone || null,
    purpose: input.purpose,
    meeting_with: input.meetingWith || null,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/front-desk");
}

export async function checkOutVisitor(id: string) {
  await requireFrontDeskAccess();
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin
    .from("visitor_logs")
    .update({ out_time: new Date().toISOString() })
    .eq("id", id)
    .eq("school_id", schoolId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/front-desk");
}

// ── Walk-in Enquiries ────────────────────────────────────────────────────

export async function addEnquiry(input: { name: string; phone: string; email: string; interestedGrade: string; source: string; notes: string }) {
  const user = await requireFrontDeskAccess();
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin.from("front_desk_enquiries").insert({
    school_id: schoolId,
    name: input.name,
    phone: input.phone || null,
    email: input.email || null,
    interested_grade: input.interestedGrade || null,
    source: input.source || null,
    notes: input.notes || null,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/front-desk");
}

export async function updateEnquiryStatus(id: string, status: "new" | "contacted" | "converted" | "closed") {
  await requireFrontDeskAccess();
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin
    .from("front_desk_enquiries")
    .update({ status })
    .eq("id", id)
    .eq("school_id", schoolId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/front-desk");
}

// ── Call Log ─────────────────────────────────────────────────────────────

export async function addCallLog(input: { callerName: string; phone: string; direction: "incoming" | "outgoing"; purpose: string; notes: string }) {
  const user = await requireFrontDeskAccess();
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin.from("call_logs").insert({
    school_id: schoolId,
    caller_name: input.callerName,
    phone: input.phone || null,
    direction: input.direction,
    purpose: input.purpose || null,
    notes: input.notes || null,
    handled_by: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/front-desk");
}

// ── Gate Pass ────────────────────────────────────────────────────────────

export async function searchStudentsForGatePass(query: string): Promise<{ id: string; label: string; sublabel: string }[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const schoolId = await getCurrentSchoolId();
  if (!schoolId) return [];

  const { data } = await supabaseAdmin
    .from("students")
    .select("id, full_name, roll_no")
    .eq("school_id", schoolId)
    .ilike("full_name", `%${q}%`)
    .order("full_name")
    .limit(10);

  return (data ?? []).map((s) => ({ id: s.id, label: s.full_name ?? "Unknown", sublabel: s.roll_no ? `Roll No. ${s.roll_no}` : "Student" }));
}

export async function addGatePass(input: { studentId: string; reason: string; pickupPersonName: string; pickupPersonRelation: string }) {
  const user = await requireFrontDeskAccess();
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin.from("gate_passes").insert({
    school_id: schoolId,
    student_id: input.studentId,
    reason: input.reason,
    pickup_person_name: input.pickupPersonName,
    pickup_person_relation: input.pickupPersonRelation || null,
    approved_by: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/front-desk");
}

// ── Postal Register ──────────────────────────────────────────────────────

export async function addPostalRecord(input: { direction: "dispatch" | "receive"; referenceNo: string; subject: string; contactName: string; notes: string }) {
  const user = await requireFrontDeskAccess();
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin.from("postal_records").insert({
    school_id: schoolId,
    direction: input.direction,
    reference_no: input.referenceNo || null,
    subject: input.subject,
    contact_name: input.contactName || null,
    notes: input.notes || null,
    created_by: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/front-desk");
}
