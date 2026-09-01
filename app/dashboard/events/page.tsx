import { ShieldAlert } from "lucide-react";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import EventsClient from "./_components/EventsClient";
import type { SchoolEvent, AudienceType } from "./_data/events";
import type { PtmSession, Booking } from "../ptm/_data/ptm";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins can manage events.</p>
      </div>
    </div>
  );
}

function to12Hour(time: string): string {
  const [hRaw, mRaw] = time.split(":").map(Number);
  const ampm = hRaw >= 12 ? "PM" : "AM";
  const h12 = hRaw % 12 || 12;
  return `${h12}:${String(mRaw).padStart(2, "0")} ${ampm}`;
}

interface EventAudienceRow {
  event_id: string;
  audience_type: AudienceType;
}

interface PtmSessionRow {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  total_slots: number;
  status: string;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
  staff_members: { full_name: string | null } | null;
}

interface PtmSectionRow {
  id: string;
  name: string | null;
  grades: { level: number | null } | null;
}

interface PtmTeacherRow {
  id: string;
  full_name: string | null;
  designation: string | null;
}

interface PtmBookingRow {
  id: string;
  session_id: string;
  slot_time: string;
  status: string;
  students: { full_name: string | null } | null;
  parents: { full_name: string | null } | null;
}

export default async function EventsPage() {
  const vu = await getVerifiedUser();
  if (!vu || vu.role !== "admin") return <Unauthorized />;

  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const { data: eventRows } = await supabaseAdmin
    .from("school_events")
    .select("id, title, type, date, end_date, time, end_time, location, description, is_all_day, is_public")
    .eq("school_id", schoolId)
    .order("date");

  const eventIds = (eventRows ?? []).map((e) => e.id);

  const { data: audienceRows } = eventIds.length
    ? await supabaseAdmin
        .from("event_audiences")
        .select("event_id, audience_type")
        .in("event_id", eventIds)
    : { data: [] as EventAudienceRow[] };

  const audiencesByEvent: Record<string, AudienceType[]> = {};
  for (const a of (audienceRows ?? []) as unknown as EventAudienceRow[]) {
    (audiencesByEvent[a.event_id] ??= []).push(a.audience_type);
  }

  const initialEvents: SchoolEvent[] = (eventRows ?? []).map((e) => ({
    id: e.id,
    title: e.title ?? "",
    type: e.type ?? "other",
    date: e.date,
    endDate: e.end_date ?? undefined,
    time: e.time ?? undefined,
    endTime: e.end_time ?? undefined,
    location: e.location ?? undefined,
    description: e.description ?? "",
    audience: audiencesByEvent[e.id] ?? ["all"],
    isAllDay: e.is_all_day ?? true,
    isPublic: e.is_public ?? false,
  }));

  const [{ data: sessionRows }, { data: sectionRows }, { data: teacherRows }] = await Promise.all([
    supabaseAdmin
      .from("ptm_sessions")
      .select(`
        id, date, start_time, end_time, slot_minutes, total_slots, status,
        sections ( name, grades ( level ) ),
        staff_members ( full_name )
      `)
      .eq("school_id", schoolId)
      .order("date"),

    supabaseAdmin
      .from("sections")
      .select("id, name, grades ( level )")
      .eq("school_id", schoolId)
      .eq("academic_year_id", academicYearId)
      .order("name"),

    supabaseAdmin
      .from("staff_members")
      .select("id, full_name, designation")
      .eq("school_id", schoolId)
      .eq("type", "teaching")
      .order("full_name"),
  ]);

  const sessionIds = ((sessionRows ?? []) as unknown as PtmSessionRow[]).map((s) => s.id);
  const { data: bookingRows } = sessionIds.length
    ? await supabaseAdmin
        .from("ptm_bookings")
        .select(`
          id, session_id, slot_time, status,
          students ( full_name ),
          parents ( full_name )
        `)
        .in("session_id", sessionIds)
    : { data: [] as PtmBookingRow[] };

  const bookingsBySession: Record<string, Booking[]> = {};
  for (const b of (bookingRows ?? []) as unknown as PtmBookingRow[]) {
    (bookingsBySession[b.session_id] ??= []).push({
      id: b.id,
      time: to12Hour(b.slot_time),
      parentName: b.parents?.full_name ?? "—",
      studentName: b.students?.full_name ?? "—",
      status: b.status as Booking["status"],
    });
  }

  const initialSessions: PtmSession[] = ((sessionRows ?? []) as unknown as PtmSessionRow[]).map((s) => ({
    id: s.id,
    classNum: String(s.sections?.grades?.level ?? "?"),
    section: s.sections?.name ?? "",
    teacher: s.staff_members?.full_name ?? "—",
    date: s.date,
    startTime: to12Hour(s.start_time),
    endTime: to12Hour(s.end_time),
    slotMinutes: s.slot_minutes,
    totalSlots: s.total_slots,
    status: s.status as PtmSession["status"],
    bookings: bookingsBySession[s.id] ?? [],
  }));

  const sections = ((sectionRows ?? []) as unknown as PtmSectionRow[]).map((s) => ({ id: s.id, label: `${s.grades?.level ?? "?"}-${s.name}` }));
  const teachers = ((teacherRows ?? []) as unknown as PtmTeacherRow[]).map((t) => ({ id: t.id, name: t.full_name ?? "", designation: t.designation ?? "" }));

  return (
    <EventsClient
      initialEvents={initialEvents}
      initialSessions={initialSessions}
      sections={sections}
      teachers={teachers}
    />
  );
}
