import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import {
  BookOpen, Users, ClipboardCheck, FileText,
  Calendar, ChevronRight, CheckCircle2, Clock,
  Award, GraduationCap, CalendarOff,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getTeacherContext } from "@/lib/teachers/context";

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

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

interface Stat { label: string; value: string; sub: string; icon: React.ElementType; accent: string }

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

interface ScheduleItem { time: string; label: string; done: boolean; now: boolean }

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
            <div key={i} className={`flex items-center gap-3 rounded-lg px-2 py-2 ${s.now ? "bg-primary-500/5 dark:bg-primary-500/10" : ""}`}>
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
                "text-gray-700 dark:text-zinc-300"
              }`}>{s.label}</span>
              {s.now && <span className="ml-auto text-[10px] font-semibold text-primary-600 dark:text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded-full">Now</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface HomeworkRow { title: string; sectionLabel: string; dueDate: string }

function RecentHomework({ rows }: { rows: HomeworkRow[] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Homework Assigned by Me</p>
        <Link href="/dashboard/homework" className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
          View all <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No homework assigned yet</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((h, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{h.title}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500">Class {h.sectionLabel}</p>
              </div>
              <span className="shrink-0 text-[11px] text-gray-400 dark:text-zinc-500">Due {formatDate(h.dueDate)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ExamRow { name: string; type: string; startDate: string }

function UpcomingExams({ rows }: { rows: ExamRow[] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Upcoming Exams</p>
        <Link href="/dashboard/grades" className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
          Enter grades <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">No upcoming exams</p>
      ) : (
        <div className="space-y-2.5">
          {rows.map((e, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <Award className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{e.name}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 capitalize">{e.type.replace("_", " ")}</p>
              </div>
              <span className="shrink-0 text-[11px] text-gray-400 dark:text-zinc-500">{formatDate(e.startDate)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const QUICK_ACTIONS = [
  { label: "Take Attendance", icon: ClipboardCheck, href: "/dashboard/attendance", color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/20" },
  { label: "Enter Grades",    icon: Award,           href: "/dashboard/grades",     color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20" },
  { label: "Assign Homework", icon: FileText,        href: "/dashboard/homework",   color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20" },
  { label: "Apply for Leave", icon: CalendarOff,     href: "/dashboard/leaves",     color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20" },
] as const;

function QuickActions() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-zinc-50">Quick Actions</p>
      <div className="grid grid-cols-2 gap-2">
        {QUICK_ACTIONS.map((a) => (
          <Link key={a.label} href={a.href} className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition-colors ${a.color}`}>
            <a.icon className="h-4 w-4" />
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export async function TeacherView({ user }: { user: User }) {
  const name = (user.user_metadata?.full_name as string)?.split(" ")[0] || "Teacher";
  const teacher = await getTeacherContext(user.id);

  if (!teacher) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-2xl">🍎</div>
          <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">No staff record linked to this login</p>
          <p className="max-w-sm text-sm text-gray-500 dark:text-zinc-400">
            This account doesn&apos;t have a staff record yet. Ask your school admin to link your login.
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
    { data: studentRows },
    { data: homeworkRows },
    { data: examRows },
  ] = await Promise.all([
    supabaseAdmin.from("timetable_periods")
      .select("number, start_time, end_time, is_break, break_label")
      .eq("school_id", teacher.schoolId)
      .order("start_time"),

    supabaseAdmin.from("timetable_slots")
      .select("period_number, subjects ( name ), sections ( name, grades ( level ) )")
      .eq("teacher_id", teacher.id)
      .eq("day_of_week", dayOfWeek),

    teacher.sectionIds.length
      ? supabaseAdmin.from("students").select("id").in("section_id", teacher.sectionIds)
      : Promise.resolve({ data: [] as { id: string }[] }),

    supabaseAdmin.from("homework")
      .select("title, due_date, sections ( name, grades ( level ) )")
      .eq("teacher_id", teacher.staffId)
      .order("due_date", { ascending: false })
      .limit(5),

    supabaseAdmin.from("exams")
      .select("name, type, status, start_date")
      .eq("school_id", teacher.schoolId)
      .eq("status", "upcoming")
      .order("start_date")
      .limit(5),
  ]);

  const slotByPeriod: Record<number, string> = {};
  for (const s of (slotRows ?? []) as unknown as {
    period_number: number;
    subjects: { name: string | null } | null;
    sections: { name: string | null; grades: { level: number | null } | null } | null;
  }[]) {
    const cls = `${s.sections?.grades?.level ?? "?"}-${s.sections?.name ?? ""}`;
    slotByPeriod[s.period_number] = `${s.subjects?.name ?? "Class"} — Class ${cls}`;
  }

  const scheduleItems: ScheduleItem[] = ((periodRows ?? []) as unknown as {
    number: number; start_time: string; end_time: string; is_break: boolean | null; break_label: string | null;
  }[])
    .filter((p) => p.is_break || slotByPeriod[p.number])
    .map((p) => {
      const [h, m] = p.start_time.split(":").map(Number);
      const [eh, em] = p.end_time.split(":").map(Number);
      const startMin = h * 60 + m, endMin = eh * 60 + em;
      const label = p.is_break ? (p.break_label ?? "Break") : slotByPeriod[p.number];
      return {
        time: p.start_time.slice(0, 5), label,
        done: nowMinutes >= endMin, now: nowMinutes >= startMin && nowMinutes < endMin,
      };
    });

  const homework: HomeworkRow[] = ((homeworkRows ?? []) as unknown as {
    title: string; due_date: string; sections: { name: string | null; grades: { level: number | null } | null } | null;
  }[]).map((h) => ({
    title: h.title,
    dueDate: h.due_date,
    sectionLabel: `${h.sections?.grades?.level ?? "?"}-${h.sections?.name ?? ""}`,
  }));
  const pendingHomeworkCount = homework.filter((h) => h.dueDate >= todayISO).length;

  const exams: ExamRow[] = ((examRows ?? []) as unknown as {
    name: string | null; type: string | null; status: string | null; start_date: string;
  }[]).map((e) => ({ name: e.name ?? "Exam", type: e.type ?? "unit_test", startDate: e.start_date }));

  const stats: Stat[] = [
    { label: "My Classes", value: String(teacher.sectionIds.length), sub: `${teacher.classTeacherSectionIds.length} as class teacher`, icon: BookOpen, accent: "text-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/15" },
    { label: "My Students", value: String(studentRows?.length ?? 0), sub: "across all sections", icon: Users, accent: "text-blue-500 bg-blue-500/10 dark:bg-blue-500/15" },
    { label: "Homework Pending", value: String(pendingHomeworkCount), sub: "due soon", icon: FileText, accent: "text-amber-500 bg-amber-500/10 dark:bg-amber-500/15" },
    { label: "Today's Periods", value: String(scheduleItems.filter((s) => !s.label.includes("Break")).length || Object.keys(slotByPeriod).length), sub: "on my timetable", icon: GraduationCap, accent: "text-violet-500 bg-violet-500/10 dark:bg-violet-500/15" },
  ];

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50">{getGreeting()}, {name} 👋</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-zinc-400">{teacher.designation} · {formatHeaderDate()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} stat={s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TodaySchedule items={scheduleItems} />
          <RecentHomework rows={homework} />
        </div>
        <div className="space-y-5">
          <QuickActions />
          <UpcomingExams rows={exams} />
        </div>
      </div>
    </div>
  );
}
