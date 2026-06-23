import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Download, Phone, Mail, MapPin,
  Calendar, Droplets, User, BookOpen, IndianRupee,
  CheckCircle2, Clock, AlertCircle, TrendingUp,
  GraduationCap, Award, Users,
} from "lucide-react";
import { ALL_STUDENTS, avatarColor, initials } from "../_data/students";
import type { FeeStatus } from "../_data/students";

// ── Extended mock data ────────────────────────────────────────────────────────

interface Subject  { name: string; max: number; obtained: number; grade: string }
interface MonthAtt { month: string; present: number; total: number }
interface Payment  { date: string; description: string; amount: number; status: FeeStatus }

interface Detail {
  dob: string; gender: string; bloodGroup: string; religion: string;
  category: string; address: string;
  fatherName: string; motherName: string; altPhone: string;
  email: string; fatherOccupation: string; motherOccupation: string;
  gpa: string; rank: string; classSize: number;
  subjects: Subject[];
  monthly: MonthAtt[];
  fees: Payment[];
}

const DETAILS: Record<number, Detail> = {
  1: {
    dob: "15 Mar 2010", gender: "Male", bloodGroup: "B+", religion: "Hindu",
    category: "General", address: "123, Sector 15, Gurugram, Haryana 122001",
    fatherName: "Rajesh Sharma", motherName: "Sunita Sharma",
    altPhone: "+91 87654 32109", email: "rajesh.sharma@email.com",
    fatherOccupation: "Software Engineer", motherOccupation: "Teacher",
    gpa: "9.2", rank: "3rd", classSize: 42,
    subjects: [
      { name: "Mathematics",     max: 100, obtained: 94, grade: "A+" },
      { name: "Physics",         max: 100, obtained: 89, grade: "A"  },
      { name: "Chemistry",       max: 100, obtained: 85, grade: "A"  },
      { name: "English",         max: 100, obtained: 91, grade: "A+" },
      { name: "Computer Science",max: 100, obtained: 97, grade: "A+" },
      { name: "Physical Ed.",    max: 100, obtained: 88, grade: "A"  },
    ],
    monthly: [
      { month: "Apr", present: 22, total: 23 }, { month: "May", present: 20, total: 21 },
      { month: "Jun", present: 18, total: 20 }, { month: "Jul", present: 23, total: 24 },
      { month: "Aug", present: 21, total: 23 }, { month: "Sep", present: 19, total: 20 },
      { month: "Oct", present: 22, total: 23 }, { month: "Nov", present: 20, total: 22 },
      { month: "Dec", present: 18, total: 19 }, { month: "Jan", present: 22, total: 23 },
      { month: "Feb", present: 19, total: 20 }, { month: "Mar", present: 5,  total: 6  },
    ],
    fees: [
      { date: "05 Apr 2026", description: "Annual Fee — Q1 (Apr–Jun)", amount: 12500, status: "paid" },
      { date: "08 Jan 2026", description: "Annual Fee — Q4 (Jan–Mar)", amount: 12500, status: "paid" },
      { date: "03 Oct 2025", description: "Annual Fee — Q3 (Oct–Dec)", amount: 12500, status: "paid" },
      { date: "02 Jul 2025", description: "Annual Fee — Q2 (Jul–Sep)", amount: 12500, status: "paid" },
    ],
  },
};

