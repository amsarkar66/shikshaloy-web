"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentInstitutionIdOrThrow, getInstitutionSchools } from "@/lib/supabase/institution-context";
import { resolveAuthorizedSchoolId, assertAuthorizedSchool } from "@/lib/supabase/authorized-school";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import { getStudentCapacity } from "@/lib/billing/plan-limits";
import { logAuditEvent } from "@/lib/audit/log";
import { enrollStudent, createLoginForExistingStudent, type EnrollStudentResult } from "@/lib/students/enroll";
import { addressForStorage, formatAddress, type StructuredAddress } from "@/lib/students/address";
import { randomPassword } from "@/lib/auth/random-password";
import { getVerifiedUser, requireRoleOrStaffTemplate, type VerifiedProfile } from "@/lib/auth/verified-role";
import type { LeaveType } from "../leaves/_data/leaves";

// Student records hold sensitive PII (contacts, medical info, login
// credentials) and student/parent/driver accounts must never be able to
// read or mutate another student's record — only admins manage students.
async function requireStudentAdmin(): Promise<VerifiedProfile> {
  const vu = await getVerifiedUser();
  if (!vu || (vu.role !== "admin" && vu.role !== "super_admin")) throw new Error("Unauthorized");
  return vu;
}

export interface AddStudentInput {
  fullName: string;
  dob: string | null;
  gender: "Male" | "Female" | "Other" | null;
  sectionId: string;
  gradeLevel: number;
  admissionNo?: string | null;
  phone?: string | null;
  presentAddress?: Partial<StructuredAddress> | null;
  permanentAddress?: Partial<StructuredAddress> | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  parentOccupation?: string | null;
  parentQualification?: string | null;
  photoUrl?: string | null;
  bloodGroup?: string | null;
  category?: string | null;
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
  const vu = await requireStudentAdmin();
  const { maxStudents, atCapacity } = await getStudentCapacity(await getCurrentInstitutionIdOrThrow());
  if (atCapacity) throw new Error(`Your plan allows up to ${maxStudents} students. Upgrade your plan to add more.`);

  // Derive the school/academic year from the chosen section itself, rather
  // than the "active school" cookie — the section the caller picked already
  // pins both, which is what lets a super_admin add a student into any of
  // their institution's schools from a combined students view without first
  // switching the active school to match (see lib/supabase/authorized-school.ts).
  const { data: section } = await supabaseAdmin
    .from("sections")
    .select("school_id, academic_year_id")
    .eq("id", input.sectionId)
    .maybeSingle();
  if (!section) throw new Error("Please choose a valid class/section.");
  await assertAuthorizedSchool(vu, section.school_id);

