import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import AcademicCalendarClient from "./_components/AcademicCalendarClient";
import type { CalendarEvent } from "./_components/AcademicCalendarClient";

export default async function AcademicCalendarPage() {
  const { data } = await supabaseAdmin
    .from("academic_calendar")
    .select("id, title, date, date_to, type, description, affects_all, classes")
    .eq("school_id", DEMO_SCHOOL_ID)
    .order("date");

  const events: CalendarEvent[] = (data ?? []).map((e: any) => ({
    id:          e.id,
    title:       e.title,
    date:        e.date ?? "",
    dateTo:      e.date_to ?? undefined,
    type:        e.type ?? "event",
    description: e.description ?? undefined,
    affectsAll:  e.affects_all ?? true,
    classes:     e.classes ?? undefined,
  }));

  return <AcademicCalendarClient initialEvents={events} />;
}
