import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Phone, Calendar,
  GraduationCap, BookOpen,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { DAYS, type Period, type RowItem, type ClassTimetable, type Day, type Slot } from "../../timetable/_data/timetable";
import type { LeaveType, LeaveStatus } from "../../leaves/_data/leaves";
import StudentDetailTabs, { StudentSidebar, type Guardian, type ExamRow, type FeeRow, type LibraryIssueRow, type LeaveRow } from "../_components/StudentDetailTabs";
import { StudentReportButton } from "../_components/StudentReportButton";
import { StudentQuickStats } from "../_components/StudentQuickStats";

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500",
  "bg-cyan-500", "bg-orange-500",
];

function avatarColor(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function attColor(pct: number) {
  if (pct >= 90) return { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" };
  if (pct >= 80) return { bar: "bg-amber-500",   text: "text-amber-600 dark:text-amber-400" };
  return           { bar: "bg-red-500",     text: "text-red-600 dark:text-red-400" };
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function monthLabel(d: string): string {
  return new Date(d).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

interface StudentDetailRow {
  id: string;
  full_name: string;
  roll_no: string | null;
  admission_no: string | null;
  dob: string | null;
  gender: string | null;
  address: string | null;
  phone: string | null;
  photo_url: string | null;
  attendance_pct: number | null;
  fee_status: string | null;
  status: string | null;
  joined_date: string | null;
  section_id: string | null;
  academic_year_id: string | null;
  profile_id: string | null;
  blood_group: string | null;
  religion: string | null;
  caste: string | null;
  mother_tongue: string | null;
  language: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  medical_conditions: string | null;
  allergies: string | null;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
  student_parents: {
    relationship: string | null;
    parents: { full_name: string | null; phone: string | null; email: string | null; occupation: string | null } | null;
  }[] | null;
}

interface StudentExamResultDetailRow {
  marks_obtained: number | null;
  max_marks: number | null;
  grade: string | null;
  is_absent: boolean | null;
  subjects: { name: string | null } | null;
  exams: { name: string | null; start_date: string } | null;
}

interface StudentAttendanceDetailRow {
  date: string;
  status: string;
}

interface StudentFeePaymentDetailRow {
  month_str: string;
  category: string;
  amount_due: number | null;
  amount_paid: number | null;
  status: string | null;
  paid_date: string | null;
  receipt_no: string | null;
}

interface TimetablePeriodRow {
  number: number;
  start_time: string;
  end_time: string;
  is_break: boolean | null;
  break_label: string | null;
}

interface TimetableSlotRow {
  day_of_week: number;
  period_number: number;
  room: string | null;
  subjects: { name: string | null; code: string | null } | null;
  profiles: { full_name: string | null } | null;
}

interface BookIssueRow {
  issued_date: string;
  due_date: string;
  returned_date: string | null;
  library_books: { title: string | null; author: string | null; category: string | null } | null;
}

interface LeaveRequestRow {
  id: string;
  leave_type: string;
  from_date: string | null;
  to_date: string | null;
  days: number | null;
  reason: string | null;
  status: string | null;
  applied_on: string | null;
  approver: { full_name: string | null } | null;
}

interface StudentTransportRow {
  id: string;
  stop_name: string | null;
  monthly_fee: number | null;
  fee_status: string | null;
  transport_routes: {
    route_no: string;
    route_name: string | null;
    morning_departure: string | null;
    evening_departure: string | null;
    driver_phone: string | null;
  } | null;
}

interface HostelAllotmentRow {
  id: string;
  join_date: string | null;
  monthly_fee: number | null;
  fee_status: string | null;
  is_active: boolean | null;
  hostel_rooms: { room_no: string; block: string | null; floor: number | null; type: string } | null;
}

interface CertificateRequestRow {
  id: string;
  cert_type: string;
  purpose: string | null;
  requested_on: string | null;
  issued_on: string | null;
  status: string;
}

interface HomeworkRow {
  id: string;
  title: string;
  due_date: string;
  description: string | null;
  subjects: { name: string | null } | null;
  staff_members: { full_name: string | null } | null;
}

interface HomeworkSubmissionRow {
  homework_id: string;
}

interface PtmBookingRow {
  id: string;
  slot_time: string;
  status: string;
  ptm_sessions: { date: string; start_time: string; staff_members: { full_name: string | null } | null } | null;
}

interface StudentDocumentRow {
  id: string;
  category: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

interface StudentNoteRow {
  id: string;
  category: string;
  note: string;
  created_at: string;
  profiles: { full_name: string | null } | null;
}

interface AcademicHistoryRow {
  id: string;
  outcome: string;
  recorded_at: string;
  roll_no: string | null;
  academic_years: { name: string } | null;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
}

interface SiblingLinkRow {
  student_id: string;
  students: {
    id: string;
    full_name: string;
    roll_no: string | null;
    photo_url: string | null;
    sections: { name: string | null; grades: { level: number | null } | null } | null;
  } | null;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const schoolId = await getCurrentSchoolIdOrThrow();

  const [
    { data: studentRow },
    { data: examRows },
    { data: attRows },
    { data: feeRows },
    { data: leaveRows },
    { data: transportRows },
    { data: hostelRows },
    { data: certRows },
    { data: documentRows },
    { data: noteRows },
    { data: historyRows },
    { data: ptmRows },
    { data: parentLinkRows },
  ] = await Promise.all([
    supabaseAdmin
      .from("students")
      .select(`
        id, full_name, roll_no, admission_no, dob, gender, address, phone, photo_url,
        attendance_pct, fee_status, status, joined_date, section_id, academic_year_id, profile_id,
        blood_group, religion, caste, mother_tongue, language,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
        medical_conditions, allergies,
        sections ( name, grades ( level ) ),
        student_parents ( relationship, parents ( full_name, phone, email, occupation ) )
      `)
      .eq("school_id", schoolId)
      .eq("id", id)
      .maybeSingle(),

    supabaseAdmin
      .from("exam_results")
      .select(`
        marks_obtained, max_marks, grade, is_absent,
        subjects ( name ),
        exams ( name, start_date )
      `)
      .eq("school_id", schoolId)
      .eq("student_id", id)
      .order("created_at", { ascending: false }),

    supabaseAdmin
      .from("student_attendance")
      .select("date, status")
      .eq("school_id", schoolId)
      .eq("student_id", id)
      .order("date"),

    supabaseAdmin
      .from("fee_payments")
      .select("month_str, category, amount_due, amount_paid, status, paid_date, receipt_no")
      .eq("school_id", schoolId)
      .eq("student_id", id)
      .order("paid_date", { ascending: false, nullsFirst: false }),

    supabaseAdmin
      .from("student_leave_requests")
      .select(`
        id, leave_type, from_date, to_date, days, reason, status, applied_on,
        approver:staff_members!student_leave_requests_approved_by_fkey ( full_name )
      `)
      .eq("school_id", schoolId)
      .eq("student_id", id)
      .order("applied_on", { ascending: false }),

    supabaseAdmin
      .from("student_transport")
      .select(`
        id, stop_name, monthly_fee, fee_status,
        transport_routes ( route_no, route_name, morning_departure, evening_departure, driver_phone )
      `)
      .eq("school_id", schoolId)
      .eq("student_id", id)
      .order("created_at", { ascending: false }),

    supabaseAdmin
      .from("hostel_allotments")
      .select(`
        id, join_date, monthly_fee, fee_status, is_active,
        hostel_rooms ( room_no, block, floor, type )
      `)
      .eq("school_id", schoolId)
      .eq("student_id", id)
      .order("created_at", { ascending: false }),

    supabaseAdmin
      .from("certificate_requests")
      .select("id, cert_type, purpose, requested_on, issued_on, status")
      .eq("school_id", schoolId)
      .eq("student_id", id)
      .order("requested_on", { ascending: false }),

    supabaseAdmin
      .from("student_documents")
      .select("id, category, file_name, file_url, uploaded_at")
      .eq("school_id", schoolId)
      .eq("student_id", id)
      .order("uploaded_at", { ascending: false }),

    supabaseAdmin
      .from("student_notes")
      .select("id, category, note, created_at, profiles ( full_name )")
      .eq("school_id", schoolId)
      .eq("student_id", id)
      .order("created_at", { ascending: false }),

    supabaseAdmin
      .from("student_academic_history")
      .select("id, outcome, recorded_at, roll_no, academic_years ( name ), sections ( name, grades ( level ) )")
      .eq("school_id", schoolId)
      .eq("student_id", id)
      .order("recorded_at", { ascending: false }),

    supabaseAdmin
      .from("ptm_bookings")
      .select("id, slot_time, status, ptm_sessions ( date, start_time, staff_members ( full_name ) )")
      .eq("student_id", id)
      .order("id", { ascending: false }),

    supabaseAdmin
      .from("student_parents")
      .select("parent_id")
      .eq("student_id", id),
  ]);

  if (!studentRow) notFound();

  const s = studentRow as unknown as StudentDetailRow;
  const parentIds = ((parentLinkRows ?? []) as { parent_id: string }[]).map((p) => p.parent_id);

  const [
    { data: periodRows }, { data: slotRows }, { data: issueRows },
    { data: homeworkRows }, { data: submissionRows }, { data: siblingLinkRows },
  ] = await Promise.all([
    supabaseAdmin
      .from("timetable_periods")
      .select("number, start_time, end_time, is_break, break_label")
      .eq("school_id", schoolId)
      .order("start_time"),

    s.section_id
      ? supabaseAdmin
          .from("timetable_slots")
          .select(`
            day_of_week, period_number, room,
            subjects ( name, code ),
            profiles ( full_name )
          `)
          .eq("school_id", schoolId)
          .eq("section_id", s.section_id)
          .eq("academic_year_id", s.academic_year_id ?? "")
      : Promise.resolve({ data: [] as TimetableSlotRow[] }),

    s.profile_id
      ? supabaseAdmin
          .from("book_issues")
          .select("issued_date, due_date, returned_date, library_books ( title, author, category )")
          .eq("school_id", schoolId)
          .eq("borrower_id", s.profile_id)
          .eq("borrower_type", "student")
          .order("issued_date", { ascending: false })
      : Promise.resolve({ data: [] as BookIssueRow[] }),

    s.section_id
      ? supabaseAdmin
          .from("homework")
          .select("id, title, due_date, description, subjects ( name ), staff_members ( full_name )")
          .eq("school_id", schoolId)
          .eq("section_id", s.section_id)
          .order("due_date", { ascending: false })
      : Promise.resolve({ data: [] as HomeworkRow[] }),

    supabaseAdmin
      .from("homework_submissions")
      .select("homework_id")
      .eq("student_id", id),

    parentIds.length > 0
      ? supabaseAdmin
          .from("student_parents")
          .select("student_id, students ( id, full_name, roll_no, photo_url, sections ( name, grades ( level ) ) )")
          .in("parent_id", parentIds)
          .neq("student_id", id)
      : Promise.resolve({ data: [] as SiblingLinkRow[] }),
  ]);

  const student = {
    id: s.id,
    name: s.full_name,
    rollNo: s.roll_no ?? "",
    admissionNo: s.admission_no ?? "—",
    classNum: String(s.sections?.grades?.level ?? "—"),
    section: s.sections?.name ?? "—",
    phone: s.phone ?? "—",
    dob: formatDate(s.dob),
    gender: s.gender ?? "—",
    address: s.address ?? "—",
    bloodGroup: s.blood_group ?? "—",
    religion: s.religion ?? "—",
    caste: s.caste ?? "—",
    motherTongue: s.mother_tongue ?? "—",
    language: s.language ?? "—",
    emergencyContactName: s.emergency_contact_name ?? "—",
    emergencyContactPhone: s.emergency_contact_phone ?? "—",
    emergencyContactRelation: s.emergency_contact_relation ?? "—",
    medicalConditions: s.medical_conditions ?? "—",
    allergies: s.allergies ?? "—",
    joinedDate: formatDate(s.joined_date),
    active: s.status === "active",
    feeStatus: s.fee_status ?? "overdue",
    photoUrl: s.photo_url ?? null,
  };

  const guardians: Guardian[] = (s.student_parents ?? [])
    .map((sp) => ({
      relationship: sp.relationship ?? "Guardian",
      name: sp.parents?.full_name ?? "—",
      phone: sp.parents?.phone ?? "—",
      email: sp.parents?.email ?? "—",
      occupation: sp.parents?.occupation ?? "—",
    }));

  // ── Exam results ──────────────────────────────────────────────────────────
  const exams: ExamRow[] = ((examRows ?? []) as unknown as StudentExamResultDetailRow[]).map((r) => ({
    subject: r.subjects?.name ?? "—",
    examName: r.exams?.name ?? "—",
    marks: Number(r.marks_obtained ?? 0),
    max: Number(r.max_marks ?? 100),
    grade: r.grade,
    isAbsent: Boolean(r.is_absent),
  }));
  const avgScore = exams.length
    ? Math.round(exams.reduce((sum, e) => sum + (e.max ? (e.marks / e.max) * 100 : 0), 0) / exams.length)
    : null;

  // ── Attendance, grouped by month ──────────────────────────────────────────
  const attByMonth = new Map<string, { present: number; total: number }>();
  for (const r of (attRows ?? []) as unknown as StudentAttendanceDetailRow[]) {
    const label = monthLabel(r.date);
    const entry = attByMonth.get(label) ?? { present: 0, total: 0 };
    entry.total += 1;
    if (r.status !== "absent") entry.present += 1;
    attByMonth.set(label, entry);
  }
  const monthly = Array.from(attByMonth.entries()).map(([month, v]) => ({ month, ...v }));
  const totalPresent = monthly.reduce((sum, m) => sum + m.present, 0);
  const totalDays    = monthly.reduce((sum, m) => sum + m.total, 0);
  const overallAtt   = totalDays ? Math.round((totalPresent / totalDays) * 100) : Math.round(Number(s.attendance_pct ?? 0));
  const chartMax     = Math.max(1, ...monthly.map((m) => m.total));

  // ── Fees ──────────────────────────────────────────────────────────────────
  const fees: FeeRow[] = ((feeRows ?? []) as unknown as StudentFeePaymentDetailRow[]).map((f) => ({
    date: formatDate(f.paid_date),
    description: `${f.category} — ${f.month_str}`,
    amountDue: Number(f.amount_due ?? 0),
    amountPaid: Number(f.amount_paid ?? 0),
    status: f.status ?? "overdue",
    receiptNo: f.receipt_no,
  }));
  const totalFees = fees.reduce((sum, f) => sum + f.amountDue, 0);
  const paidFees  = fees.reduce((sum, f) => sum + f.amountPaid, 0);

  // ── Timetable ─────────────────────────────────────────────────────────────
  const rowItems: RowItem[] = ((periodRows ?? []) as unknown as TimetablePeriodRow[])
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .map((p) =>
      p.is_break
        ? { type: "break" as const, label: p.break_label ?? "Break", time: `${p.start_time.slice(0, 5)} – ${p.end_time.slice(0, 5)}` }
        : { type: "period" as const, period: { num: p.number, start: p.start_time.slice(0, 5), end: p.end_time.slice(0, 5) } as Period }
    );

  const tt: ClassTimetable = DAYS.reduce((acc, d) => ({ ...acc, [d]: {} }), {} as ClassTimetable);
  for (const slot of (slotRows ?? []) as unknown as TimetableSlotRow[]) {
    const day: Day | undefined = DAYS[slot.day_of_week - 1];
    if (!day) continue;
    const subjectName = slot.subjects?.name ?? "Subject";
    const subjectCode = slot.subjects?.code ?? subjectName.slice(0, 3).toUpperCase();
    const entry: Slot = {
      subject: subjectCode, name: subjectName,
      teacher: slot.profiles?.full_name ?? "—", room: slot.room ?? "—",
    };
    tt[day][slot.period_number] = entry;
  }

  // ── Library ───────────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const library: LibraryIssueRow[] = ((issueRows ?? []) as unknown as BookIssueRow[]).map((r) => ({
    title: r.library_books?.title ?? "—",
    author: r.library_books?.author ?? "—",
    category: r.library_books?.category ?? "—",
    issuedDate: formatDate(r.issued_date),
    dueDate: formatDate(r.due_date),
    returnedDate: r.returned_date ? formatDate(r.returned_date) : null,
    overdue: !r.returned_date && r.due_date < today,
  }));

  // ── Leave requests ────────────────────────────────────────────────────────
  const leaves: LeaveRow[] = ((leaveRows ?? []) as unknown as LeaveRequestRow[]).map((l) => ({
    id: l.id,
    leaveType: (l.leave_type ?? "casual") as LeaveType,
    from: l.from_date ?? "",
    to: l.to_date ?? "",
    days: l.days ?? 1,
    reason: l.reason ?? "",
    status: (l.status ?? "pending") as LeaveStatus,
    appliedOn: l.applied_on ?? "",
    approvedBy: l.approver?.full_name ?? undefined,
  }));

  // ── Transport ─────────────────────────────────────────────────────────────
  const transportRow = ((transportRows ?? []) as unknown as StudentTransportRow[])[0] ?? null;
  const transport = transportRow ? {
    routeNo: transportRow.transport_routes?.route_no ?? "—",
    routeName: transportRow.transport_routes?.route_name ?? null,
    stopName: transportRow.stop_name ?? "—",
    morningDeparture: transportRow.transport_routes?.morning_departure ?? null,
    eveningDeparture: transportRow.transport_routes?.evening_departure ?? null,
    driverPhone: transportRow.transport_routes?.driver_phone ?? null,
    monthlyFee: Number(transportRow.monthly_fee ?? 0),
    feeStatus: transportRow.fee_status ?? "overdue",
  } : null;

  // ── Hostel ────────────────────────────────────────────────────────────────
  const hostelRow = ((hostelRows ?? []) as unknown as HostelAllotmentRow[]).find((h) => h.is_active) ?? ((hostelRows ?? []) as unknown as HostelAllotmentRow[])[0] ?? null;
  const hostel = hostelRow ? {
    roomNo: hostelRow.hostel_rooms?.room_no ?? "—",
    block: hostelRow.hostel_rooms?.block ?? null,
    floor: hostelRow.hostel_rooms?.floor ?? null,
    type: hostelRow.hostel_rooms?.type ?? "—",
    joinDate: hostelRow.join_date ? formatDate(hostelRow.join_date) : "—",
    monthlyFee: Number(hostelRow.monthly_fee ?? 0),
    feeStatus: hostelRow.fee_status ?? "overdue",
    isActive: Boolean(hostelRow.is_active),
  } : null;

  // ── Certificates ──────────────────────────────────────────────────────────
  const certificates = ((certRows ?? []) as unknown as CertificateRequestRow[]).map((c) => ({
    id: c.id,
    certType: c.cert_type,
    purpose: c.purpose ?? "—",
    requestedOn: c.requested_on ? formatDate(c.requested_on) : "—",
    issuedOn: c.issued_on ? formatDate(c.issued_on) : null,
    status: c.status,
  }));

  // ── Homework ──────────────────────────────────────────────────────────────
  const submittedHomeworkIds = new Set(((submissionRows ?? []) as unknown as HomeworkSubmissionRow[]).map((r) => r.homework_id));
  const homework = ((homeworkRows ?? []) as unknown as HomeworkRow[]).map((h) => ({
    id: h.id,
    title: h.title,
    subject: h.subjects?.name ?? "—",
    teacher: h.staff_members?.full_name ?? "—",
    dueDate: h.due_date,
    description: h.description ?? "",
    submitted: submittedHomeworkIds.has(h.id),
  }));

  // ── Parent-teacher meetings ───────────────────────────────────────────────
  const ptm = ((ptmRows ?? []) as unknown as PtmBookingRow[]).map((b) => ({
    id: b.id,
    date: b.ptm_sessions?.date ? formatDate(b.ptm_sessions.date) : "—",
    time: b.slot_time?.slice(0, 5) ?? "—",
    teacher: b.ptm_sessions?.staff_members?.full_name ?? "—",
    status: b.status,
  }));

  // ── Documents ─────────────────────────────────────────────────────────────
  const documents = ((documentRows ?? []) as unknown as StudentDocumentRow[]).map((d) => ({
    id: d.id,
    category: d.category,
    fileName: d.file_name,
    fileUrl: d.file_url,
    uploadedAt: formatDate(d.uploaded_at),
  }));

  // ── Notes ─────────────────────────────────────────────────────────────────
  const notes = ((noteRows ?? []) as unknown as StudentNoteRow[]).map((n) => ({
    id: n.id,
    category: n.category,
    note: n.note,
    createdAt: formatDate(n.created_at),
    author: n.profiles?.full_name ?? "—",
  }));

  // ── Academic history ──────────────────────────────────────────────────────
  const academicHistory = ((historyRows ?? []) as unknown as AcademicHistoryRow[]).map((h) => ({
    id: h.id,
    year: h.academic_years?.name ?? "—",
    classLabel: h.sections ? `${h.sections.grades?.level ?? "—"}–${h.sections.name ?? "—"}` : "—",
    rollNo: h.roll_no ?? "—",
    outcome: h.outcome,
    recordedAt: formatDate(h.recorded_at),
  }));

  // ── Siblings ──────────────────────────────────────────────────────────────
  const siblingsById = new Map<string, NonNullable<SiblingLinkRow["students"]>>();
  for (const r of (siblingLinkRows ?? []) as unknown as SiblingLinkRow[]) {
    if (r.students) siblingsById.set(r.students.id, r.students);
  }
  const siblings = Array.from(siblingsById.values())
    .map((st) => ({
      id: st.id,
      name: st.full_name,
      rollNo: st.roll_no ?? "—",
      photoUrl: st.photo_url,
      classLabel: st.sections ? `${st.sections.grades?.level ?? "—"}–${st.sections.name ?? "—"}` : "—",
    }));

  const ac = attColor(overallAtt);

  return (
    <div className="w-full px-6 py-6 space-y-6">

      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/students"
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Students
        </Link>
        <div className="flex gap-2">
          <StudentReportButton
            data={{
              name: student.name,
              rollNo: student.rollNo,
              admissionNo: student.admissionNo,
              classLabel: `${student.classNum}-${student.section}`,
              dob: student.dob,
              gender: student.gender,
              phone: student.phone,
              address: student.address,
              joinedDate: student.joinedDate,
              overallAtt,
              totalPresent,
              totalDays,
              avgScore,
              totalFees,
              paidFees,
              guardians,
              exams,
              fees,
            }}
          />
          <FancyButton href={`/dashboard/students/${id}/edit`} size="xs">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </FancyButton>
        </div>
      </div>

      {/* Identity + sidebar (left)  ·  Quick stats + tabs (right) — one grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-6">
            <div className="flex flex-col items-start gap-4">
              {student.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={student.photoUrl} alt={student.name} className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
              ) : (
                <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white ${avatarColor(student.id)}`}>
                  {initials(student.name)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50">{student.name}</h2>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${student.active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"}`}>
                    {student.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex flex-col gap-1 text-sm text-gray-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> Roll No: <span className="font-medium text-gray-700 dark:text-zinc-300">{student.rollNo}</span></span>
                  <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> Class <span className="font-medium text-gray-700 dark:text-zinc-300">{student.classNum}–{student.section}</span></span>
                  <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> <span className="font-medium text-gray-700 dark:text-zinc-300">{student.phone}</span></span>
                  <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> DOB: <span className="font-medium text-gray-700 dark:text-zinc-300">{student.dob}</span></span>
                </div>
              </div>
            </div>
          </div>

          <StudentSidebar
            personal={{
              admissionNo: student.admissionNo,
              dob: student.dob,
              gender: student.gender,
              address: student.address,
              bloodGroup: student.bloodGroup,
              religion: student.religion,
              caste: student.caste,
              motherTongue: student.motherTongue,
              language: student.language,
              emergencyContactName: student.emergencyContactName,
              emergencyContactPhone: student.emergencyContactPhone,
              emergencyContactRelation: student.emergencyContactRelation,
              medicalConditions: student.medicalConditions,
              allergies: student.allergies,
            }}
            studentPhone={student.phone}
            siblings={siblings}
          />
        </div>

        <div className="lg:col-span-2 space-y-5">
          <StudentQuickStats
            overallAtt={overallAtt}
            totalPresent={totalPresent}
            totalDays={totalDays}
            attColorText={ac.text}
            avgScore={avgScore}
            examCount={exams.length}
            totalFees={totalFees}
            paidFees={paidFees}
            joinedDate={student.joinedDate}
            rollNo={student.rollNo}
          />

          <StudentDetailTabs
            studentId={student.id}
            studentName={student.name}
            classLabel={`${student.classNum}-${student.section}`}
            guardians={guardians}
            overallAtt={overallAtt}
            totalPresent={totalPresent}
            totalDays={totalDays}
            monthly={monthly}
            chartMax={chartMax}
            attColorText={ac.text}
            avgScore={avgScore}
            exams={exams}
            totalFees={totalFees}
            paidFees={paidFees}
            fees={fees}
            timetable={{ tt, rowItems }}
            library={library}
            leaves={leaves}
            transport={transport}
            hostel={hostel}
            certificates={certificates}
            homework={homework}
            ptm={ptm}
            documents={documents}
            notes={notes}
            academicHistory={academicHistory}
          />
        </div>
      </div>
    </div>
  );
}
