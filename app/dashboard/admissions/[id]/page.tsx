import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { AdmissionDetail, type AdmissionDocument } from "../_components/AdmissionDetail";
import type { Application } from "../_components/AdmissionsClient";

interface AdmissionApplicationRow {
  id: string; application_no: string | null; applicant_name: string | null; dob: string | null;
  gender: string | null; applying_for_grade: number | null; parent_name: string | null;
  parent_phone: string | null; parent_email: string | null; previous_school: string | null;
  submitted_date: string | null; status: string | null; notes: string | null; academic_year_id: string | null;
  updated_at: string | null; status_reason: string | null;
  address: string | null; blood_group: string | null; category: string | null; nationality: string | null;
  father_name: string | null; father_occupation: string | null; father_phone: string | null; father_email: string | null;
  mother_name: string | null; mother_occupation: string | null; mother_phone: string | null; mother_email: string | null;
  guardian_name: string | null; guardian_relation: string | null; guardian_phone: string | null;
  sibling_studying: boolean | null; sibling_name: string | null;
  emergency_contact_name: string | null; emergency_contact_phone: string | null;
  photo_url: string | null;
  academic_years: { name: string | null } | null;
}

export default async function AdmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const schoolId = await getCurrentSchoolIdOrThrow();

  const [{ data }, { data: documentRows }] = await Promise.all([
    supabaseAdmin
      .from("admission_applications")
      .select(`
        id, application_no, applicant_name, dob, gender, applying_for_grade,
        parent_name, parent_phone, parent_email, previous_school, submitted_date,
        status, notes, academic_year_id, updated_at, status_reason,
        address, blood_group, category, nationality,
        father_name, father_occupation, father_phone, father_email,
        mother_name, mother_occupation, mother_phone, mother_email,
        guardian_name, guardian_relation, guardian_phone,
        sibling_studying, sibling_name,
        emergency_contact_name, emergency_contact_phone,
        photo_url,
        academic_years ( name )
      `)
      .eq("school_id", schoolId)
      .eq("id", id)
      .maybeSingle(),

    supabaseAdmin
      .from("admission_documents")
      .select("id, category, file_name, file_url, uploaded_at")
      .eq("application_id", id)
      .order("uploaded_at"),
  ]);

  if (!data) notFound();

  const documents: AdmissionDocument[] = (documentRows ?? []).map((d) => ({
    id: d.id,
    category: d.category,
    fileName: d.file_name,
    fileUrl: d.file_url,
    uploadedAt: d.uploaded_at,
  }));

  const a = data as unknown as AdmissionApplicationRow;

  const app: Application = {
    id:               a.id,
    applicationNo:    a.application_no ?? "",
    applicantName:    a.applicant_name ?? "",
    dob:              a.dob ?? "",
    gender:           (a.gender ?? "Male") as Application["gender"],
    applyingForClass: String(a.applying_for_grade ?? "1"),
    parentName:       a.parent_name ?? "",
    parentPhone:      a.parent_phone ?? "",
    parentEmail:      a.parent_email ?? "",
    previousSchool:   a.previous_school ?? undefined,
    submittedDate:    a.submitted_date ?? "",
    updatedAt:        a.updated_at ?? undefined,
    statusReason:     a.status_reason ?? undefined,
    status:           (a.status ?? "pending") as Application["status"],
    academicYear:     a.academic_years?.name ?? "",
    academicYearId:   a.academic_year_id ?? "",
    notes:            a.notes ?? undefined,

    address:               a.address ?? undefined,
    bloodGroup:            a.blood_group ?? undefined,
    category:              a.category ?? undefined,
    nationality:            a.nationality ?? undefined,
    fatherName:            a.father_name ?? undefined,
    fatherOccupation:      a.father_occupation ?? undefined,
    fatherPhone:           a.father_phone ?? undefined,
    fatherEmail:           a.father_email ?? undefined,
    motherName:            a.mother_name ?? undefined,
    motherOccupation:      a.mother_occupation ?? undefined,
    motherPhone:           a.mother_phone ?? undefined,
    motherEmail:           a.mother_email ?? undefined,
    guardianName:          a.guardian_name ?? undefined,
    guardianRelation:      a.guardian_relation ?? undefined,
    guardianPhone:         a.guardian_phone ?? undefined,
    siblingStudying:       a.sibling_studying ?? false,
    siblingName:           a.sibling_name ?? undefined,
    emergencyContactName:  a.emergency_contact_name ?? undefined,
    emergencyContactPhone: a.emergency_contact_phone ?? undefined,
    photoUrl:              a.photo_url ?? undefined,
  };

  return <AdmissionDetail app={app} documents={documents} />;
}
