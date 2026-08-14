"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import { enrollStudent, createLoginForExistingStudent, type EnrollStudentResult } from "@/lib/students/enroll";
import { randomPassword } from "@/lib/auth/random-password";
import type { LeaveType } from "../leaves/_data/leaves";

export interface AddStudentInput {
  fullName: string;
  dob: string | null;
  gender: "Male" | "Female" | "Other" | null;
  sectionId: string;
  gradeLevel: number;
  admissionNo?: string | null;
  phone?: string | null;
  address?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  photoUrl?: string | null;
  bloodGroup?: string | null;
  religion?: string | null;
  caste?: string | null;
  motherTongue?: string | null;
  language?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  medicalConditions?: string | null;
  allergies?: string | null;
}

export async function addStudentManual(input: AddStudentInput): Promise<EnrollStudentResult> {
  const result = await enrollStudent({
    schoolId: await getCurrentSchoolIdOrThrow(),
    fullName: input.fullName,
    dob: input.dob,
    gender: input.gender,
    gradeLevel: input.gradeLevel,
    academicYearId: await getCurrentAcademicYearId(),
    sectionId: input.sectionId,
    admissionNo: input.admissionNo,
    phone: input.phone,
    address: input.address,
    parentName: input.parentName,
    parentPhone: input.parentPhone,
    parentEmail: input.parentEmail,
    photoUrl: input.photoUrl,
    bloodGroup: input.bloodGroup,
    religion: input.religion,
    caste: input.caste,
    motherTongue: input.motherTongue,
    language: input.language,
    emergencyContactName: input.emergencyContactName,
    emergencyContactPhone: input.emergencyContactPhone,
    emergencyContactRelation: input.emergencyContactRelation,
    medicalConditions: input.medicalConditions,
    allergies: input.allergies,
  });

  revalidatePath("/dashboard/students");
  return result;
}

export interface UpdateStudentInput {
  studentId: string;
  fullName: string;
  rollNo: string;
  admissionNo?: string | null;
  dob: string | null;
  gender: "Male" | "Female" | "Other" | null;
  sectionId: string;
  phone?: string | null;
  address?: string | null;
  photoUrl?: string | null;
  active: boolean;
  parentId?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  bloodGroup?: string | null;
  religion?: string | null;
  caste?: string | null;
  motherTongue?: string | null;
  language?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelation?: string | null;
  medicalConditions?: string | null;
  allergies?: string | null;
}

export async function updateStudent(input: UpdateStudentInput): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin
    .from("students")
    .update({
      full_name: input.fullName,
      roll_no: input.rollNo || null,
      admission_no: input.admissionNo || null,
      dob: input.dob,
      gender: input.gender,
      section_id: input.sectionId,
      phone: input.phone || null,
      address: input.address || null,
      photo_url: input.photoUrl || null,
      status: input.active ? "active" : "inactive",
      blood_group: input.bloodGroup || null,
      religion: input.religion || null,
      caste: input.caste || null,
      mother_tongue: input.motherTongue || null,
      language: input.language || null,
      emergency_contact_name: input.emergencyContactName || null,
      emergency_contact_phone: input.emergencyContactPhone || null,
      emergency_contact_relation: input.emergencyContactRelation || null,
      medical_conditions: input.medicalConditions || null,
      allergies: input.allergies || null,
    })
    .eq("id", input.studentId)
    .eq("school_id", schoolId);

  if (error) throw new Error(`Failed to update student: ${error.message}`);

  if (input.parentId && input.parentName) {
    const { error: parentError } = await supabaseAdmin
      .from("parents")
      .update({
        full_name: input.parentName,
        phone: input.parentPhone || null,
        email: input.parentEmail || null,
      })
      .eq("id", input.parentId);

    if (parentError) throw new Error(`Failed to update parent: ${parentError.message}`);
  }

  revalidatePath("/dashboard/students");
  revalidatePath(`/dashboard/students/${input.studentId}`);
}

