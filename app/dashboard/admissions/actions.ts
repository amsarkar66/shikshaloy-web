"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { resolveAuthorizedSchoolId } from "@/lib/supabase/authorized-school";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import { getStudentCapacity } from "@/lib/billing/plan-limits";
import { enrollStudent, type ParentLogin } from "@/lib/students/enroll";
import { logAuditEvent } from "@/lib/audit/log";
import { notifyRoles } from "@/lib/notifications/create";
import { getUser } from "@/lib/supabase/server";
import { requireRoleOrStaffTemplate } from "@/lib/auth/verified-role";
import type { AdmissionStatus } from "./_data/admissions";

// Admissions review/decision actions are admin/receptionist work, matching
// the page-level gate in app/dashboard/admissions/page.tsx.
async function requireAdmissionsAccess() {
  return requireRoleOrStaffTemplate(["admin", "super_admin"], ["receptionist"]);
}

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

  documents?: { category: string; fileUrl: string; fileName: string }[];

  notes?: string;
}

export async function createApplication(input: NewApplicationInput): Promise<string> {
  const schoolId = await getCurrentSchoolIdOrThrow();
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
      school_id: schoolId,
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

  if (input.documents && input.documents.length > 0) {
    const { error: docError } = await supabaseAdmin.from("admission_documents").insert(
      input.documents.map((d) => ({
        application_id: data.id,
        category: d.category,
        file_name: d.fileName,
        file_url: d.fileUrl,
      }))
    );
    if (docError) throw new Error(`Application created, but failed to save documents: ${docError.message}`);
  }

  await logAuditEvent({
    schoolId,
    action: "create",
    module: "Admissions",
    description: `New admission application — ${input.applicantName} (${applicationNo})`,
  });

  const { data: { user } } = await getUser();
  await notifyRoles({
    schoolId,
    roles: ["admin", "super_admin", "staff"],
    excludeProfileId: user?.id,
    title: "New admission application",
    description: `${input.applicantName} applied for Class ${input.applyingForGrade}`,
    link: `/dashboard/admissions/${data.id}`,
  });

  revalidatePath("/dashboard/admissions");
  return data.id;
}

export async function updateApplicationStatus(applicationId: string, status: AdmissionStatus, reason?: string) {
  await requireAdmissionsAccess();
  const schoolId = await resolveAuthorizedSchoolId("admission_applications", applicationId);

  const { data: app, error } = await supabaseAdmin
    .from("admission_applications")
    .update({ status, status_reason: reason?.trim() || null, updated_at: new Date().toISOString() })
    .eq("id", applicationId)
    .eq("school_id", schoolId)
    .select("applicant_name")
    .single();

  if (error) throw new Error(error.message);

  const action = status === "approved" ? "approve" : status === "rejected" ? "reject" : "update";
  await logAuditEvent({
    schoolId,
    action,
    module: "Admissions",
    description: `${app.applicant_name}'s application marked '${status}'${reason ? ` — ${reason.trim()}` : ""}`,
  });

  revalidatePath("/dashboard/admissions");
  revalidatePath(`/dashboard/admissions/${applicationId}`);
}

export interface ApplicationDetailsPatch {
  applicantName?: string;
  dob?: string | null;
  gender?: "Male" | "Female" | "Other";
  applyingForGrade?: string;
  previousSchool?: string | null;
  address?: string | null;
  bloodGroup?: string | null;
  category?: string | null;
  nationality?: string | null;

  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;

  fatherName?: string | null;
  fatherOccupation?: string | null;
  fatherPhone?: string | null;
  fatherEmail?: string | null;

  motherName?: string | null;
  motherOccupation?: string | null;
  motherPhone?: string | null;
  motherEmail?: string | null;

  guardianName?: string | null;
  guardianRelation?: string | null;
  guardianPhone?: string | null;

  siblingStudying?: boolean;
  siblingName?: string | null;

  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;

  notes?: string | null;
}

