import { supabaseAdmin, DEMO_SCHOOL_ID, DEMO_AY_ID } from "@/lib/supabase/service";
import EventsClient from "./_components/EventsClient";
import type { SchoolEvent, AudienceType } from "./_data/events";
import type { PtmSession, Booking } from "../ptm/_data/ptm";

function to12Hour(time: string): string {
  const [hRaw, mRaw] = time.split(":").map(Number);
  const ampm = hRaw >= 12 ? "PM" : "AM";
  const h12 = hRaw % 12 || 12;
  return `${h12}:${String(mRaw).padStart(2, "0")} ${ampm}`;
}

export default async function EventsPage() {
  const { data: eventRows } = await supabaseAdmin
    .from("school_events")
    .select("id, title, type, date, end_date, time, end_time, location, description, is_all_day")
    .eq("school_id", DEMO_SCHOOL_ID)
    .order("date");

  const eventIds = (eventRows ?? []).map((e: any) => e.id);

  const { data: audienceRows } = eventIds.length
    ? await supabaseAdmin
        .from("event_audiences")
        .select("event_id, audience_type")
        .in("event_id", eventIds)
    : { data: [] as any[] };

  const audiencesByEvent: Record<string, AudienceType[]> = {};
  for (const a of (audienceRows ?? []) as any[]) {
    (audiencesByEvent[a.event_id] ??= []).push(a.audience_type);
  }

  const initialEvents: SchoolEvent[] = (eventRows ?? []).map((e: any) => ({
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
  }));

  const [{ data: sessionRows }, { data: sectionRows }, { data: teacherRows }] = await Promise.all([
    supabaseAdmin
      .from("ptm_sessions")
      .select(`
        id, date, start_time, end_time, slot_minutes, total_slots, status,
        sections ( name, grades ( level ) ),
        staff_members ( full_name )
      `)
      .eq("school_id", DEMO_SCHOOL_ID)
      .order("date"),

    supabaseAdmin
      .from("sections")
      .select("id, name, grades ( level )")
      .eq("school_id", DEMO_SCHOOL_ID)
      .eq("academic_year_id", DEMO_AY_ID)
      .order("name"),

    supabaseAdmin
      .from("staff_members")
      .select("id, full_name, designation")
      .eq("school_id", DEMO_SCHOOL_ID)
      .eq("type", "teaching")
      .order("full_name"),
  ]);

  const sessionIds = (sessionRows ?? []).map((s: any) => s.id);
  const { data: bookingRows } = sessionIds.length
    ? await supabaseAdmin
        .from("ptm_bookings")
        .select(`
          id, session_id, slot_time, status,
          students ( full_name ),
          parents ( full_name )
        `)
        .in("session_id", sessionIds)
    : { data: [] as any[] };

  const bookingsBySession: Record<string, Booking[]> = {};
  for (const b of (bookingRows ?? []) as any[]) {
    (bookingsBySession[b.session_id] ??= []).push({
      id: b.id,
      time: to12Hour(b.slot_time),
      parentName: b.parents?.full_name ?? "—",
      studentName: b.students?.full_name ?? "—",
      status: b.status,
    });
  }

  const initialSessions: PtmSession[] = ((sessionRows ?? []) as any[]).map((s) => ({
    id: s.id,
    classNum: String(s.sections?.grades?.level ?? "?"),
    section: s.sections?.name ?? "",
    teacher: s.staff_members?.full_name ?? "—",
    date: s.date,
    startTime: to12Hour(s.start_time),
    endTime: to12Hour(s.end_time),
    slotMinutes: s.slot_minutes,
    totalSlots: s.total_slots,
    status: s.status,
    bookings: bookingsBySession[s.id] ?? [],
  }));

  const sections = ((sectionRows ?? []) as any[]).map((s) => ({ id: s.id, label: `${s.grades?.level ?? "?"}-${s.name}` }));
  const teachers = ((teacherRows ?? []) as any[]).map((t) => ({ id: t.id, name: t.full_name, designation: t.designation }));

  return (
    <EventsClient
      initialEvents={initialEvents}
      initialSessions={initialSessions}
      sections={sections}
      teachers={teachers}
    />
  );
}
