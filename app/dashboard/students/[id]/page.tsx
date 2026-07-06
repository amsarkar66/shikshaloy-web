import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Download, Phone, Mail, MapPin,
  Calendar, User, BookOpen, IndianRupee,
  CheckCircle2, AlertCircle, TrendingUp,
  GraduationCap, Award, Users,
} from "lucide-react";
import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [
    { data: studentRow },
    { data: examRows },
    { data: attRows },
    { data: feeRows },
  ] = await Promise.all([
    supabaseAdmin
      .from("students")
      .select(`
        id, full_name, roll_no, dob, gender, address, phone,
        attendance_pct, fee_status, status, joined_date,
        sections ( name, grades ( level ) ),
        student_parents ( relationship, parents ( full_name, phone, email, occupation ) )
      `)
      .eq("school_id", DEMO_SCHOOL_ID)
      .eq("id", id)
      .maybeSingle(),

    supabaseAdmin
      .from("exam_results")
      .select(`
        marks_obtained, max_marks, grade, is_absent,
        subjects ( name ),
        exams ( name, start_date )
      `)
      .eq("school_id", DEMO_SCHOOL_ID)
      .eq("student_id", id)
      .order("created_at", { ascending: false }),

    supabaseAdmin
      .from("student_attendance")
      .select("date, status")
      .eq("school_id", DEMO_SCHOOL_ID)
      .eq("student_id", id)
      .order("date"),

    supabaseAdmin
      .from("fee_payments")
      .select("month_str, category, amount_due, amount_paid, status, paid_date, receipt_no")
      .eq("school_id", DEMO_SCHOOL_ID)
      .eq("student_id", id)
      .order("paid_date", { ascending: false, nullsFirst: false }),
  ]);

  if (!studentRow) notFound();

  const s = studentRow as any;
  const student = {
    id: s.id as string,
    name: s.full_name as string,
    rollNo: (s.roll_no as string) ?? "",
    classNum: String(s.sections?.grades?.level ?? "—"),
    section: (s.sections?.name as string) ?? "—",
    phone: (s.phone as string) ?? "—",
    dob: formatDate(s.dob),
    gender: (s.gender as string) ?? "—",
    address: (s.address as string) ?? "—",
    joinedDate: formatDate(s.joined_date),
    active: s.status === "active",
    feeStatus: (s.fee_status as string) ?? "overdue",
  };

  const guardians = ((s.student_parents ?? []) as any[])
    .map((sp) => ({
      relationship: sp.relationship ?? "Guardian",
      name: sp.parents?.full_name ?? "—",
      phone: sp.parents?.phone ?? "—",
      email: sp.parents?.email ?? "—",
      occupation: sp.parents?.occupation ?? "—",
    }));

  // ── Exam results ──────────────────────────────────────────────────────────
  const exams = ((examRows ?? []) as any[]).map((r) => ({
    subject: r.subjects?.name ?? "—",
    examName: r.exams?.name ?? "—",
    marks: Number(r.marks_obtained ?? 0),
    max: Number(r.max_marks ?? 100),
    grade: r.grade as string | null,
    isAbsent: Boolean(r.is_absent),
  }));
  const avgScore = exams.length
    ? Math.round(exams.reduce((sum, e) => sum + (e.max ? (e.marks / e.max) * 100 : 0), 0) / exams.length)
    : null;

  // ── Attendance, grouped by month ──────────────────────────────────────────
  const attByMonth = new Map<string, { present: number; total: number }>();
  for (const r of (attRows ?? []) as any[]) {
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
  const fees = ((feeRows ?? []) as any[]).map((f) => ({
    date: formatDate(f.paid_date),
    description: `${f.category} — ${f.month_str}`,
    amountDue: Number(f.amount_due ?? 0),
    amountPaid: Number(f.amount_paid ?? 0),
    status: (f.status as string) ?? "overdue",
    receiptNo: f.receipt_no as string | null,
  }));
  const totalFees = fees.reduce((sum, f) => sum + f.amountDue, 0);
  const paidFees  = fees.reduce((sum, f) => sum + f.amountPaid, 0);

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
          <button className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Report
          </button>
          <button className="flex h-8 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white transition-colors">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
      </div>

      {/* Profile hero */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white ${avatarColor(student.id)}`}>
            {initials(student.name)}
          </div>
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
          { label: "Average Score",      value: avgScore !== null ? `${avgScore}%` : "—", sub: exams.length ? `${exams.length} result${exams.length === 1 ? "" : "s"}` : "No exams recorded yet", icon: Award, color: "text-blue-600 dark:text-blue-400 bg-blue-500/10" },
          { label: "Fee Paid",           value: totalFees ? `₹${paidFees.toLocaleString("en-IN")}` : "—", sub: totalFees ? `of ₹${totalFees.toLocaleString("en-IN")} total` : "No fee records yet", icon: IndianRupee, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10" },
          { label: "Enrolled Since",     value: student.joinedDate, sub: `Roll No. ${student.rollNo}`, icon: TrendingUp, color: "text-violet-600 dark:text-violet-400 bg-violet-500/10" },
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

      {/* Personal + Parent info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Personal */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-500" /> Personal Information
          </p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              ["Date of Birth", student.dob],
              ["Gender",        student.gender],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-gray-400 dark:text-zinc-500">{label}</dt>
                <dd className="font-medium text-gray-800 dark:text-zinc-200">{value}</dd>
              </div>
            ))}
            <div className="col-span-2">
              <dt className="text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</dt>
              <dd className="font-medium text-gray-800 dark:text-zinc-200">{student.address}</dd>
            </div>
          </dl>
        </div>

        {/* Parent / Guardian */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" /> Parent / Guardian
          </p>
          {guardians.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500">No parent or guardian linked yet.</p>
          ) : (
            <div className="space-y-4">
              {guardians.map((g, i) => (
                <dl key={i} className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div className="col-span-2">
                    <dt className="text-xs text-gray-400 dark:text-zinc-500 capitalize">{g.relationship}</dt>
                    <dd className="font-medium text-gray-800 dark:text-zinc-200">{g.name}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</dt>
                    <dd className="font-medium text-gray-800 dark:text-zinc-200">{g.phone}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-gray-400 dark:text-zinc-500">Occupation</dt>
                    <dd className="font-medium text-gray-800 dark:text-zinc-200">{g.occupation}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1"><Mail className="h-3 w-3" /> Email</dt>
                    <dd className="font-medium text-gray-800 dark:text-zinc-200">{g.email}</dd>
                  </div>
                </dl>
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
            <BookOpen className="h-4 w-4 text-indigo-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Subject-wise Performance</p>
          </div>
          {exams.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500 py-10 text-center">No exam results recorded yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                  <th className="py-2.5 pl-5 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Subject</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Score</th>
                  <th className="py-2.5 pl-3 pr-5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Progress</th>
                  <th className="py-2.5 pl-3 pr-5 text-center text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Grade</th>
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
                            <div className="h-1.5 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
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
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${totalFees ? (paidFees / totalFees) * 100 : 0}%` }}
                  />
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
    </div>
  );
}