export async function applyStudentLeave(input: {
  studentId: string;
  leaveType: LeaveType;
  from: string;
  to: string;
  reason: string;
}): Promise<{ id: string; days: number }> {
  const fromDate = new Date(input.from + "T00:00:00");
  const toDate = new Date(input.to + "T00:00:00");
  const days = Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / 86400000) + 1);

  const { data, error } = await supabaseAdmin
    .from("student_leave_requests")
    .insert({
      school_id: await getCurrentSchoolIdOrThrow(),
      student_id: input.studentId,
      leave_type: input.leaveType,
      from_date: input.from,
      to_date: input.to,
      days,
      reason: input.reason,
      status: "pending",
      applied_on: new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(`Failed to submit leave request: ${error?.message ?? "unknown error"}`);
  revalidatePath(`/dashboard/students/${input.studentId}`);
  revalidatePath("/dashboard/leaves");
  return { id: data.id, days };
}

export async function updateStudentLeaveStatus(
  leaveId: string,
  studentId: string,
  status: "approved" | "rejected"
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as string | undefined;
  const staffTemplateId = user?.user_metadata?.staff_template_id as string | undefined;
  const canApprove = role === "admin" || role === "super_admin" || role === "kernel" || (role === "staff" && staffTemplateId === "hr_manager");
  if (!user || !canApprove) throw new Error("Unauthorized");

  const { data: approver } = await supabaseAdmin
    .from("staff_members")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();
  const approvedBy = approver?.id ?? null;

  const { error } = await supabaseAdmin
    .from("student_leave_requests")
    .update({ status, approved_by: approvedBy })
    .eq("id", leaveId);

  if (error) throw new Error(`Failed to update leave status: ${error.message}`);
  revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath("/dashboard/leaves");
}

export async function setStudentActive(studentId: string, active: boolean): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin
    .from("students")
    .update({ status: active ? "active" : "inactive" })
    .eq("id", studentId)
    .eq("school_id", schoolId);

  if (error) throw new Error(`Failed to update student status: ${error.message}`);

  revalidatePath("/dashboard/students");
  revalidatePath(`/dashboard/students/${studentId}`);
}

export async function getStudentLoginEmail(studentId: string): Promise<{ email: string | null }> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data: student, error } = await supabaseAdmin
    .from("students")
    .select("profile_id")
    .eq("id", studentId)
    .eq("school_id", schoolId)
    .single();

  if (error || !student?.profile_id) return { email: null };

  const { data, error: userError } = await supabaseAdmin.auth.admin.getUserById(student.profile_id);
  if (userError || !data?.user) return { email: null };

  return { email: data.user.email ?? null };
}

export async function resetStudentPassword(studentId: string): Promise<{ email: string; password: string }> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data: student, error } = await supabaseAdmin
    .from("students")
    .select("profile_id")
    .eq("id", studentId)
    .eq("school_id", schoolId)
    .single();

  if (error || !student?.profile_id) throw new Error("This student has no login account.");

  const password = randomPassword();
  const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(student.profile_id, { password });
  if (updateError || !data?.user) throw new Error(`Failed to reset password: ${updateError?.message ?? "unknown error"}`);

  return { email: data.user.email ?? "", password };
}

export async function createStudentLogin(studentId: string): Promise<{ email: string; password: string }> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const result = await createLoginForExistingStudent(studentId, schoolId);
  revalidatePath("/dashboard/students");
  return result;
}

// ── Documents ────────────────────────────────────────────────────────────────

