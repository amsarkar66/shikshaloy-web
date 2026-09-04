import { supabaseAdmin } from "@/lib/supabase/service";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { assertAuthorizedSchool } from "@/lib/supabase/authorized-school";
import type { AdmissionDocument } from "../_components/AdmissionDetail";
import type { Application } from "../_components/AdmissionsClient";
import { parseAddress } from "@/lib/students/address";

interface AdmissionApplicationRow {
  id: string; application_no: string | null; applicant_name: string | null; dob: string | null;
  gender: string | null; applying_for_grade: number | null; parent_name: string | null;
  parent_phone: string | null; parent_email: string | null; previous_school: string | null;
  parent_occupation: string | null; parent_qualification: string | null;
  submitted_date: string | null; status: string | null; notes: string | null; academic_year_id: string | null;
  updated_at: string | null; status_reason: string | null;
  present_address: unknown; permanent_address: unknown; blood_group: string | null; category: string | null; nationality: string | null;
  father_name: string | null; father_occupation: string | null; father_qualification: string | null; father_phone: string | null; father_email: string | null;
  mother_name: string | null; mother_occupation: string | null; mother_qualification: string | null; mother_phone: string | null; mother_email: string | null;
  guardian_name: string | null; guardian_relation: string | null; guardian_occupation: string | null; guardian_qualification: string | null; guardian_phone: string | null; guardian_email: string | null;
  sibling_studying: boolean | null; sibling_name: string | null;
  emergency_contact_name: string | null; emergency_contact_phone: string | null;
  photo_url: string | null;
  school_id: string;
  academic_years: { name: string | null } | null;
}

export async function getAdmissionApplication(id: string): Promise<{
  app: Application;
  documents: AdmissionDocument[];
  schoolName: string;
  schoolLogoUrl: string | null;
} | null> {
  const vu = await getVerifiedUser();
  if (!vu) return null;

  // Resolved from the application record itself (then authorized), rather
  // than the "active school" cookie — a super_admin viewing the combined
  // admissions list can open an application belonging to any of their
  // institution's schools without first switching the active school to match.
  const { data } = await supabaseAdmin
    .from("admission_applications")
    .select(`
      id, application_no, applicant_name, dob, gender, applying_for_grade,
      parent_name, parent_phone, parent_email, parent_occupation, parent_qualification, previous_school, submitted_date,
      status, notes, academic_year_id, updated_at, status_reason,
      present_address, permanent_address, blood_group, category, nationality,
      father_name, father_occupation, father_qualification, father_phone, father_email,
      mother_name, mother_occupation, mother_qualification, mother_phone, mother_email,
      guardian_name, guardian_relation, guardian_occupation, guardian_qualification, guardian_phone, guardian_email,
      sibling_studying, sibling_name,
      emergency_contact_name, emergency_contact_phone,
      photo_url, school_id,
      academic_years ( name )
    `)
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  const schoolId = (data as unknown as AdmissionApplicationRow).school_id;
  await assertAuthorizedSchool(vu, schoolId);

  const [{ data: documentRows }, { data: school }] = await Promise.all([
    supabaseAdmin
      .from("admission_documents")
      .select("id, category, file_name, file_url, uploaded_at")
      .eq("application_id", id)
      .order("uploaded_at"),

    supabaseAdmin
      .from("schools")
      .select("name, logo_url")
      .eq("id", schoolId)
      .maybeSingle(),
  ]);

  // admission-documents is a private bucket (see
  // 20260901010000_restrict_admission_documents_bucket.sql) — the stored
  // file_url is only used to recover the object path; the actual URL handed
  // to the browser is a short-lived signed one.
  const documents: AdmissionDocument[] = await Promise.all(
    (documentRows ?? []).map(async (d) => {
      const marker = "/admission-documents/";
      const idx = d.file_url.indexOf(marker);
      const path = idx !== -1 ? d.file_url.slice(idx + marker.length) : null;
      const signedUrl = path
        ? (await supabaseAdmin.storage.from("admission-documents").createSignedUrl(path, 300)).data?.signedUrl
        : null;
      return {
        id: d.id,
        category: d.category,
        fileName: d.file_name,
        fileUrl: signedUrl ?? d.file_url,
        uploadedAt: d.uploaded_at,
      };
    })
  );

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
    parentOccupation:    a.parent_occupation ?? undefined,
    parentQualification: a.parent_qualification ?? undefined,
    previousSchool:   a.previous_school ?? undefined,
    submittedDate:    a.submitted_date ?? "",
    updatedAt:        a.updated_at ?? undefined,
    statusReason:     a.status_reason ?? undefined,
    status:           (a.status ?? "pending") as Application["status"],
    academicYear:     a.academic_years?.name ?? "",
    academicYearId:   a.academic_year_id ?? "",
    notes:            a.notes ?? undefined,

    presentAddress:        parseAddress(a.present_address),
    permanentAddress:      parseAddress(a.permanent_address),
    bloodGroup:            a.blood_group ?? undefined,
    category:              a.category ?? undefined,
    nationality:            a.nationality ?? undefined,
    fatherName:            a.father_name ?? undefined,
    fatherOccupation:      a.father_occupation ?? undefined,
    fatherQualification:   a.father_qualification ?? undefined,
    fatherPhone:           a.father_phone ?? undefined,
    fatherEmail:           a.father_email ?? undefined,
    motherName:            a.mother_name ?? undefined,
    motherOccupation:      a.mother_occupation ?? undefined,
    motherQualification:   a.mother_qualification ?? undefined,
    motherPhone:           a.mother_phone ?? undefined,
    motherEmail:           a.mother_email ?? undefined,
    guardianName:          a.guardian_name ?? undefined,
    guardianRelation:      a.guardian_relation ?? undefined,
    guardianOccupation:    a.guardian_occupation ?? undefined,
    guardianQualification: a.guardian_qualification ?? undefined,
    guardianPhone:         a.guardian_phone ?? undefined,
    guardianEmail:         a.guardian_email ?? undefined,
    siblingStudying:       a.sibling_studying ?? false,
    siblingName:           a.sibling_name ?? undefined,
    emergencyContactName:  a.emergency_contact_name ?? undefined,
    emergencyContactPhone: a.emergency_contact_phone ?? undefined,
    photoUrl:              a.photo_url ?? undefined,
  };

  return {
    app,
    documents,
    schoolName: school?.name ?? "School",
    schoolLogoUrl: school?.logo_url ?? null,
  };
}
