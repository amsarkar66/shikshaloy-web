import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Phone, Calendar, BookOpen, IndianRupee,
  CheckCircle2, AlertCircle, GraduationCap, Award, Landmark,
  Clock, FileText, MessageSquare, CalendarClock,
} from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getParentContext } from "@/lib/parents/context";
import { FancyButton } from "@/components/ui/fancy-button";

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500",
];
function avatarColor(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

const GRADE_COLOR: Record<string, string> = {
  "A+": "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  "A":  "text-blue-600    dark:text-blue-400    bg-blue-500/10",
  "B+": "text-sky-600     dark:text-sky-400     bg-sky-500/10",
  "B":  "text-amber-600   dark:text-amber-400   bg-amber-500/10",
  "C":  "text-orange-600  dark:text-orange-400  bg-orange-500/10",
};

const FEE_STYLE: Record<string, string> = {
  paid:    "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  partial: "text-amber-600   dark:text-amber-400   bg-amber-500/10  border-amber-500/20",
  overdue: "text-red-600     dark:text-red-400     bg-red-500/10    border-red-500/20",
};

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

function formatShort(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface StudentDetailRow {
  id: string;
  school_id: string;
  full_name: string;
  roll_no: string | null;
  admission_no: string | null;
  dob: string | null;
  gender: string | null;
  phone: string | null;
  photo_url: string | null;
  attendance_pct: number | null;
  fee_status: string | null;
  status: string | null;
  joined_date: string | null;
  section_id: string | null;
  academic_year_id: string | null;
  sections: { name: string | null; room: string | null; grades: { level: number | null } | null; profiles: { full_name: string | null } | null } | null;
}

interface ExamResultRow {
  marks_obtained: number | null;
  max_marks: number | null;
  grade: string | null;
  is_absent: boolean | null;
  subjects: { name: string | null } | null;
  exams: { name: string | null; status: string | null; start_date: string } | null;
}

interface AttendanceDetailRow { date: string; status: string }

interface FeePaymentDetailRow {
  month_str: string; category: string;
  amount_due: number | null; amount_paid: number | null;
  status: string | null; paid_date: string | null; receipt_no: string | null;
}

interface SectionSubjectRow {
  subjects: { name: string | null; code: string | null; type: string | null } | null;
  profiles: { full_name: string | null } | null;
}

interface HomeworkRow {
  id: string; title: string | null; due_date: string; subjects: { name: string | null } | null;
}

interface PeriodRow { number: number; start_time: string; end_time: string; is_break: boolean | null; break_label: string | null }
interface SlotRow { period_number: number; subjects: { name: string | null } | null }

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ChildDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: { user } } = await getUser();
  const parent = user ? await getParentContext(user.id) : null;

  const child = parent?.children.find((c) => c.id === id);
  if (!parent || !child) notFound();

  const todayISO = new Date().toISOString().slice(0, 10);
  const dayOfWeek = new Date().getDay() === 0 ? 6 : new Date().getDay();
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const [
    { data: studentRow },
    { data: examRows },
    { data: attRows },
    { data: feeRows },
    { data: subjectRows },
    { data: homeworkRows },
    { data: submissionRows },
  ] = await Promise.all([
    supabaseAdmin
      .from("students")
      .select(`
        id, school_id, full_name, roll_no, admission_no, dob, gender, phone, photo_url,
        attendance_pct, fee_status, status, joined_date, section_id, academic_year_id,
        sections ( name, room, grades ( level ), profiles ( full_name ) )
      `)
      .eq("id", id)
      .maybeSingle(),

    supabaseAdmin
      .from("exam_results")
      .select(`marks_obtained, max_marks, grade, is_absent, subjects ( name ), exams ( name, status, start_date )`)
      .eq("student_id", id)
      .order("created_at", { ascending: false }),

    supabaseAdmin.from("student_attendance").select("date, status").eq("student_id", id).order("date"),

    supabaseAdmin
      .from("fee_payments")
      .select("month_str, category, amount_due, amount_paid, status, paid_date, receipt_no")
      .eq("student_id", id)
      .order("paid_date", { ascending: false, nullsFirst: false }),

    child.sectionId
      ? supabaseAdmin
          .from("section_subjects")
          .select("subjects ( name, code, type ), profiles ( full_name )")
          .eq("section_id", child.sectionId)
          .eq("academic_year_id", child.academicYearId ?? "")
      : Promise.resolve({ data: [] as SectionSubjectRow[] }),

    child.sectionId
      ? supabaseAdmin
          .from("homework")
          .select("id, title, due_date, subjects ( name )")
          .eq("section_id", child.sectionId)
          .eq("status", "active")
          .order("due_date", { ascending: false })
          .limit(15)
      : Promise.resolve({ data: [] as HomeworkRow[] }),

    supabaseAdmin.from("homework_submissions").select("homework_id").eq("student_id", id),
  ]);

  if (!studentRow) notFound();
  const s = studentRow as unknown as StudentDetailRow;

  // Today's schedule needs school_id, resolved only once the student row is in hand — fetch here.
  const [{ data: realPeriodRows }, { data: realSlotRows }] = await Promise.all([
    supabaseAdmin
      .from("timetable_periods")
      .select("number, start_time, end_time, is_break, break_label")
      .eq("school_id", s.school_id)
      .order("start_time"),

    child.sectionId
      ? supabaseAdmin
          .from("timetable_slots")
          .select("period_number, subjects ( name )")
          .eq("school_id", s.school_id)
          .eq("section_id", child.sectionId)
          .eq("day_of_week", dayOfWeek)
      : Promise.resolve({ data: [] as SlotRow[] }),
  ]);

  const student = {
    id: s.id,
    name: s.full_name,
    rollNo: s.roll_no ?? "",
    admissionNo: s.admission_no ?? "—",
    classNum: String(s.sections?.grades?.level ?? "—"),
    section: s.sections?.name ?? "—",
    room: s.sections?.room ?? "—",
    classTeacher: s.sections?.profiles?.full_name ?? "—",
    phone: s.phone ?? "—",
    dob: formatDate(s.dob),
    gender: s.gender ?? "—",
    joinedDate: formatDate(s.joined_date),
    active: s.status === "active",
    photoUrl: s.photo_url ?? null,
  };

  // Exam results — only published exams are shown to parents (matches student-facing Grades page).
  const exams = ((examRows ?? []) as unknown as ExamResultRow[])
    .filter((r) => r.exams?.status === "published")
    .map((r) => ({
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

  // Attendance, grouped by month
  const attByMonth = new Map<string, { present: number; total: number }>();
  for (const r of (attRows ?? []) as unknown as AttendanceDetailRow[]) {
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
  const ac = attColor(overallAtt);

  // Fees
  const fees = ((feeRows ?? []) as unknown as FeePaymentDetailRow[]).map((f) => ({
    date: formatDate(f.paid_date),
    description: `${f.category} — ${f.month_str}`,
    amountDue: Number(f.amount_due ?? 0),
    amountPaid: Number(f.amount_paid ?? 0),
    status: f.status ?? "overdue",
    receiptNo: f.receipt_no,
  }));
  const totalFees = fees.reduce((sum, f) => sum + f.amountDue, 0);
  const paidFees  = fees.reduce((sum, f) => sum + f.amountPaid, 0);
  const feeDue = Math.max(totalFees - paidFees, 0);

  // Subjects & teachers
  const subjects = ((subjectRows ?? []) as unknown as SectionSubjectRow[]).map((row) => ({
    name: row.subjects?.name ?? "Subject",
    code: row.subjects?.code ?? "",
    type: row.subjects?.type ?? "core",
    teacher: row.profiles?.full_name ?? "—",
  }));

  // Homework
  const submittedIds = new Set(((submissionRows ?? []) as { homework_id: string }[]).map((r) => r.homework_id));
  const homework = ((homeworkRows ?? []) as unknown as HomeworkRow[]).map((h) => ({
    id: h.id,
    title: h.title ?? "",
    subject: h.subjects?.name ?? "Subject",
    dueDate: h.due_date,
    submitted: submittedIds.has(h.id),
  }));
  const pendingHomework = homework.filter((h) => !h.submitted && h.dueDate >= todayISO).length;

  // Today's schedule
  const slotByPeriod: Record<number, string> = {};
  for (const row of (realSlotRows ?? []) as unknown as SlotRow[]) {
    slotByPeriod[row.period_number] = row.subjects?.name ?? "Class";
  }
  const scheduleItems = ((realPeriodRows ?? []) as unknown as PeriodRow[]).map((p) => {
    const [h, m] = p.start_time.split(":").map(Number);
    const [eh, em] = p.end_time.split(":").map(Number);
    const startMin = h * 60 + m, endMin = eh * 60 + em;
    const label = p.is_break ? (p.break_label ?? "Break") : (slotByPeriod[p.number] ?? `Period ${p.number}`);
    return {
      time: p.start_time.slice(0, 5), label,
      done: nowMinutes >= endMin, now: nowMinutes >= startMin && nowMinutes < endMin,
      isBreak: !!p.is_break,
    };
  });

  return (
    <div className="w-full px-6 py-6 space-y-6">

      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/children"
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to My Children
        </Link>
        <div className="flex gap-2">
          <Link
            href="/dashboard/ptm"
            className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          >
            <CalendarClock className="h-3.5 w-3.5" /> Book PTM
          </Link>
          <FancyButton href="/dashboard/messages" size="xs">
            <MessageSquare className="h-3.5 w-3.5" /> Message Teacher
          </FancyButton>
        </div>
      </div>

      {/* Profile hero */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {student.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={student.photoUrl} alt={student.name} className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
          ) : (
            <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white ${avatarColor(student.id)}`}>
              {initials(student.name)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50">{student.name}</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${student.active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"}`}>
                {student.active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-zinc-400">
              <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> Roll No: <span className="font-medium text-gray-700 dark:text-zinc-300">{student.rollNo}</span></span>
              <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> Class <span className="font-medium text-gray-700 dark:text-zinc-300">{student.classNum}–{student.section}</span></span>
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> <span className="font-medium text-gray-700 dark:text-zinc-300">{student.phone}</span></span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> DOB: <span className="font-medium text-gray-700 dark:text-zinc-300">{student.dob}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Overall Attendance", value: `${overallAtt}%`, sub: totalDays ? `${totalPresent}/${totalDays} days recorded` : "from enrolment record", icon: CheckCircle2, color: `${ac.text} bg-emerald-500/10` },
          { label: "Average Score",      value: avgScore !== null ? `${avgScore}%` : "—", sub: exams.length ? `${exams.length} result${exams.length === 1 ? "" : "s"}` : "No published results yet", icon: Award, color: "text-blue-600 dark:text-blue-400 bg-blue-500/10" },
          { label: "Fees Due",           value: feeDue ? `₹${feeDue.toLocaleString("en-IN")}` : "₹0", sub: totalFees ? `of ₹${totalFees.toLocaleString("en-IN")} total` : "No fee records yet", icon: IndianRupee, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10" },
          { label: "Homework Pending",   value: String(pendingHomework), sub: "Due soon", icon: FileText, color: "text-violet-600 dark:text-violet-400 bg-violet-500/10" },
        ].map((st) => (
          <div key={st.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${st.color}`}>
              <st.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-gray-900 dark:text-zinc-50 leading-tight">{st.value}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 leading-tight">{st.label}</p>
              <p className="text-[10px] text-gray-400 dark:text-zinc-500">{st.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Today's schedule + Class & Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Today&apos;s Schedule</p>
            <Clock className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
          </div>
          {scheduleItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">Nothing scheduled today</p>
          ) : (
            <div className="space-y-1">
              {scheduleItems.map((item, i) => (
                <div key={i} className={`flex items-center gap-3 rounded-lg px-2 py-2 ${item.now ? "bg-primary-500/5 dark:bg-primary-500/10" : ""}`}>
                  <span className={`w-10 shrink-0 text-[11px] font-mono font-semibold ${
                    item.done ? "text-gray-300 dark:text-zinc-600" :
                    item.now  ? "text-primary-600 dark:text-primary-400" :
                    "text-gray-500 dark:text-zinc-400"
                  }`}>{item.time}</span>
                  <span className={`text-xs font-medium ${
                    item.done ? "line-through text-gray-400 dark:text-zinc-600" :
                    item.now  ? "text-primary-700 dark:text-primary-300" :
                    item.isBreak ? "text-gray-400 dark:text-zinc-500 italic" :
                    "text-gray-700 dark:text-zinc-300"
                  }`}>{item.label}</span>
                  {item.now && <span className="ml-auto text-[10px] font-semibold text-primary-600 dark:text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded-full">Now</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Landmark className="h-4 w-4 text-primary-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Class Teacher & Subjects</p>
          </div>
          <p className="text-sm text-gray-700 dark:text-zinc-300 mb-3">
            <span className="font-medium">{student.classTeacher}</span> · Room {student.room}
          </p>
          {subjects.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500 py-4">No subjects assigned yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {subjects.map((sub, i) => (
                <div key={i} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-gray-800 dark:text-zinc-200">{sub.name}</span>
                  <span className="text-gray-500 dark:text-zinc-400">{sub.teacher}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Monthly attendance chart */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Monthly Attendance</p>
          {monthly.length > 0 && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ac.text} bg-emerald-500/10`}>
              {overallAtt}% overall
            </span>
          )}
        </div>
        {monthly.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-zinc-500 py-6 text-center">No attendance records yet.</p>
        ) : (
          <div className="flex items-end gap-2" style={{ height: 100 }}>
            {monthly.map((m) => {
              const pct = m.total ? Math.round((m.present / m.total) * 100) : 0;
              const barH = Math.round((m.present / chartMax) * 72);
              const c = attColor(pct);
              return (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <span className={`text-[10px] font-semibold tabular-nums ${c.text}`}>{pct}%</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: 72 }}>
                    <div className={`w-full rounded-t-md ${c.bar}`} style={{ height: barH || 3 }} />
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">{m.month}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Academics + Fees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Subject-wise marks */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Subject-wise Performance</p>
          </div>
          {exams.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500 py-10 text-center">No published exam results yet.</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                  <th className="py-2.5 pl-5 pr-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Subject</th>
                  <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Score</th>
                  <th className="py-2.5 pl-3 pr-5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Progress</th>
                  <th className="py-2.5 pl-3 pr-5 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
                {exams.map((sub, i) => {
                  const pct = sub.isAbsent ? 0 : Math.round((sub.marks / sub.max) * 100);
                  const gc = (sub.grade && GRADE_COLOR[sub.grade]) ?? "text-gray-600 bg-gray-100";
                  return (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                      <td className="py-3 pl-5 pr-3 font-medium text-gray-800 dark:text-zinc-200">{sub.subject}</td>
                      <td className="px-3 py-3 text-center text-gray-600 dark:text-zinc-400 tabular-nums">
                        {sub.isAbsent ? (
                          <span className="text-xs font-semibold text-red-500">Absent</span>
                        ) : (
                          <><span className="font-semibold text-gray-900 dark:text-zinc-50">{sub.marks}</span>/{sub.max}</>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
                            <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs tabular-nums text-gray-500 dark:text-zinc-400 w-7 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="py-3 pl-3 pr-5 text-center">
                        <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold ${gc}`}>
                          {sub.grade ?? "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* Fee history */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-indigo-500" />
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Fee History</p>
            </div>
            {totalFees > 0 && (
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-zinc-400">Paid</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{paidFees.toLocaleString("en-IN")}</p>
              </div>
            )}
          </div>

          {fees.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500 py-10 text-center">No fee records yet.</p>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700">
                <div className="flex justify-between text-xs text-gray-500 dark:text-zinc-400 mb-1.5">
                  <span>Total: ₹{totalFees.toLocaleString("en-IN")}</span>
                  <span>{totalFees ? Math.round((paidFees / totalFees) * 100) : 0}% paid</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-zinc-700">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${totalFees ? (paidFees / totalFees) * 100 : 0}%` }} />
                </div>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
                {fees.map((f, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      f.status === "paid" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                      f.status === "partial" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                      "bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}>
                      {f.status === "paid" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">{f.description}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">{f.date}{f.receiptNo ? ` · ${f.receiptNo}` : ""}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">₹{f.amountDue.toLocaleString("en-IN")}</p>
                      <span className={`text-[10px] font-semibold capitalize px-1.5 py-0.5 rounded-full border ${FEE_STYLE[f.status] ?? FEE_STYLE.overdue}`}>
                        {f.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Homework */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Homework</p>
          </div>
          <span className="text-xs text-gray-400 dark:text-zinc-500">{pendingHomework} pending</span>
        </div>
        {homework.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-zinc-500 py-10 text-center">No homework assigned yet.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {homework.map((h) => (
              <div key={h.id} className="flex items-center gap-3 px-5 py-3">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${h.submitted ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{h.title}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{h.subject}</p>
                </div>
                <span className={`shrink-0 text-[11px] font-medium ${h.submitted ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-zinc-500"}`}>
                  {h.submitted ? "Submitted" : `Due ${formatShort(h.dueDate)}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
