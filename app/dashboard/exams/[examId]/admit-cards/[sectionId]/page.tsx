import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import { listExamSchedule, getStudentElectiveSectionSubjectIds } from "../../../actions";
import AdmitCardsClient from "../../../_components/AdmitCardsClient";

export default async function AdmitCardsSectionPage({
  params,
}: {
  params: Promise<{ examId: string; sectionId: string }>;
}) {
  const { examId, sectionId } = await params;
  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const [{ data: exam }, schedule, { data: section }, { data: school }, { data: students }, { data: sectionSubjects }] = await Promise.all([
    supabaseAdmin.from("exams").select("id, name, start_date, end_date").eq("id", examId).eq("school_id", schoolId).maybeSingle(),
    listExamSchedule(examId),
    supabaseAdmin.from("sections").select("id, name, grades ( level )").eq("id", sectionId).eq("school_id", schoolId).maybeSingle(),
    supabaseAdmin.from("schools").select("name, logo_url, principal_signature_url").eq("id", schoolId).maybeSingle(),
    supabaseAdmin.from("students").select("id, full_name, roll_no, photo_url").eq("section_id", sectionId).order("roll_no"),
    supabaseAdmin
      .from("section_subjects")
      .select("id, subject_id, subjects ( type )")
      .eq("school_id", schoolId)
      .eq("section_id", sectionId)
      .eq("academic_year_id", academicYearId),
  ]);

  if (!exam || !section) notFound();

  const grades = section.grades as unknown as { level: number | null } | { level: number | null }[] | null;
  const level = Array.isArray(grades) ? grades[0]?.level : grades?.level;
  const sectionLabel = `Class ${level ?? "?"}–${section.name ?? ""}`;

  // Core subjects apply to every student; elective subjects only to students
  // who've opted in via Exam Preference — everyone else's admit card omits them.
  const coreSubjectIds = new Set<string>();
  const electiveSubjectBySectionSubjectId: Record<string, string> = {};
  for (const r of sectionSubjects ?? []) {
    const type = (r.subjects as unknown as { type: string | null } | null)?.type;
    if (type === "elective") electiveSubjectBySectionSubjectId[r.id] = r.subject_id;
    else coreSubjectIds.add(r.subject_id);
  }

  const studentIds = (students ?? []).map((s) => s.id);
  const preferencesByStudent = await getStudentElectiveSectionSubjectIds(studentIds);

  return (
    <AdmitCardsClient
      schoolName={school?.name ?? "School"}
      schoolLogoUrl={school?.logo_url ?? null}
      signatureUrl={school?.principal_signature_url ?? null}
      examName={exam.name}
      sectionLabel={sectionLabel}
      students={(students ?? []).map((s) => {
        // No section_subjects configured for this section at all — fall back
        // to the full schedule rather than silently showing zero subjects.
        if ((sectionSubjects ?? []).length === 0) {
          return { id: s.id, name: s.full_name, rollNo: s.roll_no ?? "—", photoUrl: s.photo_url, schedule };
        }
        const chosenElectiveSubjectIds = (preferencesByStudent[s.id] ?? [])
          .map((ssId) => electiveSubjectBySectionSubjectId[ssId])
          .filter((id): id is string => !!id);
        const allowedSubjectIds = new Set([...coreSubjectIds, ...chosenElectiveSubjectIds]);
        return {
          id: s.id,
          name: s.full_name,
          rollNo: s.roll_no ?? "—",
          photoUrl: s.photo_url,
          schedule: schedule.filter((slot) => allowedSubjectIds.has(slot.subjectId)),
        };
      })}
    />
  );
}
