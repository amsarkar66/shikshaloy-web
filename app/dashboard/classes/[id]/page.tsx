import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, DoorOpen, Users, BookOpen, TrendingUp,
  GraduationCap, Eye,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { attendanceColor, attendanceBar } from "../_data/classes";

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500",
  "bg-cyan-500", "bg-orange-500",
];

function avatarColor(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

const FEE_BADGE: Record<string, string> = {
  paid:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  partial: "bg-amber-500/10  text-amber-600   dark:text-amber-400   border-amber-500/20",
  overdue: "bg-red-500/10    text-red-600     dark:text-red-400     border-red-500/20",
};

interface SectionRow {
  id: string;
  name: string | null;
  room: string | null;
  capacity: number | null;
  avg_attendance: number | null;
  status: string | null;
  academic_year_id: string | null;
  grades: { level: number | null } | null;
  profiles: { full_name: string | null } | null;
  streams: { name: string | null } | null;
}

interface RosterStudentRow {
  id: string;
  full_name: string;
  roll_no: string | null;
  gender: string | null;
  phone: string | null;
  attendance_pct: number | null;
  fee_status: string | null;
  status: string | null;
  photo_url: string | null;
}

interface SectionSubjectRow {
  subjects: { name: string | null; code: string | null; type: string | null } | null;
  profiles: { full_name: string | null } | null;
}

export default async function ClassRosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data: sectionRow } = await supabaseAdmin
    .from("sections")
    .select("id, name, room, capacity, avg_attendance, status, academic_year_id, grades ( level ), profiles ( full_name ), streams ( name )")
    .eq("id", id)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (!sectionRow) notFound();
  const section = sectionRow as unknown as SectionRow;

  const [{ data: studentRows }, { data: subjectRows }] = await Promise.all([
    supabaseAdmin
      .from("students")
      .select("id, full_name, roll_no, gender, phone, attendance_pct, fee_status, status, photo_url")
      .eq("school_id", schoolId)
      .eq("section_id", id)
      .order("roll_no"),

    supabaseAdmin
      .from("section_subjects")
      .select("subjects ( name, code, type ), profiles ( full_name )")
      .eq("school_id", schoolId)
      .eq("section_id", id)
      .eq("academic_year_id", section.academic_year_id ?? ""),
  ]);

  const students = (studentRows ?? []) as unknown as RosterStudentRow[];
  const subjects = ((subjectRows ?? []) as unknown as SectionSubjectRow[]).map((s) => ({
    name: s.subjects?.name ?? "Subject",
    code: s.subjects?.code ?? "",
    type: s.subjects?.type ?? "core",
    teacher: s.profiles?.full_name ?? "—",
  }));

  const classNum = String(section.grades?.level ?? "?");
  const sectionName = section.name ?? "";
  const capacity = section.capacity ?? 40;
  const avgAtt = Math.round(Number(section.avg_attendance ?? 0));
  const isActive = (section.status ?? "active") === "active";

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <Link
        href="/dashboard/classes"
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Classes
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-500/10 dark:bg-primary-500/20">
              <span className="text-lg font-bold text-primary-600 dark:text-primary-400">{classNum}<span className="text-sm">–{sectionName}</span></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Class {classNum}–{sectionName}</h1>
                {section.streams?.name && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    {section.streams.name}
                  </span>
                )}
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isActive?"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400":"bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"}`}>
                  {isActive?"Active":"Inactive"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
                <span className="flex items-center gap-1"><DoorOpen className="h-3.5 w-3.5"/>{section.room || "No room set"}</span>
                <span>·</span>
                <span className="flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5"/>{section.profiles?.full_name || "No class teacher assigned"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-blue-500 bg-blue-500/10"><Users className="h-5 w-5"/></div>
          <div><p className="text-sm font-bold text-gray-900 dark:text-zinc-50">{students.length} / {capacity} students</p><p className="text-xs text-gray-500 dark:text-zinc-400">Enrolment</p></div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-emerald-500 bg-emerald-500/10"><TrendingUp className="h-5 w-5"/></div>
          <div><p className={`text-sm font-bold ${attendanceColor(avgAtt)}`}>{avgAtt}% avg attendance</p><p className="text-xs text-gray-500 dark:text-zinc-400">This term</p></div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-violet-500 bg-violet-500/10"><BookOpen className="h-5 w-5"/></div>
          <div><p className="text-sm font-bold text-gray-900 dark:text-zinc-50">{subjects.length} subjects</p><p className="text-xs text-gray-500 dark:text-zinc-400">This year</p></div>
        </div>
      </div>

      {/* Subjects & teachers */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="border-b border-gray-100 dark:border-zinc-700/50 px-5 py-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Subjects & Teachers</p>
        </div>
        {subjects.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No subjects assigned yet</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {subjects.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{s.name}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 capitalize">{s.type}</p>
                </div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">{s.teacher}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Roster */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="border-b border-gray-100 dark:border-zinc-700/50 px-5 py-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Students ({students.length})</p>
        </div>
        {students.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <Users className="h-8 w-8 text-gray-300 dark:text-zinc-600"/>
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No students in this section yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                  <th className="py-3 pl-4 pr-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Student</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Gender</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Phone</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Attendance</th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Fee Status</th>
                  <th className="py-3 pl-3 pr-4 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
                {students.map((s) => {
                  const att = Math.round(Number(s.attendance_pct ?? 0));
                  const feeStatus = s.fee_status ?? "overdue";
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                      <td className="py-3 pl-4 pr-3">
                        <div className="flex items-center gap-3">
                          {s.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={s.photo_url} alt={s.full_name} className="h-8 w-8 shrink-0 rounded-full object-cover" />
                          ) : (
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(s.id)}`}>
                              {initials(s.full_name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{s.full_name}</p>
                            <p className="text-xs text-gray-400 dark:text-zinc-500">{s.roll_no || "—"}</p>
                          </div>
                          {s.status === "inactive" && (
                            <span className="ml-1 shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400">Inactive</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-gray-700 dark:text-zinc-300">{s.gender ?? "—"}</td>
                      <td className="px-3 py-3 text-sm text-gray-700 dark:text-zinc-300">{s.phone ?? "—"}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 min-w-[96px]">
                          <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
                            <div className={`h-1.5 rounded-full ${attendanceBar(att)}`} style={{ width: `${att}%` }} />
                          </div>
                          <span className={`text-xs font-semibold tabular-nums ${attendanceColor(att)}`}>{att}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${FEE_BADGE[feeStatus] ?? FEE_BADGE.overdue}`}>
                          {feeStatus}
                        </span>
                      </td>
                      <td className="py-3 pl-3 pr-4 text-right">
                        <Link
                          href={`/dashboard/students/${s.id}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
                          title="View student"
                        >
                          <Eye className="h-3.5 w-3.5"/>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