  const schoolId = section.school_id;
  const result = await enrollStudent({
    schoolId,
    fullName: input.fullName,
    dob: input.dob,
    gender: input.gender,
    gradeLevel: input.gradeLevel,
    academicYearId: section.academic_year_id,
    sectionId: input.sectionId,
    admissionNo: input.admissionNo,
    phone: input.phone,
    presentAddress: input.presentAddress,
    permanentAddress: input.permanentAddress,
    parentName: input.parentName,
    parentPhone: input.parentPhone,
    parentEmail: input.parentEmail,
    parentOccupation: input.parentOccupation,
    parentQualification: input.parentQualification,
    photoUrl: input.photoUrl,
    bloodGroup: input.bloodGroup,
    category: input.category,
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

  await logAuditEvent({
    schoolId,
    action: "create",
    module: "Students",
    description: `Enrolled new student — ${input.fullName}`,
  });

  revalidatePath("/dashboard/students");
  return result;
}

export interface StudentExportRow {
  id: string;
  name: string;
  rollNo: string;
  admissionNo: string;
  class: string;
  section: string;
  gender: string;
  dob: string;
  phone: string;
  presentAddress: string;
  permanentAddress: string;
  bloodGroup: string;
  category: string;
  religion: string;
  caste: string;
  motherTongue: string;
  language: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  medicalConditions: string;
  allergies: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  parentQualification: string;
  parentOccupation: string;
  attendance: number;
  feeStatus: string;
  status: string;
  joinedDate: string;
  schoolName: string;
}

interface StudentExportQueryRow {
  id: string;
  full_name: string;
  roll_no: string | null;
  admission_no: string | null;
  dob: string | null;
  gender: string | null;
  present_address: Partial<StructuredAddress> | null;
  permanent_address: Partial<StructuredAddress> | null;
  phone: string | null;
  attendance_pct: number | null;
  fee_status: string | null;
  status: string | null;
  joined_date: string | null;
  school_id: string;
  blood_group: string | null;
  category: string | null;
  religion: string | null;
  caste: string | null;
  mother_tongue: string | null;
  language: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  medical_conditions: string | null;
  allergies: string | null;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
  student_parents: { parents: { full_name: string | null; phone: string | null; email: string | null; occupation: string | null; qualification: string | null } | null }[] | null;
}

// Full per-student export — every field collected on the Add Student form,
// unlike the list view's slim column set (see StudentsClient's Student
// interface) which only carries what the table displays.
export async function getStudentsFullExport(): Promise<StudentExportRow[]> {
  const vu = await requireStudentAdmin();

  let schoolIds: string[];
  let schoolNameById = new Map<string, string>();
  if (vu.role === "super_admin") {
    const institutionId = await getCurrentInstitutionIdOrThrow();
    const schools = await getInstitutionSchools(institutionId);
    schoolIds = schools.map((s) => s.id);
    schoolNameById = new Map(schools.map((s) => [s.id, s.name]));
  } else {
    schoolIds = [await getCurrentSchoolIdOrThrow()];
  }
  if (schoolIds.length === 0) return [];

  const { data, error } = await supabaseAdmin
    .from("students")
    .select(`
      id, full_name, roll_no, admission_no, dob, gender, present_address, permanent_address, phone,
      attendance_pct, fee_status, status, joined_date, school_id,
      blood_group, category, religion, caste, mother_tongue, language,
      emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
      medical_conditions, allergies,
      sections ( name, grades ( level ) ),
      student_parents ( parents ( full_name, phone, email, occupation, qualification ) )
    `)
    .in("school_id", schoolIds)
    .order("full_name");

  if (error) throw new Error(`Failed to export students: ${error.message}`);

  return ((data ?? []) as unknown as StudentExportQueryRow[]).map((s) => {
    const parent = s.student_parents?.[0]?.parents ?? null;
    return {
      id: s.id,
      name: s.full_name,
      rollNo: s.roll_no ?? "",
      admissionNo: s.admission_no ?? "",
      class: String(s.sections?.grades?.level ?? ""),
      section: s.sections?.name ?? "",
      gender: s.gender ?? "",
      dob: s.dob ?? "",
      phone: s.phone ?? "",
      presentAddress: formatAddress(s.present_address),
      permanentAddress: formatAddress(s.permanent_address),
      bloodGroup: s.blood_group ?? "",
      category: s.category ?? "",
      religion: s.religion ?? "",
      caste: s.caste ?? "",
      motherTongue: s.mother_tongue ?? "",
      language: s.language ?? "",
      emergencyContactName: s.emergency_contact_name ?? "",
      emergencyContactPhone: s.emergency_contact_phone ?? "",
      emergencyContactRelation: s.emergency_contact_relation ?? "",
      medicalConditions: s.medical_conditions ?? "",
      allergies: s.allergies ?? "",
      parentName: parent?.full_name ?? "",
      parentPhone: parent?.phone ?? "",
      parentEmail: parent?.email ?? "",
      parentQualification: parent?.qualification ?? "",
      parentOccupation: parent?.occupation ?? "",
      attendance: Math.round(s.attendance_pct ?? 0),
      feeStatus: s.fee_status ?? "",
      status: s.status ?? "",
      joinedDate: s.joined_date ?? "",
      schoolName: schoolNameById.get(s.school_id) ?? "",
    };
  });
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
  presentAddress?: Partial<StructuredAddress> | null;
  permanentAddress?: Partial<StructuredAddress> | null;
  photoUrl?: string | null;
  active: boolean;
  parentId?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  parentOccupation?: string | null;
  parentQualification?: string | null;
  bloodGroup?: string | null;
  category?: string | null;
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
  await requireStudentAdmin();
  const schoolId = await resolveAuthorizedSchoolId("students", input.studentId);
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
      present_address: addressForStorage(input.presentAddress),
      permanent_address: addressForStorage(input.permanentAddress),
      photo_url: input.photoUrl || null,
      status: input.active ? "active" : "inactive",
      blood_group: input.bloodGroup || null,
      category: input.category || null,
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
    if (!input.parentPhone || !input.parentEmail) {
      throw new Error("Parent phone and email are required");
    }
    const { data: link } = await supabaseAdmin
      .from("student_parents")
      .select("parent_id")
      .eq("student_id", input.studentId)
      .eq("parent_id", input.parentId)
      .maybeSingle();
    if (!link) throw new Error("That parent is not linked to this student.");

    const { error: parentError } = await supabaseAdmin
      .from("parents")
      .update({
        full_name: input.parentName,
        phone: input.parentPhone || null,
        email: input.parentEmail || null,
        occupation: input.parentOccupation || null,
        qualification: input.parentQualification || null,
      })
      .eq("id", input.parentId)
      .eq("school_id", schoolId);

    if (parentError) throw new Error(`Failed to update parent: ${parentError.message}`);
  }

  await logAuditEvent({
    schoolId,
    action: "update",
    module: "Students",
    description: `Updated student record — ${input.fullName}`,
  });

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
  const { id: userId } = await requireRoleOrStaffTemplate(["admin", "super_admin", "kernel"], ["hr_manager"]);
  const schoolId = await resolveAuthorizedSchoolId("student_leave_requests", leaveId);

  const { data: approver } = await supabaseAdmin
    .from("staff_members")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();
  const approvedBy = approver?.id ?? null;

  const { error } = await supabaseAdmin
    .from("student_leave_requests")
    .update({ status, approved_by: approvedBy })
    .eq("id", leaveId)
    .eq("school_id", schoolId);

  if (error) throw new Error(`Failed to update leave status: ${error.message}`);

  const { data: student } = await supabaseAdmin
    .from("students")
    .select("full_name")
    .eq("id", studentId)
    .maybeSingle();
  if (student) {
    await logAuditEvent({
      schoolId,
      action: status === "approved" ? "approve" : "reject",
      module: "Leave",
      description: `${status === "approved" ? "Approved" : "Rejected"} leave request for ${student.full_name}`,
    });
  }

  revalidatePath(`/dashboard/students/${studentId}`);
  revalidatePath("/dashboard/leaves");
}

export async function setStudentActive(studentId: string, active: boolean): Promise<void> {
  await requireStudentAdmin();
  const schoolId = await resolveAuthorizedSchoolId("students", studentId);
  const { data: student, error } = await supabaseAdmin
    .from("students")
    .update({ status: active ? "active" : "inactive" })
    .eq("id", studentId)
    .eq("school_id", schoolId)
    .select("full_name")
    .single();

  if (error) throw new Error(`Failed to update student status: ${error.message}`);

  await logAuditEvent({
    schoolId,
    action: active ? "update" : "delete",
    module: "Students",
    description: `${active ? "Reactivated" : "Deactivated"} student — ${student.full_name}`,
  });

  revalidatePath("/dashboard/students");
  revalidatePath(`/dashboard/students/${studentId}`);
}

export async function getStudentLoginEmail(studentId: string): Promise<{ email: string | null }> {
  await requireStudentAdmin();
  const schoolId = await resolveAuthorizedSchoolId("students", studentId);
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
  await requireStudentAdmin();
  const schoolId = await resolveAuthorizedSchoolId("students", studentId);
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
  await requireStudentAdmin();
  const schoolId = await resolveAuthorizedSchoolId("students", studentId);
  const result = await createLoginForExistingStudent(studentId, schoolId);
  revalidatePath("/dashboard/students");
  return result;
}

// ── Documents ────────────────────────────────────────────────────────────────

export async function uploadStudentDocument(studentId: string, category: string, formData: FormData): Promise<void> {
  await requireStudentAdmin();
  const schoolId = await resolveAuthorizedSchoolId("students", studentId);
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
  await requireStudentAdmin();
  const schoolId = await resolveAuthorizedSchoolId("students", studentId);
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
  await requireStudentAdmin();
  const schoolId = await resolveAuthorizedSchoolId("students", studentId);
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
  admissionNo?: string;
  class: string;
  section?: string;
  gender?: string;
  dob?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  bloodGroup?: string;
  category?: string;
  religion?: string;
  caste?: string;
  motherTongue?: string;
  language?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  medicalConditions?: string;
  allergies?: string;
  parent?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentQualification?: string;
  parentOccupation?: string;
}

export interface BulkImportOutcome {
  succeeded: number;
  failed: Array<{ row: string; reason: string }>;
}

function normalizeGender(g?: string): "Male" | "Female" | "Other" | null {
  const v = (g ?? "").trim().toLowerCase();
  if (v === "male" || v === "m") return "Male";
  if (v === "female" || v === "f") return "Female";
  if (v === "other" || v === "o") return "Other";
  return null;
}

export async function bulkImportStudents(rows: BulkImportRow[]): Promise<BulkImportOutcome> {
  await requireStudentAdmin();
  const outcome: BulkImportOutcome = { succeeded: 0, failed: [] };
  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const { maxStudents, studentsUsed } = await getStudentCapacity(await getCurrentInstitutionIdOrThrow());
  const remainingSlots = maxStudents === null ? Infinity : Math.max(0, maxStudents - studentsUsed);

  for (const row of rows) {
    const gradeLevel = parseInt(row.class, 10);
    if (!row.name || Number.isNaN(gradeLevel)) {
      outcome.failed.push({ row: row.name || "(unnamed)", reason: "Missing name or invalid class" });
      continue;
    }
    if (outcome.succeeded >= remainingSlots) {
      outcome.failed.push({ row: row.name, reason: `Your plan allows up to ${maxStudents} students — upgrade to import more.` });
      continue;
    }
    const address = {
      line1: row.addressLine1 || "", line2: row.addressLine2 || "",
      city: row.city || "", state: row.state || "",
      postalCode: row.postalCode || "", country: row.country || "",
    };
    try {
      await enrollStudent({
        schoolId,
        fullName: row.name,
        dob: row.dob || null,
        gender: normalizeGender(row.gender),
        gradeLevel,
        academicYearId,
        sectionName: row.section || null,
        rollNo: row.rollNo || null,
        admissionNo: row.admissionNo || null,
        phone: row.phone || null,
        presentAddress: address,
        permanentAddress: address,
        parentName: row.parent || null,
        parentPhone: row.parentPhone || null,
        parentEmail: row.parentEmail || null,
        parentQualification: row.parentQualification || null,
        parentOccupation: row.parentOccupation || null,
        bloodGroup: row.bloodGroup || null,
        category: row.category || null,
        religion: row.religion || null,
        caste: row.caste || null,
        motherTongue: row.motherTongue || null,
        language: row.language || null,
        emergencyContactName: row.emergencyContactName || null,
        emergencyContactPhone: row.emergencyContactPhone || null,
        emergencyContactRelation: row.emergencyContactRelation || null,
        medicalConditions: row.medicalConditions || null,
        allergies: row.allergies || null,
      });
      outcome.succeeded += 1;
    } catch (e) {
      outcome.failed.push({ row: row.name, reason: e instanceof Error ? e.message : "Unknown error" });
    }
  }

  if (outcome.succeeded > 0) {
    await logAuditEvent({
      schoolId,
      action: "create",
      module: "Students",
      description: `Bulk-imported ${outcome.succeeded} student${outcome.succeeded === 1 ? "" : "s"}`,
    });
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
  await requireStudentAdmin();
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