export async function updateApplicationDetails(applicationId: string, patch: ApplicationDetailsPatch) {
  await requireAdmissionsAccess();
  const schoolId = await getCurrentSchoolIdOrThrow();

  const row: Record<string, unknown> = {};
  if (patch.applicantName    !== undefined) row.applicant_name     = patch.applicantName;
  if (patch.dob              !== undefined) row.dob                = patch.dob;
  if (patch.gender           !== undefined) row.gender             = patch.gender;
  if (patch.applyingForGrade !== undefined) row.applying_for_grade = patch.applyingForGrade;
  if (patch.previousSchool   !== undefined) row.previous_school    = patch.previousSchool;
  if (patch.address          !== undefined) row.address            = patch.address;
  if (patch.bloodGroup       !== undefined) row.blood_group        = patch.bloodGroup;
  if (patch.category         !== undefined) row.category           = patch.category;
  if (patch.nationality      !== undefined) row.nationality        = patch.nationality;

  if (patch.parentName  !== undefined) row.parent_name  = patch.parentName;
  if (patch.parentPhone !== undefined) row.parent_phone = patch.parentPhone;
  if (patch.parentEmail !== undefined) row.parent_email = patch.parentEmail;

  if (patch.fatherName       !== undefined) row.father_name       = patch.fatherName;
  if (patch.fatherOccupation !== undefined) row.father_occupation = patch.fatherOccupation;
  if (patch.fatherPhone      !== undefined) row.father_phone      = patch.fatherPhone;
  if (patch.fatherEmail      !== undefined) row.father_email      = patch.fatherEmail;

  if (patch.motherName       !== undefined) row.mother_name       = patch.motherName;
  if (patch.motherOccupation !== undefined) row.mother_occupation = patch.motherOccupation;
  if (patch.motherPhone      !== undefined) row.mother_phone      = patch.motherPhone;
  if (patch.motherEmail      !== undefined) row.mother_email      = patch.motherEmail;

  if (patch.guardianName     !== undefined) row.guardian_name     = patch.guardianName;
  if (patch.guardianRelation !== undefined) row.guardian_relation = patch.guardianRelation;
  if (patch.guardianPhone    !== undefined) row.guardian_phone    = patch.guardianPhone;

  if (patch.siblingStudying !== undefined) row.sibling_studying = patch.siblingStudying;
  if (patch.siblingName     !== undefined) row.sibling_name     = patch.siblingName;

  if (patch.emergencyContactName  !== undefined) row.emergency_contact_name  = patch.emergencyContactName;
  if (patch.emergencyContactPhone !== undefined) row.emergency_contact_phone = patch.emergencyContactPhone;

  if (patch.notes !== undefined) row.notes = patch.notes;

  if (Object.keys(row).length === 0) return;
  row.updated_at = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("admission_applications")
    .update(row)
    .eq("id", applicationId)
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/admissions");
  revalidatePath(`/dashboard/admissions/${applicationId}`);
}

export async function deleteAdmissionDocument(documentId: string, applicationId: string) {
  const { data: doc } = await supabaseAdmin
    .from("admission_documents")
    .select("file_url")
    .eq("id", documentId)
    .single();

  const { error } = await supabaseAdmin
    .from("admission_documents")
    .delete()
    .eq("id", documentId);

  if (error) throw new Error(error.message);

  if (doc?.file_url) {
    const path = doc.file_url.split("/admission-documents/")[1];
    if (path) await supabaseAdmin.storage.from("admission-documents").remove([path]);
  }

  revalidatePath(`/dashboard/admissions/${applicationId}`);
}

export interface EnrollResult {
  rollNo: string;
  loginEmail: string;
  loginPassword: string;
  parentLogin: ParentLogin | null;
  admissionFeeDue: number;
  admissionFeeCollected: number;
}

export interface AdmissionFeeCollection {
  collectedAmount: number;
  paymentMode: "online" | "cash" | "cheque" | "upi";
}

export async function enrollApplication(applicationId: string, fee?: AdmissionFeeCollection): Promise<EnrollResult> {
  await requireAdmissionsAccess();
  const schoolId = await resolveAuthorizedSchoolId("admission_applications", applicationId);

  const { data: app, error: fetchError } = await supabaseAdmin
    .from("admission_applications")
    .select("applicant_name, dob, gender, applying_for_grade, academic_year_id, parent_name, parent_phone, parent_email, photo_url")
    .eq("id", applicationId)
    .eq("school_id", schoolId)
    .single();

  if (fetchError || !app) throw new Error(fetchError?.message ?? "Application not found");

  const { maxStudents, atCapacity } = await getStudentCapacity(await getCurrentInstitutionIdOrThrow());
  if (atCapacity) throw new Error(`Your plan allows up to ${maxStudents} students. Upgrade your plan to enroll more.`);

  const result = await enrollStudent({
    schoolId,
    fullName: app.applicant_name,
    dob: app.dob,
    gender: app.gender,
    gradeLevel: parseInt(app.applying_for_grade, 10),
    academicYearId: app.academic_year_id,
    parentName: app.parent_name,
    parentPhone: app.parent_phone,
    parentEmail: app.parent_email,
    photoUrl: app.photo_url,
    admissionFeeCollected: fee?.collectedAmount,
    admissionFeePaymentMode: fee?.paymentMode,
  });

  const { error: updateError } = await supabaseAdmin
    .from("admission_applications")
    .update({ status: "enrolled", updated_at: new Date().toISOString() })
    .eq("id", applicationId);

  if (updateError) throw new Error(updateError.message);

  await logAuditEvent({
    schoolId,
    action: "create",
    module: "Admissions",
    description: fee && fee.collectedAmount > 0
      ? `Enrolled ${app.applicant_name} from admission application — collected ${fee.collectedAmount.toLocaleString("en-IN")} admission fee (${fee.paymentMode})`
      : `Enrolled ${app.applicant_name} from admission application`,
  });

  revalidatePath("/dashboard/admissions");
  revalidatePath(`/dashboard/admissions/${applicationId}`);
  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard/fees");

  return {
    rollNo: result.rollNo,
    loginEmail: result.loginEmail,
    loginPassword: result.loginPassword,
    parentLogin: result.parentLogin,
    admissionFeeDue: result.admissionFeeDue,
    admissionFeeCollected: result.admissionFeeCollected,
  };
}