export async function uploadStudentDocument(studentId: string, category: string, formData: FormData): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) throw new Error("No file provided");

  const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const path = `${studentId}/${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabaseAdmin.storage
    .from("student-documents")
    .upload(path, Buffer.from(arrayBuffer), { contentType: file.type, upsert: false });
  if (uploadError) throw new Error(`Failed to upload document: ${uploadError.message}`);

  const { data: urlData } = supabaseAdmin.storage.from("student-documents").getPublicUrl(path);

  const { error } = await supabaseAdmin.from("student_documents").insert({
    school_id: schoolId,
    student_id: studentId,
    category,
    file_name: file.name,
    file_url: urlData.publicUrl,
    uploaded_by: user?.id ?? null,
  });
  if (error) throw new Error(`Failed to save document record: ${error.message}`);

  revalidatePath(`/dashboard/students/${studentId}`);
}

export async function deleteStudentDocument(documentId: string, studentId: string): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin
    .from("student_documents")
    .delete()
    .eq("id", documentId)
    .eq("school_id", schoolId);
  if (error) throw new Error(`Failed to delete document: ${error.message}`);

  revalidatePath(`/dashboard/students/${studentId}`);
}

// ── Notes ────────────────────────────────────────────────────────────────────

export async function addStudentNote(studentId: string, category: string, note: string): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabaseAdmin.from("student_notes").insert({
    school_id: schoolId,
    student_id: studentId,
    author_id: user?.id ?? null,
    category,
    note,
  });
  if (error) throw new Error(`Failed to save note: ${error.message}`);

  revalidatePath(`/dashboard/students/${studentId}`);
}

export interface BulkImportRow {
  name: string;
  rollNo?: string;
  class: string;
  section?: string;
  parent?: string;
  phone?: string;
}

export interface BulkImportOutcome {
  succeeded: number;
  failed: Array<{ row: string; reason: string }>;
}

export async function bulkImportStudents(rows: BulkImportRow[]): Promise<BulkImportOutcome> {
  const outcome: BulkImportOutcome = { succeeded: 0, failed: [] };
  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  for (const row of rows) {
    const gradeLevel = parseInt(row.class, 10);
    if (!row.name || Number.isNaN(gradeLevel)) {
      outcome.failed.push({ row: row.name || "(unnamed)", reason: "Missing name or invalid class" });
      continue;
    }
    try {
      await enrollStudent({
        schoolId,
        fullName: row.name,
        dob: null,
        gender: null,
        gradeLevel,
        academicYearId,
        sectionName: row.section || null,
        rollNo: row.rollNo || null,
        phone: row.phone || null,
        parentName: row.parent || null,
      });
      outcome.succeeded += 1;
    } catch (e) {
      outcome.failed.push({ row: row.name, reason: e instanceof Error ? e.message : "Unknown error" });
    }
  }

  revalidatePath("/dashboard/students");
  return outcome;
}

// ── Promotion ──────────────────────────────────────────────────────────────────

export interface PromotionDecision {
  studentId: string;
  action: "promote" | "retain" | "graduate" | "skip";
  targetSectionId?: string;
}

export async function promoteStudents(
  targetAcademicYearId: string,
  decisions: PromotionDecision[]
): Promise<{ promoted: number; graduated: number }> {
  let promoted = 0;
  let graduated = 0;
  const schoolId = await getCurrentSchoolIdOrThrow();

  await Promise.all(
    decisions.map(async (d) => {
      if (d.action === "skip") return;

      if (d.action === "graduate") {
        const { error } = await supabaseAdmin
          .from("students")
          .update({ status: "graduated" })
          .eq("id", d.studentId)
          .eq("school_id", schoolId);
        if (error) throw new Error(`Failed to graduate student: ${error.message}`);
        await supabaseAdmin.from("student_academic_history").insert({
          school_id: schoolId,
          student_id: d.studentId,
          academic_year_id: targetAcademicYearId,
          section_id: null,
          outcome: "graduated",
        });
        graduated += 1;
        return;
      }

      if (!d.targetSectionId) throw new Error("Missing target section for a promoted/retained student");

      const { error } = await supabaseAdmin
        .from("students")
        .update({
          section_id: d.targetSectionId,
          academic_year_id: targetAcademicYearId,
          attendance_pct: 0,
          fee_status: "overdue",
        })
        .eq("id", d.studentId)
        .eq("school_id", schoolId);
      if (error) throw new Error(`Failed to promote student: ${error.message}`);
      await supabaseAdmin.from("student_academic_history").insert({
        school_id: schoolId,
        student_id: d.studentId,
        academic_year_id: targetAcademicYearId,
        section_id: d.targetSectionId,
        outcome: d.action === "retain" ? "retained" : "promoted",
      });
      promoted += 1;
    })
  );

  revalidatePath("/dashboard/students");
  revalidatePath("/dashboard/classes");
  revalidatePath("/dashboard/students/promote");

  return { promoted, graduated };
}
