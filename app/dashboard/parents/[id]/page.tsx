import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Pencil, MessageSquare,
  Phone, Mail, MapPin, Briefcase, Calendar,
  GraduationCap, BookOpen, CheckCircle2, AlertCircle,
  IndianRupee, Users2, TrendingUp,
} from "lucide-react";
import { ALL_PARENTS, avatarColor, initials } from "../_data/parents";
import { ALL_STUDENTS, avatarColor as studentAvatarColor, initials as studentInitials } from "../../students/_data/students";
import type { FeeStatus } from "../_data/parents";

const FEE_BADGE: Record<FeeStatus, string> = {
  paid:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  partial: "bg-amber-500/10  text-amber-600   dark:text-amber-400   border-amber-500/20",
  overdue: "bg-red-500/10    text-red-600     dark:text-red-400     border-red-500/20",
};

function attColor(pct: number) {
  if (pct >= 90) return { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" };
  if (pct >= 80) return { bar: "bg-amber-500",   text: "text-amber-600 dark:text-amber-400" };
  return           { bar: "bg-red-500",     text: "text-red-600 dark:text-red-400" };
}

// Mock fee amounts per student for the detail view
const MOCK_FEE_TOTAL = 50000;
const MOCK_FEE_PAID: Record<number, number> = {
  1: 50000, 2: 50000, 3: 37500, 4: 50000, 5: 12500,
  6: 50000, 7: 37500, 8: 50000, 9: 12500, 10: 50000,
  11: 50000, 12: 50000, 13: 0,  14: 37500, 15: 50000,
  16: 50000, 17: 37500, 18: 50000, 19: 12500, 20: 50000,
  21: 50000, 22: 50000,
};

const MOCK_MESSAGES = [
  { date: "12 Jun 2026", from: "Admin",   text: "Annual Sports Day scheduled for 25 June. Please ensure your ward is present." },
  { date: "05 Jun 2026", from: "Teacher", text: "Unit test marks have been uploaded. Please review your child's performance." },
  { date: "01 Jun 2026", from: "Admin",   text: "Fee reminder: Q1 fee due by 10 June 2026." },
  { date: "22 May 2026", from: "Teacher", text: "Your child has been selected for the inter-school Science Olympiad." },
];

export default async function ParentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parent = ALL_PARENTS.find((p) => p.id === Number(id));
  if (!parent) notFound();

  const children = parent.childIds
    .map((cid) => ALL_STUDENTS.find((s) => s.id === cid)!)
    .filter(Boolean);

  const totalFee = children.length * MOCK_FEE_TOTAL;
  const paidFee  = children.reduce((sum, c) => sum + (MOCK_FEE_PAID[c.id] ?? 0), 0);
  const feePct   = totalFee ? Math.round((paidFee / totalFee) * 100) : 0;

  const avgAttendance = children.length
    ? Math.round(children.reduce((s, c) => s + c.attendance, 0) / children.length)
    : 0;
  const ac = attColor(avgAttendance);

  const anyOverdue = children.some((c) => c.feeStatus === "overdue");
  const anyPartial = children.some((c) => c.feeStatus === "partial");
  const overallFee: FeeStatus = anyOverdue ? "overdue" : anyPartial ? "partial" : "paid";

  return (
    <div className="w-full px-6 py-6 space-y-6">

      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/parents"
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Parents
        </Link>
        <div className="flex gap-2">
          <button className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <MessageSquare className="h-3.5 w-3.5" /> Message
          </button>
          <button className="flex h-8 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white transition-colors">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
      </div>

      {/* Profile hero */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white ${avatarColor(parent.id)}`}>
            {initials(parent.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50">{parent.name}</h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${parent.active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"}`}>
                {parent.active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-zinc-400">
              <span className="flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> <span className="font-medium text-gray-700 dark:text-zinc-300">{parent.occupation}</span></span>
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> <span className="font-medium text-gray-700 dark:text-zinc-300">{parent.phone}</span></span>
              <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> <span className="font-medium text-gray-700 dark:text-zinc-300">{parent.email}</span></span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Joined <span className="font-medium text-gray-700 dark:text-zinc-300">{parent.joinedDate}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Children Enrolled",
            value: String(children.length),
            sub: children.length === 1 ? "1 ward in school" : `${children.length} wards in school`,
            icon: Users2,
            color: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
          },
          {
            label: "Avg. Attendance",
            value: `${avgAttendance}%`,
            sub: avgAttendance >= 90 ? "Excellent" : avgAttendance >= 80 ? "Good" : "Needs attention",
            icon: TrendingUp,
            color: `${ac.text} bg-emerald-500/10`,
          },
          {
            label: "Fee Status",
            value: overallFee.charAt(0).toUpperCase() + overallFee.slice(1),
            sub: `₹${paidFee.toLocaleString("en-IN")} of ₹${totalFee.toLocaleString("en-IN")}`,
            icon: IndianRupee,
            color: overallFee === "paid" ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                 : overallFee === "partial" ? "text-amber-600 dark:text-amber-400 bg-amber-500/10"
                 : "text-red-600 dark:text-red-400 bg-red-500/10",
          },
          {
            label: "Messages",
            value: String(MOCK_MESSAGES.length),
            sub: "this academic year",
            icon: MessageSquare,
            color: "text-violet-600 dark:text-violet-400 bg-violet-500/10",
          },
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

      {/* Contact info */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
          <Phone className="h-4 w-4 text-indigo-500" /> Contact Information
        </p>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1 mb-0.5"><Phone className="h-3 w-3" /> Phone</dt>
            <dd className="font-medium text-gray-800 dark:text-zinc-200">{parent.phone}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1 mb-0.5"><Mail className="h-3 w-3" /> Email</dt>
            <dd className="font-medium text-gray-800 dark:text-zinc-200 truncate">{parent.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1 mb-0.5"><MapPin className="h-3 w-3" /> Address</dt>
            <dd className="font-medium text-gray-800 dark:text-zinc-200">{parent.address}</dd>
          </div>
        </dl>
      </div>

      {/* Children cards */}
      <div>
        <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-indigo-500" />
          {children.length === 1 ? "Child" : "Children"} ({children.length})
        </p>
        <div className={`grid gap-4 ${children.length > 1 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
          {children.map((child) => {
            const ca      = attColor(child.attendance);
            const paid    = MOCK_FEE_PAID[child.id] ?? 0;
            const feePct2 = Math.round((paid / MOCK_FEE_TOTAL) * 100);

            return (
              <div key={child.id} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
                {/* Child header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${studentAvatarColor(child.id)}`}>
                    {studentInitials(child.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-zinc-50">{child.name}</p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${child.active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"}`}>
                        {child.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                      <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> Class {child.class}–{child.section}</span>
                      <span>Roll: {child.rollNo}</span>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/students/${child.id}`}
                    className="flex h-7 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 px-2.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                  >
                    View profile
                  </Link>
                </div>

                {/* Child stats */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Attendance */}
                  <div className="rounded-lg bg-gray-50 dark:bg-zinc-700/40 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2">Attendance</p>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-zinc-600">
                        <div className={`h-1.5 rounded-full ${ca.bar}`} style={{ width: `${child.attendance}%` }} />
                      </div>
                      <span className={`text-sm font-bold tabular-nums ${ca.text}`}>{child.attendance}%</span>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                      {child.attendance >= 90 ? "Excellent" : child.attendance >= 80 ? "Good" : "Below minimum"}
                    </p>
                  </div>

                  {/* Fee */}
                  <div className="rounded-lg bg-gray-50 dark:bg-zinc-700/40 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2">Fee</p>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${FEE_BADGE[child.feeStatus]}`}>
                        {child.feeStatus}
                      </span>
                      <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 tabular-nums">{feePct2}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-200 dark:bg-zinc-600">
                      <div
                        className={child.feeStatus === "paid" ? "h-1.5 rounded-full bg-emerald-500" : child.feeStatus === "partial" ? "h-1.5 rounded-full bg-amber-500" : "h-1.5 rounded-full bg-red-500"}
                        style={{ width: `${feePct2}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[10px] text-gray-400 dark:text-zinc-500">₹{paid.toLocaleString("en-IN")} paid</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fee summary */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-indigo-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Fee Summary 2025–26</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-zinc-400">Paid</p>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{paidFee.toLocaleString("en-IN")}</p>
          </div>
        </div>
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700">
          <div className="flex justify-between text-xs text-gray-500 dark:text-zinc-400 mb-1.5">
            <span>Total due: ₹{totalFee.toLocaleString("en-IN")}</span>
            <span>{feePct}% paid</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 dark:bg-zinc-700">
            <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${feePct}%` }} />
          </div>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
          {children.map((child) => {
            const paid2   = MOCK_FEE_PAID[child.id] ?? 0;
            const pending = MOCK_FEE_TOTAL - paid2;
            return (
              <div key={child.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  child.feeStatus === "paid"    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : child.feeStatus === "partial" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                :                                 "bg-red-500/10 text-red-600 dark:text-red-400"
                }`}>
                  {child.feeStatus === "paid" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{child.name}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">Class {child.class}–{child.section}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">₹{paid2.toLocaleString("en-IN")} <span className="text-xs font-normal text-gray-400 dark:text-zinc-500">paid</span></p>
                  {pending > 0 && (
                    <p className="text-xs text-red-500 dark:text-red-400">₹{pending.toLocaleString("en-IN")} pending</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent communications */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-500" />
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Recent Communications</p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
          {MOCK_MESSAGES.map((m, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-bold mt-0.5">
                {m.from[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{m.from}</span>
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500">{m.date}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-zinc-400 leading-snug">{m.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
