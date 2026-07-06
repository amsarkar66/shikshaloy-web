"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import { enrollStudent, type ParentLogin } from "@/lib/students/enroll";
import type { AdmissionStatus } from "./_data/admissions";

export type PrimaryContact = "father" | "mother" | "guardian";

export interface NewApplicationInput {
  applicantName: string;
  dob: string | null;
  gender: "Male" | "Female" | "Other";
  applyingForGrade: string;
  academicYearId: string;
  previousSchool?: string;
  address?: string;
  bloodGroup?: string;
  category?: string;
  nationality?: string;

  fatherName?: string;
  fatherOccupation?: string;
  fatherPhone?: string;
  fatherEmail?: string;

  motherName?: string;
  motherOccupation?: string;
  motherPhone?: string;
  motherEmail?: string;

  guardianName?: string;
  guardianRelation?: string;
  guardianPhone?: string;

  primaryContact: PrimaryContact;

  siblingStudying?: boolean;
  siblingName?: string;

  emergencyContactName?: string;
  emergencyContactPhone?: string;

  photoUrl?: string | null;

  notes?: string;
}

export async function createApplication(input: NewApplicationInput): Promise<string> {
  const { data: year } = await supabaseAdmin
    .from("academic_years")
    .select("name")
    .eq("id", input.academicYearId)
    .single();

  const startYear = parseInt((year?.name ?? "").split("-")[0], 10);
  const admYear = Number.isNaN(startYear) ? new Date().getFullYear() : startYear + 1;

  const { count } = await supabaseAdmin
    .from("admission_applications")
    .select("id", { count: "exact", head: true })
    .eq("academic_year_id", input.academicYearId);

  const seq = String((count ?? 0) + 1).padStart(3, "0");
  const applicationNo = `ADM-${admYear}-${seq}`;

  const primary = input.primaryContact === "father"
    ? { name: input.fatherName, phone: input.fatherPhone, email: input.fatherEmail }
    : input.primaryContact === "mother"
    ? { name: input.motherName, phone: input.motherPhone, email: input.motherEmail }
    : { name: input.guardianName, phone: input.guardianPhone, email: undefined };

  const { data, error } = await supabaseAdmin
    .from("admission_applications")
    .insert({
      school_id: DEMO_SCHOOL_ID,
      academic_year_id: input.academicYearId,
      application_no: applicationNo,
      applicant_name: input.applicantName,
      dob: input.dob,
      gender: input.gender,
      applying_for_grade: input.applyingForGrade,
      parent_name: primary.name || "",
      parent_phone: primary.phone || "",
      parent_email: primary.email || "",
      previous_school: input.previousSchool || null,
      address: input.address || null,
      blood_group: input.bloodGroup || null,
      category: input.category || null,
      nationality: input.nationality || "Indian",
      father_name: input.fatherName || null,
      father_occupation: input.fatherOccupation || null,
      father_phone: input.fatherPhone || null,
      father_email: input.fatherEmail || null,
      mother_name: input.motherName || null,
      mother_occupation: input.motherOccupation || null,
      mother_phone: input.motherPhone || null,
      mother_email: input.motherEmail || null,
      guardian_name: input.guardianName || null,
      guardian_relation: input.guardianRelation || null,
      guardian_phone: input.guardianPhone || null,
      sibling_studying: input.siblingStudying ?? false,
      sibling_name: input.siblingName || null,
      emergency_contact_name: input.emergencyContactName || null,
      emergency_contact_phone: input.emergencyContactPhone || null,
      photo_url: input.photoUrl || null,
      submitted_date: new Date().toISOString().slice(0, 10),
      status: "pending",
      notes: input.notes || null,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to create application");

  revalidatePath("/dashboard/admissions");
  return data.id;
}

export async function updateApplicationStatus(applicationId: string, status: AdmissionStatus) {
  const { error } = await supabaseAdmin
    .from("admission_applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", applicationId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admissions");
}

export interface EnrollResult {
  rollNo: string;
  loginEmail: string;
  loginPassword: string;
  parentLogin: ParentLogin | null;
}

export async function enrollApplication(applicationId: string): Promise<EnrollResult> {
  const { data: app, error: fetchError } = await supabaseAdmin
    .from("admission_applications")
    .select("applicant_name, dob, gender, applying_for_grade, academic_year_id, parent_name, parent_phone, parent_email, photo_url")
    .eq("id", applicationId)
    .single();

  if (fetchError || !app) throw new Error(fetchError?.message ?? "Application not found");

  const result = await enrollStudent({
    fullName: app.applicant_name,
    dob: app.dob,
    gender: app.gender,
    gradeLevel: parseInt(app.applying_for_grade, 10),
    academicYearId: app.academic_year_id,
    parentName: app.parent_name,
    parentPhone: app.parent_phone,
    parentEmail: app.parent_email,
    photoUrl: app.photo_url,
  });

  const { error: updateError } = await supabaseAdmin
    .from("admission_applications")
    .update({ status: "enrolled", updated_at: new Date().toISOString() })
    .eq("id", applicationId);

  if (updateError) throw new Error(updateError.message);

  revalidatePath("/dashboard/admissions");
  revalidatePath("/dashboard/students");

  return {
    rollNo: result.rollNo,
    loginEmail: result.loginEmail,
    loginPassword: result.loginPassword,
    parentLogin: result.parentLogin,
  };
}
