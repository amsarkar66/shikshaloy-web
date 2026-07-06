import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import AdmissionsClient from "./_components/AdmissionsClient";
import type { Application } from "./_components/AdmissionsClient";

export default async function AdmissionsPage() {
  const { data } = await supabaseAdmin
    .from("admission_applications")
    .select("id, application_no, applicant_name, dob, gender, applying_for_class, parent_name, parent_phone, parent_email, previous_school, submitted_date, status, academic_year, notes")
    .eq("school_id", DEMO_SCHOOL_ID)
    .order("submitted_date", { ascending: false });

  const apps: Application[] = (data ?? []).map((a: any) => ({
    id:               a.id,
    applicationNo:    a.application_no ?? "",
    applicantName:    a.applicant_name ?? "",
    dob:              a.dob ?? "",
    gender:           (a.gender ?? "Male") as Application["gender"],
    applyingForClass: String(a.applying_for_class ?? "1"),
    parentName:       a.parent_name ?? "",
    parentPhone:      a.parent_phone ?? "",
    parentEmail:      a.parent_email ?? "",
    previousSchool:   a.previous_school ?? undefined,
    submittedDate:    a.submitted_date ?? "",
    status:           a.status ?? "pending",
    academicYear:     a.academic_year ?? "2026-27",
    notes:            a.notes ?? undefined,
  }));

  return <AdmissionsClient initialApps={apps} />;
}
