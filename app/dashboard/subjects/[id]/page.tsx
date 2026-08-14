import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import SubjectDetailClient from "./_components/SubjectDetailClient";
import type { SubjectAssignment, SectionOption, TeacherOption } from "./_components/SubjectDetailClient";

interface SubjectRow {
  id:             string;
  name:           string;
  code:           string;
  type:           "core" | "elective" | null;
  status:         "active" | "inactive" | null;
  weekly_periods: number | null;
}

interface SectionSubjectRow {
  id:             string;
  section_id:     string;
  teacher_id:     string | null;
  weekly_periods: number | null;
  sections:       { name: string | null; grades: { level: number | null } | null } | null;
  profiles:       { full_name: string | null } | null;
}

interface SectionRow {
  id:     string;
  name:   string | null;
  grades: { level: number | null } | null;
}

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const { data: subjectRow } = await supabaseAdmin
    .from("subjects")
    .select("id, name, code, type, status, weekly_periods")
    .eq("id", id)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (!subjectRow) notFound();
  const subject = subjectRow as SubjectRow;

  const [{ data: ssRows }, { data: sectionRows }, { data: teacherRows }] = await Promise.all([
    supabaseAdmin
      .from("section_subjects")
      .select("id, section_id, teacher_id, weekly_periods, sections ( name, grades ( level ) ), profiles ( full_name )")
      .eq("school_id", schoolId)
      .eq("subject_id", id)
      .eq("academic_year_id", academicYearId),

    supabaseAdmin
      .from("sections")
      .select("id, name, grades ( level )")
      .eq("school_id", schoolId)
      .eq("academic_year_id", academicYearId)
      .order("name"),

    supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("school_id", schoolId)
      .eq("role", "teacher")
      .eq("status", "active")
      .order("full_name"),
  ]);

  const assignments: SubjectAssignment[] = ((ssRows ?? []) as unknown as SectionSubjectRow[])
    .map((ss) => ({
      id:            ss.id,
      sectionId:     ss.section_id,
      classNum:      String(ss.sections?.grades?.level ?? "?"),
      sectionName:   ss.sections?.name ?? "",
      teacherId:     ss.teacher_id,
      teacherName:   ss.profiles?.full_name ?? "",
      weeklyPeriods: ss.weekly_periods,
    }))
    .sort((a, b) => +a.classNum - +b.classNum || a.sectionName.localeCompare(b.sectionName));

  const sections: SectionOption[] = ((sectionRows ?? []) as unknown as SectionRow[])
    .map((s) => ({
      id:       s.id,
      classNum: String(s.grades?.level ?? "?"),
      name:     s.name ?? "",
    }))
    .sort((a, b) => +a.classNum - +b.classNum || a.name.localeCompare(b.name));

  const teachers: TeacherOption[] = (teacherRows ?? []).map((t) => ({
    id:   t.id,
    name: t.full_name ?? "Unnamed teacher",
  }));

  return (
    <SubjectDetailClient
      subject={{
        id:            subject.id,
        name:          subject.name,
        code:          subject.code,
        type:          subject.type ?? "core",
        status:        subject.status ?? "active",
        weeklyPeriods: subject.weekly_periods ?? 0,
      }}
      assignments={assignments}
      sections={sections}
      teachers={teachers}
    />
  );
}
