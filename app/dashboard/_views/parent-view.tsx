import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import {
  IndianRupee, FileText, ClipboardCheck,
  ChevronRight, Megaphone, Users2, CalendarClock, Award,
  GraduationCap,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getParentContext, type ParentChild } from "@/lib/parents/context";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatHeaderDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatCurrency(n: number) {
  return n >= 100000 ? `₹${(n / 100000).toFixed(1)}L` : `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function to12Hour(time: string): string {
  const [hRaw, mRaw] = time.split(":").map(Number);
  const ampm = hRaw >= 12 ? "PM" : "AM";
  const h12 = hRaw % 12 || 12;
  return `${h12}:${String(mRaw).padStart(2, "0")} ${ampm}`;
}

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

const FEE_BADGE: Record<string, string> = {
  paid:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  partial: "bg-amber-500/10   text-amber-600   dark:text-amber-400",
  overdue: "bg-red-500/10     text-red-600     dark:text-red-400",
};

interface Stat {
  label: string; value: string; sub: string;
  icon: React.ElementType; accent: string;
}

function StatCard({ stat }: { stat: Stat }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.accent}`}>
          <stat.icon className="h-4 w-4" />
        </div>
        <span className="text-[11px] text-gray-400 dark:text-zinc-500 text-right">{stat.sub}</span>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">{stat.value}</p>
        <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-zinc-400">{stat.label}</p>
      </div>
    </div>
  );
}