function buildDetail(id: number): Detail {
  if (DETAILS[id]) return DETAILS[id];
  const s = ALL_STUDENTS.find((x) => x.id === id)!;
  return {
    dob: "01 Jan 2010", gender: "—", bloodGroup: "—", religion: "—",
    category: "General", address: "—",
    fatherName: s.parent, motherName: "—",
    altPhone: "—", email: "—", fatherOccupation: "—", motherOccupation: "—",
    gpa: "8.5", rank: "—", classSize: 40,
    subjects: [
      { name: "Mathematics", max: 100, obtained: 82, grade: "A"  },
      { name: "Science",     max: 100, obtained: 78, grade: "B+" },
      { name: "English",     max: 100, obtained: 85, grade: "A"  },
      { name: "Social Sc.",  max: 100, obtained: 80, grade: "A"  },
      { name: "Hindi",       max: 100, obtained: 75, grade: "B+" },
    ],
    monthly: [
      { month: "Apr", present: 21, total: 23 }, { month: "May", present: 19, total: 21 },
      { month: "Jun", present: 17, total: 20 }, { month: "Jul", present: 22, total: 24 },
      { month: "Aug", present: 20, total: 23 }, { month: "Sep", present: 18, total: 20 },
      { month: "Oct", present: 21, total: 23 }, { month: "Nov", present: 19, total: 22 },
      { month: "Dec", present: 17, total: 19 }, { month: "Jan", present: 21, total: 23 },
      { month: "Feb", present: 18, total: 20 }, { month: "Mar", present: 5,  total: 6  },
    ],
    fees: [
      { date: "05 Apr 2026", description: "Annual Fee — Q1", amount: 12500, status: s.feeStatus === "paid" ? "paid" : s.feeStatus },
      { date: "08 Jan 2026", description: "Annual Fee — Q4", amount: 12500, status: "paid" },
      { date: "03 Oct 2025", description: "Annual Fee — Q3", amount: 12500, status: "paid" },
      { date: "02 Jul 2025", description: "Annual Fee — Q2", amount: 12500, status: "paid" },
    ],
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const GRADE_COLOR: Record<string, string> = {
  "A+": "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  "A":  "text-blue-600    dark:text-blue-400    bg-blue-500/10",
  "B+": "text-sky-600     dark:text-sky-400     bg-sky-500/10",
  "B":  "text-amber-600   dark:text-amber-400   bg-amber-500/10",
  "C":  "text-orange-600  dark:text-orange-400  bg-orange-500/10",
};

const FEE_STYLE: Record<FeeStatus, string> = {
  paid:    "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  partial: "text-amber-600   dark:text-amber-400   bg-amber-500/10  border-amber-500/20",
  overdue: "text-red-600     dark:text-red-400     bg-red-500/10    border-red-500/20",
};

function attColor(pct: number) {
  if (pct >= 90) return { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" };
  if (pct >= 80) return { bar: "bg-amber-500",   text: "text-amber-600 dark:text-amber-400" };
  return           { bar: "bg-red-500",     text: "text-red-600 dark:text-red-400" };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = ALL_STUDENTS.find((s) => s.id === Number(id));
  if (!student) notFound();

  const d = buildDetail(student.id);

  const totalFees    = d.fees.reduce((sum, f) => sum + f.amount, 0);
  const paidFees     = d.fees.filter((f) => f.status === "paid").reduce((sum, f) => sum + f.amount, 0);
  const totalPresent = d.monthly.reduce((sum, m) => sum + m.present, 0);
  const totalDays    = d.monthly.reduce((sum, m) => sum + m.total, 0);
  const overallAtt   = totalDays ? Math.round((totalPresent / totalDays) * 100) : 0;
  const avgScore     = Math.round(d.subjects.reduce((s, x) => s + (x.obtained / x.max) * 100, 0) / d.subjects.length);
  const chartMax     = Math.max(...d.monthly.map((m) => m.total));

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
              <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> Class <span className="font-medium text-gray-700 dark:text-zinc-300">{student.class}–{student.section}</span></span>
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> <span className="font-medium text-gray-700 dark:text-zinc-300">{student.phone}</span></span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> DOB: <span className="font-medium text-gray-700 dark:text-zinc-300">{d.dob}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Overall Attendance", value: `${overallAtt}%`, sub: `${totalPresent}/${totalDays} days`, icon: CheckCircle2, color: `${ac.text} bg-emerald-500/10` },
          { label: "Average Score",      value: `${avgScore}%`,  sub: `GPA ${d.gpa}`,                     icon: Award,         color: "text-blue-600 dark:text-blue-400 bg-blue-500/10" },
          { label: "Class Rank",         value: d.rank,           sub: `out of ${d.classSize} students`,    icon: TrendingUp,    color: "text-violet-600 dark:text-violet-400 bg-violet-500/10" },
          { label: "Fee Paid",           value: `₹${(paidFees).toLocaleString("en-IN")}`, sub: `of ₹${totalFees.toLocaleString("en-IN")} total`, icon: IndianRupee, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-gray-900 dark:text-zinc-50 leading-tight">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 leading-tight">{s.label}</p>
              <p className="text-[10px] text-gray-400 dark:text-zinc-500">{s.sub}</p>
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
              ["Date of Birth", d.dob],
              ["Gender",        d.gender],
              ["Blood Group",   d.bloodGroup],
              ["Religion",      d.religion],
              ["Category",      d.category],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-gray-400 dark:text-zinc-500">{label}</dt>
                <dd className="font-medium text-gray-800 dark:text-zinc-200">{value}</dd>
              </div>
            ))}
            <div className="col-span-2">
              <dt className="text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</dt>
              <dd className="font-medium text-gray-800 dark:text-zinc-200">{d.address}</dd>
            </div>
          </dl>
        </div>

        {/* Parent */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" /> Parent / Guardian
          </p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              ["Father's Name",       d.fatherName],
              ["Father's Occupation", d.fatherOccupation],
              ["Mother's Name",       d.motherName],
              ["Mother's Occupation", d.motherOccupation],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-gray-400 dark:text-zinc-500">{label}</dt>
                <dd className="font-medium text-gray-800 dark:text-zinc-200">{value}</dd>
              </div>
            ))}
            <div>
              <dt className="text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1"><Phone className="h-3 w-3" /> Primary Phone</dt>
              <dd className="font-medium text-gray-800 dark:text-zinc-200">{student.phone}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1"><Phone className="h-3 w-3" /> Alt. Phone</dt>
              <dd className="font-medium text-gray-800 dark:text-zinc-200">{d.altPhone}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1"><Mail className="h-3 w-3" /> Email</dt>
              <dd className="font-medium text-gray-800 dark:text-zinc-200">{d.email}</dd>
            </div>
          </dl>
        </div>

      </div>

      {/* Monthly attendance chart */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Monthly Attendance — 2025–26</p>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ac.text} bg-emerald-500/10`}>
            {overallAtt}% overall
          </span>
        </div>
        <div className="flex items-end gap-2" style={{ height: 100 }}>
          {d.monthly.map((m) => {
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
        <div className="mt-3 flex items-center gap-4 border-t border-gray-100 dark:border-zinc-700/50 pt-3">
          {[
            { color: "bg-emerald-500", label: "≥90%" },
            { color: "bg-amber-500",   label: "80–89%" },
            { color: "bg-red-500",     label: "<80%" },
          ].map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-zinc-500">
              <span className={`h-2 w-2 rounded-sm ${l.color}`} /> {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Academics + Fees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Subject-wise marks */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Subject-wise Performance</p>
          </div>
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
              {d.subjects.map((sub) => {
                const pct = Math.round((sub.obtained / sub.max) * 100);
                const gc = GRADE_COLOR[sub.grade] ?? "text-gray-600 bg-gray-100";
                return (
                  <tr key={sub.name} className="hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                    <td className="py-3 pl-5 pr-3 font-medium text-gray-800 dark:text-zinc-200">{sub.name}</td>
                    <td className="px-3 py-3 text-center text-gray-600 dark:text-zinc-400 tabular-nums">
                      <span className="font-semibold text-gray-900 dark:text-zinc-50">{sub.obtained}</span>/{sub.max}
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
                        {sub.grade}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Fee history */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-indigo-500" />
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Fee History</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-zinc-400">Paid</p>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{paidFees.toLocaleString("en-IN")}</p>
            </div>
          </div>

          {/* Fee summary bar */}
          <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700">
            <div className="flex justify-between text-xs text-gray-500 dark:text-zinc-400 mb-1.5">
              <span>Total: ₹{totalFees.toLocaleString("en-IN")}</span>
              <span>{Math.round((paidFees / totalFees) * 100)}% paid</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-zinc-700">
              <div
                className="h-2 rounded-full bg-emerald-500"
                style={{ width: `${(paidFees / totalFees) * 100}%` }}
              />
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {d.fees.map((f, i) => (
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
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{f.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">₹{f.amount.toLocaleString("en-IN")}</p>
                  <span className={`text-[10px] font-semibold capitalize px-1.5 py-0.5 rounded-full border ${FEE_STYLE[f.status]}`}>
                    {f.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
