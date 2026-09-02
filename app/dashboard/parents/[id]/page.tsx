import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MessageSquare,
  Phone, Mail, MapPin, Briefcase, Calendar,
  GraduationCap, BookOpen, CheckCircle2, AlertCircle,
  IndianRupee, Users2, TrendingUp, ShieldAlert,
} from "lucide-react";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { resolveAuthorizedSchoolId } from "@/lib/supabase/authorized-school";
import { ParentDetailActions } from "../_components/parent-detail-actions";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins can view parent records.</p>
      </div>
    </div>
  );
}

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

const FEE_BADGE: Record<string, string> = {
  paid:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  partial: "bg-amber-500/10  text-amber-600   dark:text-amber-400   border-amber-500/20",
  overdue: "bg-red-500/10    text-red-600     dark:text-red-400     border-red-500/20",
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

interface ParentDetailRow {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  occupation: string | null;
  address: string | null;
  status: string | null;
  joined_date: string | null;
  profile_id: string | null;
  student_parents: {
    students: {
      id: string;
      full_name: string;
      roll_no: string | null;
      attendance_pct: number | null;
      fee_status: string | null;
      status: string | null;
      sections: { name: string | null; grades: { level: number | null } | null } | null;
    } | null;
  }[] | null;
}

interface ParentFeeRow {
  student_id: string;
  amount_due: number | null;
  amount_paid: number | null;
}

interface ParentConversationRow {
  last_message: string | null;
  last_time: string | null;
}

export default async function ParentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const verifiedUser = await getVerifiedUser();
  if (!verifiedUser || (verifiedUser.role !== "admin" && verifiedUser.role !== "super_admin")) return <Unauthorized />;

  let schoolId: string;
  try {
    schoolId = await resolveAuthorizedSchoolId("parents", id);
  } catch {
    return <Unauthorized />;
  }

  const { data: parentRow } = await supabaseAdmin
    .from("parents")
    .select(`
      id, full_name, phone, email, occupation, address, status, joined_date, profile_id,
      student_parents (
        students ( id, full_name, roll_no, attendance_pct, fee_status, status, sections ( name, grades ( level ) ) )
      )
    `)
    .eq("school_id", schoolId)
    .eq("id", id)
    .maybeSingle();

  if (!parentRow) notFound();

  const p = parentRow as unknown as ParentDetailRow;
  const parent = {
    id: p.id,
    name: p.full_name,
    phone: p.phone ?? "—",
    email: p.email ?? "—",
    occupation: p.occupation ?? "—",
    address: p.address ?? "—",
    joinedDate: formatDate(p.joined_date),
    active: p.status === "active",
  };

  const children = (p.student_parents ?? [])
    .map((sp) => sp.students)
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map((c) => ({
      id: c.id,
      name: c.full_name,
      rollNo: c.roll_no ?? "",
      classNum: String(c.sections?.grades?.level ?? "—"),
      section: c.sections?.name ?? "—",
      attendance: Math.round(Number(c.attendance_pct ?? 0)),
      feeStatus: c.fee_status ?? "overdue",
      active: c.status === "active",
    }));

  const childIds = children.map((c) => c.id);

  const [{ data: feeRows }, { data: convRows }] = await Promise.all([
    childIds.length
      ? supabaseAdmin
          .from("fee_payments")
          .select("student_id, amount_due, amount_paid")
          .eq("school_id", schoolId)
          .in("student_id", childIds)
      : Promise.resolve({ data: [] as ParentFeeRow[] }),

    p.profile_id
      ? supabaseAdmin
          .from("conversations")
          .select("last_message, last_time")
          .eq("school_id", schoolId)
          .or(`participant1.eq.${p.profile_id},participant2.eq.${p.profile_id}`)
          .order("last_time", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] as ParentConversationRow[] }),
  ]);

  const feeByChild = new Map<string, { due: number; paid: number }>();
  for (const r of (feeRows ?? []) as unknown as ParentFeeRow[]) {
    const entry = feeByChild.get(r.student_id) ?? { due: 0, paid: 0 };
    entry.due += Number(r.amount_due ?? 0);
    entry.paid += Number(r.amount_paid ?? 0);
    feeByChild.set(r.student_id, entry);
  }

  const totalFee = Array.from(feeByChild.values()).reduce((s, f) => s + f.due, 0);
  const paidFee  = Array.from(feeByChild.values()).reduce((s, f) => s + f.paid, 0);
  const feePct   = totalFee ? Math.round((paidFee / totalFee) * 100) : 0;

  const avgAttendance = children.length
    ? Math.round(children.reduce((s, c) => s + c.attendance, 0) / children.length)
    : 0;
  const ac = attColor(avgAttendance);

  const anyOverdue = children.some((c) => c.feeStatus === "overdue");
  const anyPartial = children.some((c) => c.feeStatus === "partial");
  const overallFee = anyOverdue ? "overdue" : anyPartial ? "partial" : "paid";

  const conversations = (convRows ?? []) as unknown as ParentConversationRow[];

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
        <ParentDetailActions parentId={parent.id} profileId={p.profile_id} />
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
            value: children.length ? `${avgAttendance}%` : "—",
            sub: children.length ? (avgAttendance >= 90 ? "Excellent" : avgAttendance >= 80 ? "Good" : "Needs attention") : "No children linked",
            icon: TrendingUp,
            color: `${ac.text} bg-emerald-500/10`,
          },
          {
            label: "Fee Status",
            value: children.length ? overallFee.charAt(0).toUpperCase() + overallFee.slice(1) : "—",
            sub: totalFee ? `₹${paidFee.toLocaleString("en-IN")} of ₹${totalFee.toLocaleString("en-IN")}` : "No fee records yet",
            icon: IndianRupee,
            color: overallFee === "paid" ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                 : overallFee === "partial" ? "text-amber-600 dark:text-amber-400 bg-amber-500/10"
                 : "text-red-600 dark:text-red-400 bg-red-500/10",
          },
          {
            label: "Messages",
            value: String(conversations.length),
            sub: conversations.length ? "recent conversations" : "No messages yet",
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
          <Phone className="h-4 w-4 text-primary-500" /> Contact Information
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
          <GraduationCap className="h-4 w-4 text-primary-500" />
          {children.length === 1 ? "Child" : "Children"} ({children.length})
        </p>
        {children.length === 0 ? (
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-8 text-center">
            <p className="text-sm text-gray-400 dark:text-zinc-500">No children linked to this parent yet.</p>
          </div>
        ) : (
          <div className={`grid gap-4 ${children.length > 1 ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
            {children.map((child) => {
              const ca   = attColor(child.attendance);
              const fee  = feeByChild.get(child.id) ?? { due: 0, paid: 0 };
              const feePct2 = fee.due ? Math.round((fee.paid / fee.due) * 100) : 0;

              return (
                <div key={child.id} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
                  {/* Child header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${avatarColor(child.id)}`}>
                      {initials(child.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 dark:text-zinc-50">{child.name}</p>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${child.active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"}`}>
                          {child.active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-zinc-500 mt-0.5">
                        <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> Class {child.classNum}–{child.section}</span>
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
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${FEE_BADGE[child.feeStatus] ?? FEE_BADGE.overdue}`}>
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
                      <p className="mt-1 text-[10px] text-gray-400 dark:text-zinc-500">₹{fee.paid.toLocaleString("en-IN")} paid</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fee summary */}
      {children.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-indigo-500" />
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Fee Summary</p>
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
              const fee = feeByChild.get(child.id) ?? { due: 0, paid: 0 };
              const pending = fee.due - fee.paid;
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
                    <p className="text-xs text-gray-400 dark:text-zinc-500">Class {child.classNum}–{child.section}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">₹{fee.paid.toLocaleString("en-IN")} <span className="text-xs font-normal text-gray-400 dark:text-zinc-500">paid</span></p>
                    {pending > 0 && (
                      <p className="text-xs text-red-500 dark:text-red-400">₹{pending.toLocaleString("en-IN")} pending</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent communications */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary-500" />
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Recent Communications</p>
        </div>
        {conversations.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-zinc-500 py-10 text-center">No messages with this parent yet.</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {conversations.map((c, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-[10px] font-bold mt-0.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-600 dark:text-zinc-400 leading-snug">{c.last_message ?? "—"}</p>
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500">{formatDate(c.last_time)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
