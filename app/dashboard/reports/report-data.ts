"use server";

import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";

export interface ReportTable {
  columns: string[];
  rows: (string | number)[][];
}

function pct(num: number, den: number) {
  return den ? Math.round((num / den) * 100) : 0;
}

function inRange(dateStr: string | null | undefined, from: string, to: string) {
  return !!dateStr && dateStr >= from && dateStr <= to;
}

function classLabel(level: number | null | undefined, section: string | null | undefined) {
  return level ? `${level}-${section ?? ""}` : (section ?? "—");
}

// ── Academic ─────────────────────────────────────────────────────────────────

interface ExamResultRow {
  student_id: string;
  marks_obtained: number | null;
  max_marks: number | null;
  is_absent: boolean | null;
  subjects: { name: string | null } | null;
  exams: { name: string | null; start_date: string | null } | null;
  students: { full_name: string | null; roll_no: string | null; sections: { name: string | null; grades: { level: number | null } | null } | null } | null;
}

async function fetchExamResults(schoolId: string, from: string, to: string): Promise<ExamResultRow[]> {
  const { data } = await supabaseAdmin
    .from("exam_results")
    .select(`
      student_id, marks_obtained, max_marks, is_absent,
      subjects ( name ),
      exams ( name, start_date ),
      students ( full_name, roll_no, sections ( name, grades ( level ) ) )
    `)
    .eq("school_id", schoolId);
  return ((data ?? []) as unknown as ExamResultRow[]).filter((r) => inRange(r.exams?.start_date, from, to));
}

