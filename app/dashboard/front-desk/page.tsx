import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import FrontDeskClient, {
  type VisitorEntry, type EnquiryEntry, type CallLogEntry, type GatePassEntry, type PostalEntry,
} from "./_components/FrontDeskClient";

const LIST_LIMIT = 50;

interface VisitorRow {
  id: string; visitor_name: string; phone: string | null; purpose: string;
  meeting_with: string | null; in_time: string; out_time: string | null;
}
interface EnquiryRow {
  id: string; name: string; phone: string | null; email: string | null;
  interested_grade: string | null; source: string | null; notes: string | null;
  status: EnquiryEntry["status"]; created_at: string;
}
interface CallRow {
  id: string; caller_name: string; phone: string | null; direction: CallLogEntry["direction"];
  purpose: string | null; notes: string | null; created_at: string;
}
interface GatePassRow {
  id: string; reason: string; pickup_person_name: string; pickup_person_relation: string | null;
  pass_time: string; students: { full_name: string | null; roll_no: string | null } | null;
}
interface PostalRow {
  id: string; direction: PostalEntry["direction"]; reference_no: string | null; subject: string;
  contact_name: string | null; record_date: string; notes: string | null;
}

export default async function FrontDeskPage() {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const [
    { data: visitorRows },
    { data: enquiryRows },
    { data: callRows },
    { data: gatePassRows },
    { data: postalRows },
  ] = await Promise.all([
    supabaseAdmin.from("visitor_logs").select("id, visitor_name, phone, purpose, meeting_with, in_time, out_time")
      .eq("school_id", schoolId).order("in_time", { ascending: false }).limit(LIST_LIMIT),
    supabaseAdmin.from("front_desk_enquiries").select("id, name, phone, email, interested_grade, source, notes, status, created_at")
      .eq("school_id", schoolId).order("created_at", { ascending: false }).limit(LIST_LIMIT),
    supabaseAdmin.from("call_logs").select("id, caller_name, phone, direction, purpose, notes, created_at")
      .eq("school_id", schoolId).order("created_at", { ascending: false }).limit(LIST_LIMIT),
    supabaseAdmin.from("gate_passes").select("id, reason, pickup_person_name, pickup_person_relation, pass_time, students ( full_name, roll_no )")
      .eq("school_id", schoolId).order("pass_time", { ascending: false }).limit(LIST_LIMIT),
    supabaseAdmin.from("postal_records").select("id, direction, reference_no, subject, contact_name, record_date, notes")
      .eq("school_id", schoolId).order("record_date", { ascending: false }).limit(LIST_LIMIT),
  ]);

  const visitors: VisitorEntry[] = ((visitorRows ?? []) as VisitorRow[]).map((r) => ({
    id: r.id, visitorName: r.visitor_name, phone: r.phone, purpose: r.purpose,
    meetingWith: r.meeting_with, inTime: r.in_time, outTime: r.out_time,
  }));

  const enquiries: EnquiryEntry[] = ((enquiryRows ?? []) as EnquiryRow[]).map((r) => ({
    id: r.id, name: r.name, phone: r.phone, email: r.email, interestedGrade: r.interested_grade,
    source: r.source, notes: r.notes, status: r.status, createdAt: r.created_at,
  }));

  const calls: CallLogEntry[] = ((callRows ?? []) as CallRow[]).map((r) => ({
    id: r.id, callerName: r.caller_name, phone: r.phone, direction: r.direction,
    purpose: r.purpose, notes: r.notes, createdAt: r.created_at,
  }));

  const gatePasses: GatePassEntry[] = ((gatePassRows ?? []) as unknown as GatePassRow[]).map((r) => ({
    id: r.id, studentName: r.students?.full_name ?? "Unknown", studentRollNo: r.students?.roll_no ?? "—",
    reason: r.reason, pickupPersonName: r.pickup_person_name, pickupPersonRelation: r.pickup_person_relation,
    passTime: r.pass_time,
  }));

  const postal: PostalEntry[] = ((postalRows ?? []) as PostalRow[]).map((r) => ({
    id: r.id, direction: r.direction, referenceNo: r.reference_no, subject: r.subject,
    contactName: r.contact_name, recordDate: r.record_date, notes: r.notes,
  }));

  return (
    <FrontDeskClient
      visitors={visitors}
      enquiries={enquiries}
      calls={calls}
      gatePasses={gatePasses}
      postal={postal}
    />
  );
}
