import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import {
  ClipboardCheck, FileText,
  Calendar, ChevronRight, CheckCircle2, Clock,
  IndianRupee, Award, Megaphone, GraduationCap,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getStudentContext } from "@/lib/students/context";

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

interface ScheduleItem { time: string; label: string; done: boolean; now: boolean; isBreak: boolean }

function TodaySchedule({ items }: { items: ScheduleItem[] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Today&apos;s Schedule</p>
        <Calendar className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">Nothing scheduled today</p>
      ) : (
        <div className="space-y-1">
          {items.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 rounded-lg px-2 py-2 ${s.now ? "bg-indigo-500/5 dark:bg-indigo-500/10" : ""}`}>
              <span className={`w-10 shrink-0 text-[11px] font-mono font-semibold ${
                s.done ? "text-gray-300 dark:text-zinc-600" :
                s.now  ? "text-indigo-600 dark:text-indigo-400" :
                "text-gray-500 dark:text-zinc-400"
              }`}>{s.time}</span>
              <div className="flex h-4 w-4 shrink-0 items-center justify-center">
                {s.done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  : s.now ? <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                  : <Clock className="h-3.5 w-3.5 text-gray-300 dark:text-zinc-600" />}
              </div>
              <span className={`text-xs font-medium ${
                s.done ? "line-through text-gray-400 dark:text-zinc-600" :
                s.now  ? "text-indigo-700 dark:text-indigo-300" :
                s.isBreak ? "text-gray-400 dark:text-zinc-500 italic" :
                "text-gray-700 dark:text-zinc-300"
              }`}>{s.label}</span>
              {s.now && <span className="ml-auto text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full">Now</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface GradeRow { exam: string; subject: string; marks: number; max: number; grade: string }

function RecentGrades({ rows }: { rows: GradeRow[] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Recent Grades</p>
        <Link href="/dashboard/grades" className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
          View all <ChevronRight className="h-3 w-3" />
        </Link>
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
                <p className="text-xs text-gray-400 dark:text-zinc-500">{r.exam}</p>
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

interface HomeworkRow { title: string; subject: string; dueDate: string; submitted: boolean }

function HomeworkDue({ rows }: { rows: HomeworkRow[] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Homework Due</p>
        <Link href="/dashboard/homework" className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
          View all <ChevronRight className="h-3 w-3" />
        </Link>
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
                <p className="text-xs text-gray-400 dark:text-zinc-500">{h.subject}</p>
              </div>
              <span className="shrink-0 text-[11px] text-gray-400 dark:text-zinc-500">Due {formatDate(h.dueDate)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface AnnouncementRow { title: string; priority: string; createdAt: string }

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

export async function StudentView({ user }: { user: User }) {
  const name = (user.user_metadata?.full_name as string)?.split(" ")[0] || "Student";
  const student = await getStudentContext(user.id);

  if (!student) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-2xl">🎓</div>
          <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">No student record linked to this login</p>
          <p className="max-w-sm text-sm text-gray-500 dark:text-zinc-400">
            This account doesn&apos;t have an enrolled student record yet. Ask your school admin to enroll you or link your login.
          </p>
        </div>
      </div>
    );
  }

  const todayISO = new Date().toISOString().slice(0, 10);
  const dayOfWeek = new Date().getDay() === 0 ? 6 : new Date().getDay();
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  const [
    { data: periodRows },
    { data: slotRows },
    { data: examResultRows },
    { data: homeworkRows },
    { data: submissionRows },
    { data: feeRows },
    { data: announcementRows },
  ] = await Promise.all([
    supabaseAdmin.from("timetable_periods")
      .select("number, start_time, end_time, is_break, break_label")
      .eq("school_id", student.schoolId)
      .order("start_time"),

    student.sectionId
      ? supabaseAdmin.from("timetable_slots")
          .select("period_number, subjects ( name )")
          .eq("school_id", student.schoolId)
          .eq("section_id", student.sectionId)
          .eq("day_of_week", dayOfWeek)
      : Promise.resolve({ data: [] as any[] }),

    supabaseAdmin.from("exam_results")
      .select("marks_obtained, max_marks, grade, exams ( name, start_date ), subjects ( name )")
      .eq("student_id", student.id)
      .order("created_at", { ascending: false })
      .limit(5),

    student.sectionId
      ? supabaseAdmin.from("homework")
          .select("id, title, due_date, subjects ( name )")
          .eq("section_id", student.sectionId)
          .eq("status", "active")
          .gte("due_date", todayISO)
          .order("due_date")
          .limit(5)
      : Promise.resolve({ data: [] as any[] }),

    supabaseAdmin.from("homework_submissions").select("homework_id").eq("student_id", student.id),

    supabaseAdmin.from("fee_payments")
      .select("month_str, amount_due, amount_paid")
      .eq("student_id", student.id)
      .order("month_str", { ascending: false })
      .limit(1),

    supabaseAdmin.from("announcements")
      .select("title, priority, audience, target_section_id, created_at")
      .eq("school_id", student.schoolId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const submittedIds = new Set(((submissionRows ?? []) as any[]).map((s) => s.homework_id));
  const slotByPeriod: Record<number, string> = {};
  for (const s of (slotRows ?? []) as any[]) {
    slotByPeriod[s.period_number] = s.subjects?.name ?? "Class";
  }

  const scheduleItems: ScheduleItem[] = ((periodRows ?? []) as any[]).map((p) => {
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

  const grades: GradeRow[] = ((examResultRows ?? []) as any[]).map((r) => ({
    exam: r.exams?.name ?? "Exam",
    subject: r.subjects?.name ?? "Subject",
    marks: Math.round(Number(r.marks_obtained ?? 0)),
    max: Math.round(Number(r.max_marks ?? 100)),
    grade: r.grade ?? "—",
  }));

  const homeworkDue: HomeworkRow[] = ((homeworkRows ?? []) as any[]).map((h) => ({
    title: h.title, subject: h.subjects?.name ?? "Subject",
    dueDate: h.due_date, submitted: submittedIds.has(h.id),
  }));
  const pendingHomeworkCount = homeworkDue.filter((h) => !h.submitted).length;

  const latestFee = feeRows?.[0] as any;
  const feeDue = latestFee ? Math.max(Number(latestFee.amount_due ?? 0) - Number(latestFee.amount_paid ?? 0), 0) : 0;

  const announcements: AnnouncementRow[] = ((announcementRows ?? []) as any[])
    .filter((a) => a.audience === "all" || a.audience === "students" || (a.audience === "class" && a.target_section_id === student.sectionId))
    .slice(0, 5)
    .map((a) => ({ title: a.title, priority: a.priority ?? "normal", createdAt: a.created_at }));

  const classLabel = student.gradeLevel ? `Class ${student.gradeLevel}-${student.sectionName}` : "—";

  const stats: Stat[] = [
    { label: "My Attendance", value: `${student.attendancePct}%`, sub: "This year", icon: ClipboardCheck, accent: "text-sky-500 bg-sky-500/10 dark:bg-sky-500/15" },
    { label: "Fees Due", value: formatCurrency(feeDue), sub: latestFee?.month_str ?? "—", icon: IndianRupee, accent: "text-amber-500 bg-amber-500/10 dark:bg-amber-500/15" },
    { label: "Homework Pending", value: String(pendingHomeworkCount), sub: "This week", icon: FileText, accent: "text-violet-500 bg-violet-500/10 dark:bg-violet-500/15" },
    { label: "My Class", value: classLabel, sub: `Roll No ${student.rollNo}`, icon: GraduationCap, accent: "text-blue-500 bg-blue-500/10 dark:bg-blue-500/15" },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TodaySchedule items={scheduleItems} />
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