async function classWisePerformance(schoolId: string, from: string, to: string): Promise<ReportTable> {
  const rows = await fetchExamResults(schoolId, from, to);
  const byClass = new Map<string, { total: number; max: number; pass: number; count: number; students: Set<string> }>();
  for (const r of rows) {
    if (r.is_absent) continue;
    const key = classLabel(r.students?.sections?.grades?.level, r.students?.sections?.name);
    const bucket = byClass.get(key) ?? { total: 0, max: 0, pass: 0, count: 0, students: new Set() };
    const marks = Number(r.marks_obtained ?? 0);
    const max = Number(r.max_marks ?? 0);
    bucket.total += marks;
    bucket.max += max;
    bucket.count += 1;
    if (max && marks / max >= 0.33) bucket.pass += 1;
    if (r.student_id) bucket.students.add(r.student_id);
    byClass.set(key, bucket);
  }
  const out = Array.from(byClass.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  return {
    columns: ["Class", "Students", "Avg %", "Pass Rate %"],
    rows: out.map(([cls, b]) => [cls, b.students.size, pct(b.total, b.max), pct(b.pass, b.count)]),
  };
}

async function subjectWisePerformance(schoolId: string, from: string, to: string): Promise<ReportTable> {
  const rows = await fetchExamResults(schoolId, from, to);
  const bySubject = new Map<string, { total: number; max: number; count: number; best: number; worst: number }>();
  for (const r of rows) {
    if (r.is_absent) continue;
    const subject = r.subjects?.name ?? "Subject";
    const max = Number(r.max_marks ?? 0);
    const marks = Number(r.marks_obtained ?? 0);
    const scorePct = max ? (marks / max) * 100 : 0;
    const bucket = bySubject.get(subject) ?? { total: 0, max: 0, count: 0, best: 0, worst: 100 };
    bucket.total += marks;
    bucket.max += max;
    bucket.count += 1;
    bucket.best = Math.max(bucket.best, scorePct);
    bucket.worst = Math.min(bucket.worst, scorePct);
    bySubject.set(subject, bucket);
  }
  const out = Array.from(bySubject.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  return {
    columns: ["Subject", "Students Assessed", "Avg %", "Highest %", "Lowest %"],
    rows: out.map(([subject, b]) => [subject, b.count, pct(b.total, b.max), Math.round(b.best), Math.round(b.worst)]),
  };
}

async function toppersList(schoolId: string, from: string, to: string): Promise<ReportTable> {
  const rows = await fetchExamResults(schoolId, from, to);
  const byStudent = new Map<string, { name: string; roll: string; cls: string; total: number; max: number }>();
  for (const r of rows) {
    if (r.is_absent) continue;
    const bucket = byStudent.get(r.student_id) ?? {
      name: r.students?.full_name ?? "Student",
      roll: r.students?.roll_no ?? "",
      cls: classLabel(r.students?.sections?.grades?.level, r.students?.sections?.name),
      total: 0, max: 0,
    };
    bucket.total += Number(r.marks_obtained ?? 0);
    bucket.max += Number(r.max_marks ?? 0);
    byStudent.set(r.student_id, bucket);
  }
  const ranked = Array.from(byStudent.values())
    .map((b) => ({ ...b, pct: pct(b.total, b.max) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 10);
  return {
    columns: ["Rank", "Student", "Roll No", "Class", "Total %"],
    rows: ranked.map((b, i) => [i + 1, b.name, b.roll, b.cls, b.pct]),
  };
}

async function passFailAnalysis(schoolId: string, from: string, to: string): Promise<ReportTable> {
  const rows = await fetchExamResults(schoolId, from, to);
  const bySubject = new Map<string, { pass: number; fail: number }>();
  for (const r of rows) {
    const subject = r.subjects?.name ?? "Subject";
    const bucket = bySubject.get(subject) ?? { pass: 0, fail: 0 };
    const max = Number(r.max_marks ?? 0);
    const marks = Number(r.marks_obtained ?? 0);
    if (r.is_absent || (max && marks / max < 0.33)) bucket.fail += 1;
    else bucket.pass += 1;
    bySubject.set(subject, bucket);
  }
  const out = Array.from(bySubject.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  return {
    columns: ["Subject", "Passed", "Failed", "Pass Rate %"],
    rows: out.map(([subject, b]) => [subject, b.pass, b.fail, pct(b.pass, b.pass + b.fail)]),
  };
}

async function studentProgressReport(schoolId: string, from: string, to: string): Promise<ReportTable> {
  const rows = await fetchExamResults(schoolId, from, to);
  const byStudentExam = new Map<string, { name: string; roll: string; exam: string; date: string; total: number; max: number }>();
  for (const r of rows) {
    if (r.is_absent) continue;
    const examKey = `${r.student_id}::${r.exams?.name ?? ""}`;
    const bucket = byStudentExam.get(examKey) ?? {
      name: r.students?.full_name ?? "Student",
      roll: r.students?.roll_no ?? "",
      exam: r.exams?.name ?? "Exam",
      date: r.exams?.start_date ?? "",
      total: 0, max: 0,
    };
    bucket.total += Number(r.marks_obtained ?? 0);
    bucket.max += Number(r.max_marks ?? 0);
    byStudentExam.set(examKey, bucket);
  }
  const out = Array.from(byStudentExam.values()).sort((a, b) => a.name.localeCompare(b.name) || (a.date > b.date ? 1 : -1));
  return {
    columns: ["Student", "Roll No", "Exam", "Date", "Total %"],
    rows: out.map((b) => [b.name, b.roll, b.exam, b.date, pct(b.total, b.max)]),
  };
}

// ── Attendance ───────────────────────────────────────────────────────────────

interface AttendanceRow {
  date: string;
  status: string | null;
  students: { full_name: string | null; roll_no: string | null; sections: { name: string | null; grades: { level: number | null } | null } | null } | null;
}

async function fetchStudentAttendance(schoolId: string, from: string, to: string): Promise<AttendanceRow[]> {
  const { data } = await supabaseAdmin
    .from("student_attendance")
    .select(`date, status, students ( full_name, roll_no, sections ( name, grades ( level ) ) )`)
    .eq("school_id", schoolId)
    .gte("date", from)
    .lte("date", to);
  return (data ?? []) as unknown as AttendanceRow[];
}

async function dailyAttendanceSummary(schoolId: string, from: string, to: string): Promise<ReportTable> {
  const rows = await fetchStudentAttendance(schoolId, from, to);
  const byDate = new Map<string, { present: number; absent: number; late: number }>();
  for (const r of rows) {
    const bucket = byDate.get(r.date) ?? { present: 0, absent: 0, late: 0 };
    if (r.status === "present") bucket.present += 1;
    else if (r.status === "absent") bucket.absent += 1;
    else if (r.status === "late") bucket.late += 1;
    byDate.set(r.date, bucket);
  }
  const out = Array.from(byDate.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  return {
    columns: ["Date", "Present", "Absent", "Late", "Total", "Present %"],
    rows: out.map(([date, b]) => {
      const total = b.present + b.absent + b.late;
      return [date, b.present, b.absent, b.late, total, pct(b.present, total)];
    }),
  };
}

async function monthlyAttendanceReport(schoolId: string, from: string, to: string): Promise<ReportTable> {
  const rows = await fetchStudentAttendance(schoolId, from, to);
  const byStudent = new Map<string, { name: string; roll: string; cls: string; present: number; total: number }>();
  for (const r of rows) {
    const id = `${r.students?.roll_no ?? ""}::${r.students?.full_name ?? ""}`;
    const bucket = byStudent.get(id) ?? {
      name: r.students?.full_name ?? "Student",
      roll: r.students?.roll_no ?? "",
      cls: classLabel(r.students?.sections?.grades?.level, r.students?.sections?.name),
      present: 0, total: 0,
    };
    bucket.total += 1;
    if (r.status === "present" || r.status === "late") bucket.present += 1;
    byStudent.set(id, bucket);
  }
  const out = Array.from(byStudent.values()).sort((a, b) => a.name.localeCompare(b.name));
  return {
    columns: ["Student", "Roll No", "Class", "Present Days", "Total Days", "Attendance %"],
    rows: out.map((b) => [b.name, b.roll, b.cls, b.present, b.total, pct(b.present, b.total)]),
  };
}

async function classWiseAttendanceSummary(schoolId: string, from: string, to: string): Promise<ReportTable> {
  const rows = await fetchStudentAttendance(schoolId, from, to);
  const byClass = new Map<string, { present: number; absent: number; late: number }>();
  for (const r of rows) {
    const key = classLabel(r.students?.sections?.grades?.level, r.students?.sections?.name);
    const bucket = byClass.get(key) ?? { present: 0, absent: 0, late: 0 };
    if (r.status === "present") bucket.present += 1;
    else if (r.status === "absent") bucket.absent += 1;
    else if (r.status === "late") bucket.late += 1;
    byClass.set(key, bucket);
  }
  const out = Array.from(byClass.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  return {
    columns: ["Class", "Present", "Absent", "Late", "Attendance %"],
    rows: out.map(([cls, b]) => [cls, b.present, b.absent, b.late, pct(b.present, b.present + b.absent + b.late)]),
  };
}

async function chronicAbsenteeismReport(schoolId: string, from: string, to: string): Promise<ReportTable> {
  const monthly = await monthlyAttendanceReport(schoolId, from, to);
  const rows = monthly.rows.filter((r) => Number(r[5]) < 75);
  return { columns: monthly.columns, rows };
}

async function staffAttendanceReport(schoolId: string, from: string, to: string): Promise<ReportTable> {
  interface StaffAttendanceRow {
    status: string | null;
    staff_members: { full_name: string | null; designation: string | null } | null;
  }
  const { data } = await supabaseAdmin
    .from("staff_attendance")
    .select(`status, staff_members ( full_name, designation )`)
    .eq("school_id", schoolId)
    .gte("date", from)
    .lte("date", to);
  const byStaff = new Map<string, { name: string; designation: string; present: number; absent: number; late: number }>();
  for (const r of (data ?? []) as unknown as StaffAttendanceRow[]) {
    const name = r.staff_members?.full_name ?? "Staff";
    const bucket = byStaff.get(name) ?? { name, designation: r.staff_members?.designation ?? "", present: 0, absent: 0, late: 0 };
    if (r.status === "present") bucket.present += 1;
    else if (r.status === "absent") bucket.absent += 1;
    else if (r.status === "late") bucket.late += 1;
    byStaff.set(name, bucket);
  }
  const out = Array.from(byStaff.values()).sort((a, b) => a.name.localeCompare(b.name));
  return {
    columns: ["Staff", "Designation", "Present", "Absent", "Late"],
    rows: out.map((b) => [b.name, b.designation, b.present, b.absent, b.late]),
  };
}

// ── Finance ──────────────────────────────────────────────────────────────────

interface FeePaymentRow {
  student_id: string;
  category: string | null;
  amount_due: number | null;
  amount_paid: number | null;
  status: string | null;
  paid_date: string | null;
  payment_mode: string | null;
  receipt_no: string | null;
  students: { full_name: string | null; roll_no: string | null; sections: { name: string | null; grades: { level: number | null } | null } | null } | null;
}

async function fetchFeePayments(schoolId: string): Promise<FeePaymentRow[]> {
  const { data } = await supabaseAdmin
    .from("fee_payments")
    .select(`
      student_id, category, amount_due, amount_paid, status, paid_date, payment_mode, receipt_no,
      students ( full_name, roll_no, sections ( name, grades ( level ) ) )
    `)
    .eq("school_id", schoolId);
  return (data ?? []) as unknown as FeePaymentRow[];
}

async function feeCollectionSummary(schoolId: string, from: string, to: string): Promise<ReportTable> {
  const rows = (await fetchFeePayments(schoolId)).filter((r) => inRange(r.paid_date, from, to));
  const byClass = new Map<string, { collected: number; mode: Map<string, number> }>();
  for (const r of rows) {
    const key = classLabel(r.students?.sections?.grades?.level, r.students?.sections?.name);
    const bucket = byClass.get(key) ?? { collected: 0, mode: new Map<string, number>() };
    bucket.collected += Number(r.amount_paid ?? 0);
    const mode = r.payment_mode ?? "other";
    bucket.mode.set(mode, (bucket.mode.get(mode) ?? 0) + Number(r.amount_paid ?? 0));
    byClass.set(key, bucket);
  }
  const out = Array.from(byClass.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  return {
    columns: ["Class", "Total Collected", "Top Payment Mode"],
    rows: out.map(([cls, b]) => {
      const top = Array.from(b.mode.entries()).sort((a, c) => c[1] - a[1])[0];
      return [cls, b.collected, top ? `${top[0]} (₹${top[1]})` : "—"];
    }),
  };
}

async function outstandingFeesReport(schoolId: string): Promise<ReportTable> {
  const rows = await fetchFeePayments(schoolId);
  const byStudent = new Map<string, { name: string; roll: string; cls: string; due: number; paid: number }>();
  for (const r of rows) {
    const bucket = byStudent.get(r.student_id) ?? {
      name: r.students?.full_name ?? "Student",
      roll: r.students?.roll_no ?? "",
      cls: classLabel(r.students?.sections?.grades?.level, r.students?.sections?.name),
      due: 0, paid: 0,
    };
    bucket.due += Number(r.amount_due ?? 0);
    bucket.paid += Number(r.amount_paid ?? 0);
    byStudent.set(r.student_id, bucket);
  }

  const studentIds = Array.from(byStudent.keys());
  const parentByStudent = new Map<string, { name: string; phone: string }>();
  if (studentIds.length) {
    const { data: parentRows } = await supabaseAdmin
      .from("student_parents")
      .select("student_id, is_primary, parents ( full_name, phone )")
      .in("student_id", studentIds);
    for (const p of (parentRows ?? []) as unknown as { student_id: string; is_primary: boolean | null; parents: { full_name: string | null; phone: string | null } | null }[]) {
      if (!parentByStudent.has(p.student_id) || p.is_primary) {
        parentByStudent.set(p.student_id, { name: p.parents?.full_name ?? "—", phone: p.parents?.phone ?? "—" });
      }
    }
  }

  const out = Array.from(byStudent.entries())
    .map(([id, b]) => ({ id, ...b, outstanding: Math.max(b.due - b.paid, 0) }))
    .filter((b) => b.outstanding > 0)
    .sort((a, b) => b.outstanding - a.outstanding);

  return {
    columns: ["Student", "Roll No", "Class", "Outstanding", "Parent", "Parent Phone"],
    rows: out.map((b) => [b.name, b.roll, b.cls, b.outstanding, parentByStudent.get(b.id)?.name ?? "—", parentByStudent.get(b.id)?.phone ?? "—"]),
  };
}

async function expenseSummary(schoolId: string, from: string, to: string): Promise<ReportTable> {
  interface ExpenseRow { category: string | null; amount: number | null; date: string | null }
  const [{ data: expenseRows }, { data: budgetRows }] = await Promise.all([
    supabaseAdmin.from("expenses").select("category, amount, date").eq("school_id", schoolId).gte("date", from).lte("date", to),
    supabaseAdmin.from("expense_budgets").select("category, monthly_amount").eq("school_id", schoolId),
  ]);
  const byCategory = new Map<string, number>();
  for (const r of (expenseRows ?? []) as unknown as ExpenseRow[]) {
    const cat = r.category ?? "Other";
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + Number(r.amount ?? 0));
  }
  const budgetByCategory = new Map<string, number>();
  for (const r of (budgetRows ?? []) as unknown as { category: string | null; monthly_amount: number | null }[]) {
    budgetByCategory.set(r.category ?? "Other", Number(r.monthly_amount ?? 0));
  }
  const categories = new Set([...byCategory.keys(), ...budgetByCategory.keys()]);
  const out = Array.from(categories).sort();
  return {
    columns: ["Category", "Actual Spend", "Monthly Budget", "Variance"],
    rows: out.map((cat) => {
      const actual = byCategory.get(cat) ?? 0;
      const budget = budgetByCategory.get(cat) ?? 0;
      return [cat, actual, budget, actual - budget];
    }),
  };
}

async function payrollSummary(schoolId: string, from: string, to: string): Promise<ReportTable> {
  interface PayrollRow {
    month_str: string | null; gross: number | null; net: number | null; status: string | null;
    staff_members: { full_name: string | null; designation: string | null } | null;
  }
  const { data } = await supabaseAdmin
    .from("payroll_records")
    .select(`month_str, gross, net, status, staff_members ( full_name, designation )`)
    .eq("school_id", schoolId);
  const months = new Set<string>();
  for (let m = from.slice(0, 7); m <= to.slice(0, 7); ) {
    months.add(m);
    const [y, mo] = m.split("-").map(Number);
    const next = mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
    if (next === m) break;
    m = next;
  }
  const rows = ((data ?? []) as unknown as PayrollRow[]).filter((r) => r.month_str && months.has(r.month_str));
  return {
    columns: ["Staff", "Designation", "Month", "Gross", "Net", "Status"],
    rows: rows.map((r) => [r.staff_members?.full_name ?? "Staff", r.staff_members?.designation ?? "", r.month_str ?? "", Number(r.gross ?? 0), Number(r.net ?? 0), r.status ?? ""]),
  };
}

async function paymentReceiptLog(schoolId: string, from: string, to: string): Promise<ReportTable> {
  const rows = (await fetchFeePayments(schoolId)).filter((r) => inRange(r.paid_date, from, to));
  const out = rows.sort((a, b) => (a.paid_date ?? "").localeCompare(b.paid_date ?? ""));
  return {
    columns: ["Receipt No", "Date", "Student", "Category", "Amount Paid", "Mode"],
    rows: out.map((r) => [r.receipt_no ?? "—", r.paid_date ?? "—", r.students?.full_name ?? "Student", r.category ?? "—", Number(r.amount_paid ?? 0), r.payment_mode ?? "—"]),
  };
}

// ── Student ──────────────────────────────────────────────────────────────────

interface StudentDirRow {
  full_name: string | null; roll_no: string | null; gender: string | null; fee_status: string | null; phone: string | null; dob: string | null; joined_date: string | null;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
  student_parents: { parents: { full_name: string | null; phone: string | null } | null }[] | null;
}

async function fetchStudents(schoolId: string): Promise<StudentDirRow[]> {
  const { data } = await supabaseAdmin
    .from("students")
    .select(`
      full_name, roll_no, gender, fee_status, phone, dob, joined_date,
      sections ( name, grades ( level ) ),
      student_parents ( parents ( full_name, phone ) )
    `)
    .eq("school_id", schoolId)
    .eq("status", "active");
  return (data ?? []) as unknown as StudentDirRow[];
}

async function studentStrengthReport(schoolId: string): Promise<ReportTable> {
  const students = await fetchStudents(schoolId);
  const byClass = new Map<string, { male: number; female: number; other: number }>();
  for (const s of students) {
    const key = classLabel(s.sections?.grades?.level, s.sections?.name);
    const bucket = byClass.get(key) ?? { male: 0, female: 0, other: 0 };
    if (s.gender === "male") bucket.male += 1;
    else if (s.gender === "female") bucket.female += 1;
    else bucket.other += 1;
    byClass.set(key, bucket);
  }
  const out = Array.from(byClass.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  return {
    columns: ["Class", "Male", "Female", "Other", "Total"],
    rows: out.map(([cls, b]) => [cls, b.male, b.female, b.other, b.male + b.female + b.other]),
  };
}

async function newAdmissionsReport(schoolId: string, from: string, to: string): Promise<ReportTable> {
  interface AdmissionRow {
    application_no: string | null; applicant_name: string | null; applying_for_grade: string | null;
    parent_name: string | null; parent_phone: string | null; status: string | null; submitted_date: string | null;
  }
  const { data } = await supabaseAdmin
    .from("admission_applications")
    .select("application_no, applicant_name, applying_for_grade, parent_name, parent_phone, status, submitted_date")
    .eq("school_id", schoolId)
    .gte("submitted_date", from)
    .lte("submitted_date", to);
  const rows = (data ?? []) as unknown as AdmissionRow[];
  return {
    columns: ["Application No", "Name", "Applying For", "Parent", "Parent Phone", "Status", "Submitted"],
    rows: rows.map((r) => [r.application_no ?? "—", r.applicant_name ?? "—", r.applying_for_grade ?? "—", r.parent_name ?? "—", r.parent_phone ?? "—", r.status ?? "—", r.submitted_date ?? "—"]),
  };
}

async function transferCertificateReport(schoolId: string, from: string, to: string): Promise<ReportTable> {
  interface CertRow {
    requested_on: string | null; issued_on: string | null; status: string | null;
    students: { full_name: string | null; roll_no: string | null; sections: { name: string | null; grades: { level: number | null } | null } | null } | null;
  }
  const { data } = await supabaseAdmin
    .from("certificate_requests")
    .select(`requested_on, issued_on, status, students ( full_name, roll_no, sections ( name, grades ( level ) ) )`)
    .eq("school_id", schoolId)
    .eq("cert_type", "transfer")
    .gte("requested_on", from)
    .lte("requested_on", to);
  const rows = (data ?? []) as unknown as CertRow[];
  return {
    columns: ["Student", "Roll No", "Class", "Requested On", "Issued On", "Status"],
    rows: rows.map((r) => [r.students?.full_name ?? "Student", r.students?.roll_no ?? "—", classLabel(r.students?.sections?.grades?.level, r.students?.sections?.name), r.requested_on ?? "—", r.issued_on ?? "—", r.status ?? "—"]),
  };
}

async function studentDirectory(schoolId: string): Promise<ReportTable> {
  const students = await fetchStudents(schoolId);
  const out = students.sort((a, b) => (a.full_name ?? "").localeCompare(b.full_name ?? ""));
  return {
    columns: ["Student", "Roll No", "Class", "Parent", "Parent Phone", "Fee Status"],
    rows: out.map((s) => [
      s.full_name ?? "Student",
      s.roll_no ?? "—",
      classLabel(s.sections?.grades?.level, s.sections?.name),
      s.student_parents?.[0]?.parents?.full_name ?? "—",
      s.student_parents?.[0]?.parents?.phone ?? s.phone ?? "—",
      s.fee_status ?? "—",
    ]),
  };
}

async function birthdayList(schoolId: string, from: string, to: string): Promise<ReportTable> {
  const students = await fetchStudents(schoolId);
  const fromMd = from.slice(5);
  const toMd = to.slice(5);
  const out = students
    .filter((s) => {
      if (!s.dob) return false;
      const md = s.dob.slice(5);
      return fromMd <= toMd ? md >= fromMd && md <= toMd : md >= fromMd || md <= toMd;
    })
    .sort((a, b) => (a.dob ?? "").slice(5).localeCompare((b.dob ?? "").slice(5)));
  return {
    columns: ["Student", "Class", "Date of Birth"],
    rows: out.map((s) => [s.full_name ?? "Student", classLabel(s.sections?.grades?.level, s.sections?.name), s.dob ?? "—"]),
  };
}

// ── Dispatcher ───────────────────────────────────────────────────────────────

export async function getReportData(reportId: number, dateFrom: string, dateTo: string): Promise<ReportTable> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  switch (reportId) {
    case 1: return classWisePerformance(schoolId, dateFrom, dateTo);
    case 2: return subjectWisePerformance(schoolId, dateFrom, dateTo);
    case 3: return toppersList(schoolId, dateFrom, dateTo);
    case 4: return passFailAnalysis(schoolId, dateFrom, dateTo);
    case 5: return studentProgressReport(schoolId, dateFrom, dateTo);
    case 6: return dailyAttendanceSummary(schoolId, dateFrom, dateTo);
    case 7: return monthlyAttendanceReport(schoolId, dateFrom, dateTo);
    case 8: return classWiseAttendanceSummary(schoolId, dateFrom, dateTo);
    case 9: return chronicAbsenteeismReport(schoolId, dateFrom, dateTo);
    case 10: return staffAttendanceReport(schoolId, dateFrom, dateTo);
    case 11: return feeCollectionSummary(schoolId, dateFrom, dateTo);
    case 12: return outstandingFeesReport(schoolId);
    case 13: return expenseSummary(schoolId, dateFrom, dateTo);
    case 14: return payrollSummary(schoolId, dateFrom, dateTo);
    case 15: return paymentReceiptLog(schoolId, dateFrom, dateTo);
    case 16: return studentStrengthReport(schoolId);
    case 17: return newAdmissionsReport(schoolId, dateFrom, dateTo);
    case 18: return transferCertificateReport(schoolId, dateFrom, dateTo);
    case 19: return studentDirectory(schoolId);
    case 20: return birthdayList(schoolId, dateFrom, dateTo);
    default: return { columns: [], rows: [] };
  }
}
