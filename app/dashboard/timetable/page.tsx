import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin, DEMO_SCHOOL_ID, DEMO_AY_ID } from "@/lib/supabase/service";
import { getStudentContext } from "@/lib/students/context";
import TimetableClient from "./_components/TimetableClient";
import { StudentTimetableGrid } from "./_components/StudentTimetableGrid";
import type { Period, RowItem, ClassTimetable, Slot, Day } from "./_data/timetable";
import { DAYS } from "./_data/timetable";

async function StudentTimetable({ userId }: { userId: string }) {
  const student = await getStudentContext(userId);

  if (!student || !student.sectionId) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">No class assigned yet</p>
        </div>
      </div>
    );
  }

  const [{ data: periodRows }, { data: slotRows }] = await Promise.all([
    supabaseAdmin
      .from("timetable_periods")
      .select("number, start_time, end_time, is_break, break_label")
      .eq("school_id", student.schoolId)
      .order("start_time"),

    supabaseAdmin
      .from("timetable_slots")
      .select(`
        day_of_week, period_number, room,
        subjects ( name, code ),
        profiles ( full_name )
      `)
      .eq("school_id", student.schoolId)
      .eq("section_id", student.sectionId)
      .eq("academic_year_id", student.academicYearId ?? ""),
  ]);

  const rowItems: RowItem[] = ((periodRows ?? []) as any[])
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .map((p) =>
      p.is_break
        ? { type: "break" as const, label: p.break_label ?? "Break", time: `${p.start_time.slice(0, 5)} – ${p.end_time.slice(0, 5)}` }
        : { type: "period" as const, period: { num: p.number, start: p.start_time.slice(0, 5), end: p.end_time.slice(0, 5) } }
    );

  const tt: ClassTimetable = DAYS.reduce((acc, d) => ({ ...acc, [d]: {} }), {} as ClassTimetable);
  for (const slot of (slotRows ?? []) as any[]) {
    const day: Day | undefined = DAYS[slot.day_of_week - 1];
    if (!day) continue;
    const subjectName: string = slot.subjects?.name ?? "Subject";
    const subjectCode: string = slot.subjects?.code ?? subjectName.slice(0, 3).toUpperCase();
    tt[day][slot.period_number] = {
      subject: subjectCode, name: subjectName,
      teacher: slot.profiles?.full_name ?? "—", room: slot.room ?? "—",
    };
  }

  return (
    <div className="w-full px-6 py-6">
      <StudentTimetableGrid tt={tt} rowItems={rowItems} classLabel={`${student.gradeLevel}-${student.sectionName}`} />
    </div>
  );
}

export default async function TimetablePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role as string | undefined;

  if (role === "student" && user) {
    return <StudentTimetable userId={user.id} />;
  }

  const [{ data: periodRows }, { data: sectionRows }, { data: slotRows }] = await Promise.all([
    supabaseAdmin
      .from("timetable_periods")
      .select("number, start_time, end_time, is_break, break_label")
      .eq("school_id", DEMO_SCHOOL_ID)
      .order("start_time"),

    supabaseAdmin
      .from("sections")
      .select("id, name, grades ( level )")
      .eq("school_id", DEMO_SCHOOL_ID)
      .eq("academic_year_id", DEMO_AY_ID)
      .order("name"),

    supabaseAdmin
      .from("timetable_slots")
      .select(`
        section_id, day_of_week, period_number, room,
        subjects ( name, code ),
        profiles ( full_name )
      `)
      .eq("school_id", DEMO_SCHOOL_ID)
      .eq("academic_year_id", DEMO_AY_ID),
  ]);

  const periods: Period[] = ((periodRows ?? []) as any[])
    .filter((p) => !p.is_break)
    .map((p) => ({ num: p.number, start: p.start_time.slice(0, 5), end: p.end_time.slice(0, 5) }));

  const rowItems: RowItem[] = ((periodRows ?? []) as any[])
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .map((p) =>
      p.is_break
        ? { type: "break" as const, label: p.break_label ?? "Break", time: `${p.start_time.slice(0, 5)} – ${p.end_time.slice(0, 5)}` }
        : { type: "period" as const, period: { num: p.number, start: p.start_time.slice(0, 5), end: p.end_time.slice(0, 5) } }
    );

  const sectionLabel: Record<string, string> = {};
  const classList: string[] = [];
  for (const s of (sectionRows ?? []) as any[]) {
    const label = `${s.grades?.level ?? "?"}-${s.name ?? ""}`;
    sectionLabel[s.id] = label;
    classList.push(label);
  }

  const timetables: Record<string, ClassTimetable> = {};
  for (const label of classList) {
    timetables[label] = DAYS.reduce((acc, d) => ({ ...acc, [d]: {} }), {} as ClassTimetable);
  }

  for (const slot of (slotRows ?? []) as any[]) {
    const label = sectionLabel[slot.section_id];
    if (!label) continue;
    const day: Day | undefined = DAYS[slot.day_of_week - 1];
    if (!day) continue;
    const subjectName: string = slot.subjects?.name ?? "Subject";
    const subjectCode: string = slot.subjects?.code ?? subjectName.slice(0, 3).toUpperCase();
    const entry: Slot = {
      subject: subjectCode,
      name: subjectName,
      teacher: slot.profiles?.full_name ?? "—",
      room: slot.room ?? "—",
    };
    timetables[label][day] = { ...timetables[label][day], [slot.period_number]: entry };
  }

  return (
    <TimetableClient
      periods={periods}
      rowItems={rowItems}
      classList={classList}
      timetables={timetables}
    />
  );
}
