import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import AdmissionsClient from "./_components/AdmissionsClient";
import type { Application } from "./_components/AdmissionsClient";

export default async function AdmissionsPage() {
  const { data } = await supabaseAdmin
    .from("admission_applications")
    .select(`
      id, application_no, applicant_name, dob, gender, applying_for_grade,
      parent_name, parent_phone, parent_email, previous_school, submitted_date,
      status, notes, academic_year_id,
      address, blood_group, category, nationality,
      father_name, father_occupation, father_phone, father_email,
      mother_name, mother_occupation, mother_phone, mother_email,
      guardian_name, guardian_relation, guardian_phone,
      sibling_studying, sibling_name,
      emergency_contact_name, emergency_contact_phone,
      photo_url,
      academic_years ( name )
    `)
    .eq("school_id", DEMO_SCHOOL_ID)
    .order("submitted_date", { ascending: false });

  const apps: Application[] = (data ?? []).map((a: any) => ({
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
    status:           a.status ?? "pending",
    academicYear:     a.academic_years?.name ?? "",
    academicYearId:   a.academic_year_id,
    notes:            a.notes ?? undefined,

    address:               a.address ?? undefined,
    bloodGroup:            a.blood_group ?? undefined,
    category:              a.category ?? undefined,
    nationality:           a.nationality ?? undefined,
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
  }));

  return <AdmissionsClient initialApps={apps} />;
}
