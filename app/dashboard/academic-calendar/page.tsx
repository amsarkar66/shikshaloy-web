import { ShieldAlert } from "lucide-react";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import AcademicCalendarClient from "./_components/AcademicCalendarClient";
import type { CalendarEvent } from "./_components/AcademicCalendarClient";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins and institution owners can manage the academic calendar.</p>
      </div>
    </div>
  );
}

export default async function AcademicCalendarPage() {
  const vu = await getVerifiedUser();
  const role = vu?.role;
  if (!vu || (role !== "admin" && role !== "super_admin")) return <Unauthorized />;

  const schoolId = await getCurrentSchoolIdOrThrow();
  const [{ data }, { data: schoolRow }] = await Promise.all([
    supabaseAdmin
      .from("academic_calendar")
      .select("id, title, date, date_to, type, description, affects_all, classes")
      .eq("school_id", schoolId)
      .order("date"),
    supabaseAdmin.from("schools").select("name").eq("id", schoolId).maybeSingle(),
  ]);

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

  return <AcademicCalendarClient initialEvents={events} schoolName={schoolRow?.name ?? "Shikshaloy"} />;
}
