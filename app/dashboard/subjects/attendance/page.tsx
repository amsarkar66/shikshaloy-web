import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldAlert, ArrowLeft, Clock, Users, CalendarOff, CheckCircle2 } from "lucide-react";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import SubjectPickerControls from "./_components/SubjectPickerControls";

interface SubjectRow {
  id: string;
  name: string;
}

interface SectionSubjectRow {
  section_id: string;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
}

interface SlotRow {
  id: string;
  period_number: number;
  profiles: { full_name: string | null } | null;
}

interface PeriodRow {
  number: number;
  start_time: string;
  end_time: string;
}

interface SessionRow {
  timetable_slot_id: string;
  id: string;
  conducted: boolean;
}

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins can cover subject attendance for any class. Teachers should use the &quot;Take Attendance&quot; link on their dashboard&apos;s Today&apos;s Schedule.</p>
      </div>
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{title}</p>
      </div>
    </div>
  );
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function SubjectAttendancePickerPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; section?: string; subject?: string }>;
}) {
  const vu = await getVerifiedUser();
  const role = vu?.role;
  if (!vu || (role !== "admin" && role !== "super_admin")) return <Unauthorized />;

  const { date, section, subject: subjectId } = await searchParams;
  if (!subjectId) return <EmptyState title="Open this from a subject's detail page to mark its attendance." />;

  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();
  const today = new Date().toISOString().split("T")[0];
  const dateStr = date && DATE_RE.test(date) ? date : today;

  const { data: subjectRow } = await supabaseAdmin
    .from("subjects")
    .select("id, name")
    .eq("id", subjectId)
    .eq("school_id", schoolId)
    .maybeSingle<SubjectRow>();

  if (!subjectRow) notFound();

  const { data: ssRows } = await supabaseAdmin
    .from("section_subjects")
    .select("section_id, sections ( name, grades ( level ) )")
    .eq("school_id", schoolId)
    .eq("subject_id", subjectId)
    .eq("academic_year_id", academicYearId);

  const sections = ((ssRows ?? []) as unknown as SectionSubjectRow[])
    .map((ss) => ({ id: ss.section_id, label: `${ss.sections?.grades?.level ?? "?"}-${ss.sections?.name ?? ""}` }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const backLink = (
    <Link href={`/dashboard/subjects/${subjectId}`} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors w-fit">
      <ArrowLeft className="h-4 w-4" /> Back to {subjectRow.name}
    </Link>
  );

  if (sections.length === 0) {
    return (
      <div className="w-full px-6 py-6 space-y-5">
        {backLink}
        <EmptyState title={`${subjectRow.name} isn't assigned to any class yet.`} />
      </div>
    );
  }

  const sectionId = section && sections.some((s) => s.id === section) ? section : sections[0].id;
  const dayOfWeek = new Date(dateStr + "T00:00:00").getDay() === 0 ? 6 : new Date(dateStr + "T00:00:00").getDay();

  const [{ data: slotRows }, { data: periodRows }, { count: enrolledCount }] = await Promise.all([
    supabaseAdmin
      .from("timetable_slots")
      .select("id, period_number, profiles ( full_name )")
      .eq("school_id", schoolId)
      .eq("section_id", sectionId)
      .eq("subject_id", subjectId)
      .eq("academic_year_id", academicYearId)
      .eq("day_of_week", dayOfWeek)
      .order("period_number"),

    supabaseAdmin
      .from("timetable_periods")
      .select("number, start_time, end_time")
      .eq("school_id", schoolId),

    supabaseAdmin
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("section_id", sectionId),
  ]);

  const slots = (slotRows ?? []) as unknown as SlotRow[];
  const timeByPeriod: Record<number, { start: string; end: string }> = {};
  for (const p of (periodRows ?? []) as unknown as PeriodRow[]) {
    timeByPeriod[p.number] = { start: p.start_time.slice(0, 5), end: p.end_time.slice(0, 5) };
  }

  const slotIds = slots.map((s) => s.id);
  const { data: sessionRows } = slotIds.length
    ? await supabaseAdmin.from("subject_attendance_sessions").select("id, timetable_slot_id, conducted").in("timetable_slot_id", slotIds).eq("date", dateStr)
    : { data: [] as SessionRow[] };

  const sessionBySlot: Record<string, SessionRow> = {};
  for (const s of (sessionRows ?? []) as unknown as SessionRow[]) sessionBySlot[s.timetable_slot_id] = s;

  const sessionIds = Object.values(sessionBySlot).map((s) => s.id);
  const { data: markedRows } = sessionIds.length
    ? await supabaseAdmin.from("subject_attendance").select("session_id").in("session_id", sessionIds)
    : { data: [] as { session_id: string }[] };

  const markedCountBySession: Record<string, number> = {};
  for (const r of markedRows ?? []) markedCountBySession[r.session_id] = (markedCountBySession[r.session_id] ?? 0) + 1;

  const total = enrolledCount ?? 0;
  const selectedLabel = sections.find((s) => s.id === sectionId)?.label ?? "";

  return (
    <div className="w-full px-6 py-6 space-y-5">
      {backLink}

      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Subject Attendance — {subjectRow.name}</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Cover a period for a teacher, or check whether classes are being marked.</p>
      </div>

      <SubjectPickerControls subjectId={subjectId} sections={sections} sectionId={sectionId} dateStr={dateStr} />

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        {slots.length === 0 ? (
          <div className="py-16 text-center"><Clock className="h-8 w-8 text-gray-300 dark:text-zinc-600 mx-auto mb-2"/><p className="text-sm text-gray-500 dark:text-zinc-400">{subjectRow.name} isn&apos;t scheduled for Class {selectedLabel} on this day</p></div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {slots.map((slot) => {
              const time = timeByPeriod[slot.period_number];
              const session = sessionBySlot[slot.id];
              const marked = session ? (markedCountBySession[session.id] ?? 0) : 0;
              return (
                <div key={slot.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-xs font-bold text-indigo-600 dark:text-indigo-400">P{slot.period_number}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 leading-tight">Class {selectedLabel}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{slot.profiles?.full_name ?? "—"}{time ? ` · ${time.start}–${time.end}` : ""}</p>
                  </div>
                  {session && !session.conducted ? (
                    <span className="hidden sm:flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400"><CalendarOff className="h-3.5 w-3.5"/> Not Conducted</span>
                  ) : session ? (
                    <span className="hidden sm:flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-zinc-400"><CheckCircle2 className="h-3.5 w-3.5"/> {marked}/{total} marked</span>
                  ) : (
                    <span className="hidden sm:flex items-center gap-1 text-xs font-medium text-gray-400 dark:text-zinc-500"><Users className="h-3.5 w-3.5"/> Not started</span>
                  )}
                  <Link href={`/dashboard/subjects/attendance/${slot.id}?date=${dateStr}`} className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-500/10 dark:hover:text-primary-400 transition-colors">
                    Mark Attendance
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
