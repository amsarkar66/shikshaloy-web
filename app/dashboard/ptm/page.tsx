import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getTeacherContext } from "@/lib/teachers/context";
import { getParentContext } from "@/lib/parents/context";
import MyPtmClient from "./_components/MyPtmClient";
import ParentPtmClient, { type ParentPtmSession, type ParentPtmBooking } from "./_components/ParentPtmClient";
import type { PtmSession, Booking } from "./_data/ptm";

function to12Hour(time: string): string {
  const [hRaw, mRaw] = time.split(":").map(Number);
  const ampm = hRaw >= 12 ? "PM" : "AM";
  const h12 = hRaw % 12 || 12;
  return `${h12}:${String(mRaw).padStart(2, "0")} ${ampm}`;
}

function buildSlotTimes(startTime: string, slotMinutes: number, totalSlots: number): string[] {
  const [h, m] = startTime.split(":").map(Number);
  const slots: string[] = [];
  for (let i = 0; i < totalSlots; i++) {
    const total = h * 60 + m + i * slotMinutes;
    const hh = Math.floor(total / 60) % 24;
    const mm = total % 60;
    slots.push(`${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
  }
  return slots;
}

interface ParentSessionRow {
  id: string; date: string; start_time: string; slot_minutes: number; total_slots: number;
  status: string; section_id: string;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
  staff_members: { full_name: string | null } | null;
}

interface ParentBookingRow {
  id: string; session_id: string; slot_time: string; status: string; student_id: string;
}

interface MyBookingRow {
  id: string; session_id: string; slot_time: string; status: string;
  ptm_sessions: { date: string; status: string; sections: { name: string | null; grades: { level: number | null } | null } | null; staff_members: { full_name: string | null } | null } | null;
  students: { full_name: string | null } | null;
}

async function ParentPtm({ userId }: { userId: string }) {
  const parent = await getParentContext(userId);

  if (!parent) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">No parent record linked to this login</p>
        </div>
      </div>
    );
  }

  const sectionIds = Array.from(new Set(parent.children.map((c) => c.sectionId).filter((x): x is string => !!x)));
  const childrenBySection: Record<string, { id: string; name: string }[]> = {};
  for (const c of parent.children) {
    if (!c.sectionId) continue;
    (childrenBySection[c.sectionId] ??= []).push({ id: c.id, name: c.fullName });
  }

  const [{ data: sessionRows }, { data: myBookingRows }] = await Promise.all([
    sectionIds.length
      ? supabaseAdmin
          .from("ptm_sessions")
          .select("id, date, start_time, slot_minutes, total_slots, status, section_id, sections ( name, grades ( level ) ), staff_members ( full_name )")
          .in("section_id", sectionIds)
          .order("date", { ascending: false })
      : Promise.resolve({ data: [] as ParentSessionRow[] }),

    supabaseAdmin
      .from("ptm_bookings")
      .select("id, session_id, slot_time, status, ptm_sessions ( date, status, sections ( name, grades ( level ) ), staff_members ( full_name ) ), students ( full_name )")
      .eq("parent_id", parent.id),
  ]);

  const sessionIds = ((sessionRows ?? []) as unknown as ParentSessionRow[]).map((s) => s.id);
  const { data: allBookingRows } = sessionIds.length
    ? await supabaseAdmin.from("ptm_bookings").select("id, session_id, slot_time, status, student_id").in("session_id", sessionIds)
    : { data: [] as ParentBookingRow[] };

  const bookedTimesBySession: Record<string, Set<string>> = {};
  for (const b of (allBookingRows ?? []) as ParentBookingRow[]) {
    (bookedTimesBySession[b.session_id] ??= new Set()).add(b.slot_time.slice(0, 5));
  }

  const sessions: ParentPtmSession[] = ((sessionRows ?? []) as unknown as ParentSessionRow[]).map((s) => {
    const allSlots = buildSlotTimes(s.start_time, s.slot_minutes, s.total_slots);
    const taken = bookedTimesBySession[s.id] ?? new Set();
    return {
      id: s.id,
      classLabel: `Class ${s.sections?.grades?.level ?? "?"}-${s.sections?.name ?? ""}`,
      teacher: s.staff_members?.full_name ?? "—",
      date: s.date,
      status: s.status,
      availableSlots: s.status === "scheduled" ? allSlots.filter((t) => !taken.has(t)) : [],
      eligibleChildren: childrenBySection[s.section_id] ?? [],
    };
  });

  const bookings: ParentPtmBooking[] = ((myBookingRows ?? []) as unknown as MyBookingRow[]).map((b) => ({
    id: b.id,
    sessionId: b.session_id,
    classLabel: `Class ${b.ptm_sessions?.sections?.grades?.level ?? "?"}-${b.ptm_sessions?.sections?.name ?? ""}`,
    teacher: b.ptm_sessions?.staff_members?.full_name ?? "—",
    date: b.ptm_sessions?.date ?? "",
    slotTime: b.slot_time.slice(0, 5),
    studentName: b.students?.full_name ?? "—",
    status: b.status,
  })).sort((a, b) => (b.date > a.date ? 1 : -1));

  return <ParentPtmClient parentId={parent.id} sessions={sessions} bookings={bookings} />;
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
}

interface PtmBookingRow {
  id: string;
  session_id: string;
  slot_time: string;
  status: string;
  students: { full_name: string | null } | null;
  parents: { full_name: string | null } | null;
}

export default async function PtmPage() {
  const { data: { user } } = await getUser();
  if (!user) redirect("/login");

  const role = user.user_metadata?.role as string | undefined;
  if (role === "parent") {
    return <ParentPtm userId={user.id} />;
  }

  const teacher = await getTeacherContext(user.id);

  if (!teacher) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">No staff record linked to this login</p>
        </div>
      </div>
    );
  }

  const [{ data: sessionRows }, { data: sectionRows }] = await Promise.all([
    supabaseAdmin
      .from("ptm_sessions")
      .select("id, date, start_time, end_time, slot_minutes, total_slots, status, sections ( name, grades ( level ) )")
      .eq("teacher_id", teacher.staffId)
      .order("date", { ascending: false }),

    teacher.sectionIds.length
      ? supabaseAdmin.from("sections").select("id, name, grades ( level )").in("id", teacher.sectionIds).order("name")
      : Promise.resolve({ data: [] as { id: string; name: string | null; grades: { level: number | null } | null }[] }),
  ]);

  const sessionIds = ((sessionRows ?? []) as unknown as PtmSessionRow[]).map((s) => s.id);
  const { data: bookingRows } = sessionIds.length
    ? await supabaseAdmin
        .from("ptm_bookings")
        .select("id, session_id, slot_time, status, students ( full_name ), parents ( full_name )")
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

  const sessions: PtmSession[] = ((sessionRows ?? []) as unknown as PtmSessionRow[]).map((s) => ({
    id: s.id,
    classNum: String(s.sections?.grades?.level ?? "?"),
    section: s.sections?.name ?? "",
    teacher: teacher.fullName,
    date: s.date,
    startTime: to12Hour(s.start_time),
    endTime: to12Hour(s.end_time),
    slotMinutes: s.slot_minutes,
    totalSlots: s.total_slots,
    status: s.status as PtmSession["status"],
    bookings: bookingsBySession[s.id] ?? [],
  }));

  const sections = ((sectionRows ?? []) as unknown as { id: string; name: string | null; grades: { level: number | null } | null }[])
    .map((s) => ({ id: s.id, label: `${s.grades?.level ?? "?"}-${s.name}` }));
  const teachers = [{ id: teacher.staffId, name: teacher.fullName, designation: teacher.designation }];

  return <MyPtmClient sessions={sessions} sections={sections} teachers={teachers} />;
}