function ChildrenRow({ childList, feeDueByChild }: { childList: ParentChild[]; feeDueByChild: Record<string, number> }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">My Children</p>
        <Link href="/dashboard/children" className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {childList.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/children/${c.id}`}
            className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-zinc-700/50 p-3 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-500/5 transition-colors"
          >
            {c.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.photoUrl} alt={c.fullName} className="h-11 w-11 shrink-0 rounded-xl object-cover" />
            ) : (
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${avatarColor(c.id)}`}>
                {initials(c.fullName)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">{c.fullName}</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500">
                {c.gradeLevel ? `Class ${c.gradeLevel}-${c.sectionName}` : "No class assigned"} · Roll {c.rollNo || "—"}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">{c.attendancePct}%</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase ${FEE_BADGE[c.feeStatus] ?? FEE_BADGE.overdue}`}>
                {(feeDueByChild[c.id] ?? 0) > 0 ? `Due ${formatCurrency(feeDueByChild[c.id])}` : c.feeStatus}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

interface PtmRow { id: string; classLabel: string; teacher: string; date: string; startTime: string; endTime: string; booked: boolean }

function UpcomingPtm({ rows }: { rows: PtmRow[] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Upcoming Parent-Teacher Meetings</p>
        <Link href="/dashboard/ptm" className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">No PTM sessions scheduled</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <CalendarClock className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{r.classLabel} · {r.teacher}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500">{formatDate(r.date)} · {r.startTime} – {r.endTime}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.booked ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"}`}>
                {r.booked ? "Booked" : "Book slot"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface HomeworkRow { childName: string; title: string; subject: string; dueDate: string; submitted: boolean }

function HomeworkDue({ rows }: { rows: HomeworkRow[] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Homework Due</p>
        <FileText className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
      </div>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">No homework pending</p>
      ) : (
        <div className="space-y-1">
          {rows.map((h, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-2">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${h.submitted ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                <FileText className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{h.title}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500">{h.childName} · {h.subject}</p>
              </div>
              <span className="shrink-0 text-[11px] text-gray-400 dark:text-zinc-500">Due {formatDate(h.dueDate)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface GradeRow { childName: string; exam: string; subject: string; marks: number; max: number; grade: string }

function RecentGrades({ rows }: { rows: GradeRow[] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Recent Grades</p>
        <Award className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
      </div>
      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No results published yet</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Award className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{r.subject}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500">{r.childName} · {r.exam}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{r.marks}/{r.max}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500">{r.grade}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface AnnouncementRow { title: string; priority: string }

function Announcements({ rows }: { rows: AnnouncementRow[] }) {
  const badge: Record<string, string> = {
    urgent: "text-red-600 dark:text-red-400 bg-red-500/10",
    normal: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
    info:   "text-gray-500 dark:text-zinc-400 bg-gray-500/10",
  };
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Announcements</p>
        <Megaphone className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
      </div>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">No announcements</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((a, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase ${badge[a.priority] ?? badge.info}`}>{a.priority}</span>
              <p className="text-sm text-gray-700 dark:text-zinc-300 leading-snug">{a.title}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export async function ParentView({ user }: { user: User }) {
  const name = (user.user_metadata?.full_name as string)?.split(" ")[0] || "Parent";
  const parent = await getParentContext(user.id);

  if (!parent) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-2xl">💚</div>
          <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">No parent record linked to this login</p>
          <p className="max-w-sm text-sm text-gray-500 dark:text-zinc-400">
            This account doesn&apos;t have a parent record yet. Ask your school admin to link your login to your child&apos;s profile.
          </p>
        </div>
      </div>
    );
  }

  if (parent.children.length === 0) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-2xl">👨‍👩‍👧</div>
          <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">No children linked to this account yet</p>
          <p className="max-w-sm text-sm text-gray-500 dark:text-zinc-400">
            Ask your school admin to link your child&apos;s student record to your account.
          </p>
        </div>
      </div>
    );
  }

  const todayISO = new Date().toISOString().slice(0, 10);
  const childIds = parent.children.map((c) => c.id);
  const sectionIds = Array.from(new Set(parent.children.map((c) => c.sectionId).filter((x): x is string => !!x)));
  const childById = new Map(parent.children.map((c) => [c.id, c]));

  const [
    { data: feeRows },
    { data: homeworkRows },
    { data: submissionRows },
    { data: announcementRows },
    { data: ptmSessionRows },
    { data: ptmBookingRows },
    { data: examResultRows },
  ] = await Promise.all([
    supabaseAdmin
      .from("fee_payments")
      .select("student_id, month_str, amount_due, amount_paid")
      .in("student_id", childIds)
      .order("month_str", { ascending: false }),

    sectionIds.length
      ? supabaseAdmin
          .from("homework")
          .select("id, title, due_date, section_id, subjects ( name )")
          .in("section_id", sectionIds)
          .eq("status", "active")
          .gte("due_date", todayISO)
          .order("due_date")
      : Promise.resolve({ data: [] as { id: string; title: string | null; due_date: string; section_id: string; subjects: { name: string | null } | null }[] }),

    supabaseAdmin.from("homework_submissions").select("homework_id, student_id").in("student_id", childIds),

    supabaseAdmin
      .from("announcements")
      .select("title, priority, audience, target_section_id, created_at")
      .eq("school_id", parent.schoolId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(15),

    sectionIds.length
      ? supabaseAdmin
          .from("ptm_sessions")
          .select("id, date, start_time, end_time, status, section_id, sections ( name, grades ( level ) ), staff_members ( full_name )")
          .in("section_id", sectionIds)
          .eq("status", "scheduled")
          .gte("date", todayISO)
          .order("date")
      : Promise.resolve({ data: [] as { id: string; date: string; start_time: string; end_time: string; status: string; section_id: string; sections: { name: string | null; grades: { level: number | null } | null } | null; staff_members: { full_name: string | null } | null }[] }),

    supabaseAdmin.from("ptm_bookings").select("session_id").eq("parent_id", parent.id),

    supabaseAdmin
      .from("exam_results")
      .select("student_id, marks_obtained, max_marks, grade, exams ( name, status, start_date ), subjects ( name )")
      .in("student_id", childIds)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Fees
  const feeDueByChild: Record<string, number> = {};
  const latestFeeSeen = new Set<string>();
  let totalFeeDue = 0;
  for (const f of (feeRows ?? []) as { student_id: string; month_str: string; amount_due: number | null; amount_paid: number | null }[]) {
    if (latestFeeSeen.has(f.student_id)) continue;
    latestFeeSeen.add(f.student_id);
    const due = Math.max(Number(f.amount_due ?? 0) - Number(f.amount_paid ?? 0), 0);
    feeDueByChild[f.student_id] = due;
    totalFeeDue += due;
  }

  // Homework
  const submittedIds = new Set(((submissionRows ?? []) as { homework_id: string; student_id: string }[]).map((s) => `${s.homework_id}::${s.student_id}`));
  const homeworkDue: HomeworkRow[] = [];
  for (const h of (homeworkRows ?? []) as { id: string; title: string | null; due_date: string; section_id: string; subjects: { name: string | null } | null }[]) {
    for (const c of parent.children) {
      if (c.sectionId !== h.section_id) continue;
      homeworkDue.push({
        childName: c.fullName,
        title: h.title ?? "",
        subject: h.subjects?.name ?? "Subject",
        dueDate: h.due_date,
        submitted: submittedIds.has(`${h.id}::${c.id}`),
      });
    }
  }
  const pendingHomeworkCount = homeworkDue.filter((h) => !h.submitted).length;

  // Announcements — school-wide, parent audience, or targeted at any child's section
  const announcements: AnnouncementRow[] = ((announcementRows ?? []) as {
    title: string | null; priority: string | null; audience: string; target_section_id: string | null; created_at: string;
  }[])
    .filter((a) => a.audience === "all" || a.audience === "parents" || (a.audience === "class" && sectionIds.includes(a.target_section_id ?? "")))
    .slice(0, 5)
    .map((a) => ({ title: a.title ?? "", priority: a.priority ?? "normal" }));

  // PTM
  const bookedSessionIds = new Set(((ptmBookingRows ?? []) as { session_id: string }[]).map((b) => b.session_id));
  const ptmRows: PtmRow[] = ((ptmSessionRows ?? []) as {
    id: string; date: string; start_time: string; end_time: string; status: string; section_id: string;
    sections: { name: string | null; grades: { level: number | null } | null } | null;
    staff_members: { full_name: string | null } | null;
  }[]).slice(0, 5).map((s) => ({
    id: s.id,
    classLabel: `Class ${s.sections?.grades?.level ?? "?"}-${s.sections?.name ?? ""}`,
    teacher: s.staff_members?.full_name ?? "—",
    date: s.date,
    startTime: to12Hour(s.start_time),
    endTime: to12Hour(s.end_time),
    booked: bookedSessionIds.has(s.id),
  }));

  // Grades
  const grades: GradeRow[] = ((examResultRows ?? []) as unknown as {
    student_id: string; marks_obtained: number | null; max_marks: number | null; grade: string | null;
    exams: { name: string | null; status: string | null; start_date: string } | null;
    subjects: { name: string | null } | null;
  }[])
    .filter((r) => r.exams?.status === "published")
    .slice(0, 5)
    .map((r) => ({
      childName: childById.get(r.student_id)?.fullName ?? "—",
      exam: r.exams?.name ?? "Exam",
      subject: r.subjects?.name ?? "Subject",
      marks: Math.round(Number(r.marks_obtained ?? 0)),
      max: Math.round(Number(r.max_marks ?? 100)),
      grade: r.grade ?? "—",
    }));

  const avgAttendance = Math.round(parent.children.reduce((s, c) => s + c.attendancePct, 0) / parent.children.length);

  const stats: Stat[] = [
    { label: "My Children", value: String(parent.children.length), sub: "Enrolled", icon: Users2, accent: "text-rose-500 bg-rose-500/10 dark:bg-rose-500/15" },
    { label: "Avg. Attendance", value: `${avgAttendance}%`, sub: "This year", icon: ClipboardCheck, accent: "text-sky-500 bg-sky-500/10 dark:bg-sky-500/15" },
    { label: "Fees Due", value: formatCurrency(totalFeeDue), sub: "Current month", icon: IndianRupee, accent: "text-amber-500 bg-amber-500/10 dark:bg-amber-500/15" },
    { label: "Homework Pending", value: String(pendingHomeworkCount), sub: "Across children", icon: GraduationCap, accent: "text-violet-500 bg-violet-500/10 dark:bg-violet-500/15" },
  ];

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50">{getGreeting()}, {name} 👋</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-zinc-400">{formatHeaderDate()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} stat={s} />)}
      </div>

      <ChildrenRow childList={parent.children} feeDueByChild={feeDueByChild} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <UpcomingPtm rows={ptmRows} />
          <RecentGrades rows={grades} />
        </div>
        <div className="space-y-5">
          <HomeworkDue rows={homeworkDue} />
          <Announcements rows={announcements} />
        </div>
      </div>
    </div>
  );
}
