import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Phone, Droplets, ShieldAlert, School, GraduationCap, Bus, MapPin, Hash } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/service";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface StudentSafetyRow {
  full_name: string;
  photo_url: string | null;
  blood_group: string | null;
  roll_no: string | null;
  school_id: string;
  sections: {
    name: string | null;
    grades: { level: number | null } | null;
    class_teacher: { full_name: string | null; phone: string | null } | null;
  } | null;
  student_parents: { relationship: string | null; parents: { full_name: string | null; phone: string | null } | null }[] | null;
  student_transport: {
    stop_name: string | null;
    transport_routes: { route_no: string | null; route_name: string | null; driver_phone: string | null } | null;
  }[] | null;
}

function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export default async function StudentSafetyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: row } = await supabaseAdmin
    .from("students")
    .select(`
      full_name, photo_url, blood_group, roll_no, school_id,
      sections ( name, grades ( level ), class_teacher:profiles!class_teacher_id ( full_name, phone ) ),
      student_parents ( relationship, parents ( full_name, phone ) ),
      student_transport ( stop_name, transport_routes ( route_no, route_name, driver_phone ) )
    `)
    .eq("id", id)
    .maybeSingle();

  if (!row) notFound();

  const student = row as unknown as StudentSafetyRow;

  const { data: school } = await supabaseAdmin
    .from("schools")
    .select("name, logo_url, phone, address, city")
    .eq("id", student.school_id)
    .maybeSingle();

  const guardians = (student.student_parents ?? [])
    .map((sp) => ({
      relationship: sp.relationship ?? "Guardian",
      name: sp.parents?.full_name ?? null,
      phone: sp.parents?.phone ?? null,
    }))
    .filter((g) => g.name && g.phone);

  const classLabel = student.sections
    ? `Class ${student.sections.grades?.level ?? "?"}-${student.sections.name ?? ""}`
    : null;

  const classTeacher = student.sections?.class_teacher;
  const transport = (student.student_transport ?? [])[0] ?? null;
  const schoolLocation = [school?.address, school?.city].filter(Boolean).join(", ");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-indigo-50 to-white px-4 py-10">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl">
        {/* School banner */}
        <div className="flex items-center gap-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/15">
            {school?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={school.logo_url} alt={school.name} className="h-full w-full object-cover" />
            ) : (
              <School className="h-5 w-5 text-white" />
            )}
          </div>
          <p className="truncate text-sm font-bold uppercase tracking-wide text-white">{school?.name ?? "Shikshaloy"}</p>
        </div>

        <div className="flex flex-col items-center px-6 pb-6 pt-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-white shadow ring-4 ring-white">
            {student.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={student.photo_url} alt={student.full_name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary-500 text-2xl font-bold text-white">
                {initials(student.full_name)}
              </div>
            )}
          </div>
          <h1 className="mt-3 text-xl font-bold text-gray-900">{student.full_name}</h1>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
            {classLabel && (
              <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-600">
                {classLabel}
              </span>
            )}
            {student.roll_no && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                <Hash className="h-3 w-3" /> Roll {student.roll_no}
              </span>
            )}
          </div>

          {/* Blood group — the single most safety-critical fact on this page */}
          <div className="mt-5 flex w-full items-center gap-3 rounded-2xl bg-rose-50 px-4 py-3">
            <Droplets className="h-6 w-6 shrink-0 text-rose-500" />
            <div className="text-left">
              <p className="text-[11px] font-medium uppercase tracking-wide text-rose-500">Blood Group</p>
              <p className="text-lg font-bold text-rose-700">{student.blood_group ?? "Not on record"}</p>
            </div>
          </div>

          {/* Emergency contacts */}
          <div className="mt-4 w-full space-y-2">
            <p className="flex items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
              <ShieldAlert className="h-3.5 w-3.5" /> Emergency Contacts
            </p>
            {guardians.length === 0 && (
              <a
                href={school?.phone ? `tel:${school.phone}` : undefined}
                className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
              >
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{school?.name ?? "School"} Office</p>
                  <p className="text-xs text-gray-400">No guardian on record — contact the school</p>
                </div>
                {school?.phone && <Phone className="h-4 w-4 shrink-0 text-primary-500" />}
              </a>
            )}
            {guardians.map((g, i) => (
              <a
                key={i}
                href={`tel:${g.phone}`}
                className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <div className="text-left">
                  <p className="text-sm font-semibold capitalize text-gray-900">{g.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{g.relationship}</p>
                </div>
                <span className="flex items-center gap-1.5 text-sm font-medium text-primary-600">
                  <Phone className="h-4 w-4" /> {g.phone}
                </span>
              </a>
            ))}
            {school?.phone && (
              <a
                href={`tel:${school.phone}`}
                className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{school.name}</p>
                  <p className="text-xs text-gray-400">School office</p>
                </div>
                <span className="flex items-center gap-1.5 text-sm font-medium text-primary-600">
                  <Phone className="h-4 w-4" /> {school.phone}
                </span>
              </a>
            )}
          </div>

          {/* Class teacher — often the fastest, most relevant person to reach at school hours */}
          {classTeacher?.full_name && (
            <div className="mt-4 w-full space-y-2">
              <p className="flex items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                <GraduationCap className="h-3.5 w-3.5" /> Class Teacher
              </p>
              <a
                href={classTeacher.phone ? `tel:${classTeacher.phone}` : undefined}
                className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 transition-colors hover:bg-gray-50"
              >
                <p className="text-sm font-semibold text-gray-900">{classTeacher.full_name}</p>
                {classTeacher.phone && (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-primary-600">
                    <Phone className="h-4 w-4" /> {classTeacher.phone}
                  </span>
                )}
              </a>
            </div>
          )}

          {/* Transport — helps reunite a student found away from school or a bus stop */}
          {transport && (
            <div className="mt-4 w-full space-y-2">
              <p className="flex items-center gap-1.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                <Bus className="h-3.5 w-3.5" /> Transport
              </p>
              <div className="rounded-xl border border-gray-200 px-4 py-3 text-left">
                <p className="text-sm font-semibold text-gray-900">
                  Route {transport.transport_routes?.route_no ?? "—"}
                  {transport.transport_routes?.route_name ? ` · ${transport.transport_routes.route_name}` : ""}
                </p>
                {transport.stop_name && <p className="text-xs text-gray-400">Stop: {transport.stop_name}</p>}
                {transport.transport_routes?.driver_phone && (
                  <a
                    href={`tel:${transport.transport_routes.driver_phone}`}
                    className="mt-1 flex items-center gap-1.5 text-sm font-medium text-primary-600"
                  >
                    <Phone className="h-4 w-4" /> {transport.transport_routes.driver_phone}
                  </a>
                )}
              </div>
            </div>
          )}

          {schoolLocation && (
            <p className="mt-4 flex items-start gap-1.5 text-left text-xs text-gray-400">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {school?.name}, {schoolLocation}
            </p>
          )}

          <p className="mt-6 text-[11px] text-gray-400">
            Found this student unattended or in an emergency? Please use the contacts above.
          </p>
        </div>
      </div>
    </div>
  );
}
