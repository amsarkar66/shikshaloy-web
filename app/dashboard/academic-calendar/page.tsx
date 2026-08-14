import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import AcademicCalendarClient from "./_components/AcademicCalendarClient";
import type { CalendarEvent } from "./_components/AcademicCalendarClient";

export default async function AcademicCalendarPage() {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data } = await supabaseAdmin
    .from("academic_calendar")
    .select("id, title, date, date_to, type, description, affects_all, classes")
    .eq("school_id", schoolId)
    .order("date");

  const events: CalendarEvent[] = (data ?? []).map((e) => ({
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
