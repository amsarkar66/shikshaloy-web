"use server";

import { supabaseAdmin } from "@/lib/supabase/service";
import { schoolBelongsToOwner } from "@/lib/publish-keys/resolve";
import { submitPublicAdmission, type PublicAdmissionInput } from "@/lib/public-site/submit-admission";

const ALLOWED_DOC_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const MAX_DOC_SIZE = 5 * 1024 * 1024;
const DOC_FIELDS: { field: string; category: string }[] = [
  { field: "photo", category: "photo" },
  { field: "birthCertificate", category: "birth_certificate" },
  { field: "other", category: "other" },
];

export async function submitPublicSiteAdmission(ownerId: string, form: FormData): Promise<{ applicationNo: string }> {
  // Honeypot — bots tend to fill every field, humans never see this one.
  if (String(form.get("website") ?? "").trim()) {
    return { applicationNo: "" };
  }

  const schoolId = String(form.get("schoolId") ?? "");
  const applicantName = String(form.get("applicantName") ?? "").trim();
  const gender = String(form.get("gender") ?? "");
  const applyingForGrade = String(form.get("applyingForGrade") ?? "").trim();
  const primaryContact = String(form.get("primaryContact") ?? "father");

  if (!schoolId || !applicantName || !applyingForGrade) throw new Error("Missing required fields");
  if (!["Male", "Female", "Other"].includes(gender)) throw new Error("Invalid gender");
  if (!["father", "mother", "guardian"].includes(primaryContact)) throw new Error("Invalid primary contact");
  if (!(await schoolBelongsToOwner(schoolId, ownerId))) throw new Error("Unknown school");

  const str = (key: string): string | undefined => {
    const v = form.get(key);
    const s = v ? String(v).trim() : "";
    return s || undefined;
  };

  const input: PublicAdmissionInput = {
    schoolId,
    applicantName,
    dob: str("dob") || null,
    gender: gender as PublicAdmissionInput["gender"],
    applyingForGrade,
    previousSchool: str("previousSchool"),
    address: str("address"),
    bloodGroup: str("bloodGroup"),
    category: str("category"),
    nationality: str("nationality"),
    fatherName: str("fatherName"),
    fatherOccupation: str("fatherOccupation"),
    fatherPhone: str("fatherPhone"),
    fatherEmail: str("fatherEmail"),
    motherName: str("motherName"),
    motherOccupation: str("motherOccupation"),
    motherPhone: str("motherPhone"),
    motherEmail: str("motherEmail"),
    guardianName: str("guardianName"),
    guardianRelation: str("guardianRelation"),
    guardianPhone: str("guardianPhone"),
    primaryContact: primaryContact as PublicAdmissionInput["primaryContact"],
    siblingStudying: form.get("siblingStudying") === "true",
    siblingName: str("siblingName"),
    emergencyContactName: str("emergencyContactName"),
    emergencyContactPhone: str("emergencyContactPhone"),
    notes: str("notes"),
  };

  const { applicationId, applicationNo } = await submitPublicAdmission(input);

  for (const { field, category } of DOC_FIELDS) {
    const file = form.get(field);
    if (!(file instanceof File) || file.size === 0) continue;
    if (!ALLOWED_DOC_TYPES.has(file.type)) continue;
    if (file.size > MAX_DOC_SIZE) continue;

    const ext = file.name.split(".").pop() || "bin";
    const path = `${schoolId}/${applicationId}/${category}-${Date.now()}.${ext}`;
    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from("admission-documents")
      .upload(path, buffer, { contentType: file.type });

    if (uploadError) continue;

    const { data: publicUrl } = supabaseAdmin.storage.from("admission-documents").getPublicUrl(path);

    await supabaseAdmin.from("admission_documents").insert({
      application_id: applicationId,
      category,
      file_name: file.name,
      file_url: publicUrl.publicUrl,
    });
  }

  return { applicationNo };
}

export interface PublicResultLookup {
  schoolId: string;
  admissionNo: string;
  dob: string;
}

export interface PublicExamResult {
  id: string;
  examName: string;
  subject: string;
  marksObtained: number | null;
  maxMarks: number | null;
  grade: string | null;
  isAbsent: boolean;
}

interface ExamResultRow {
  id: string;
  marks_obtained: number | null;
  max_marks: number | null;
  grade: string | null;
  is_absent: boolean;
  exams: { name: string; status: string } | null;
  subjects: { name: string } | null;
}

export async function checkPublicSiteResults(
  ownerId: string,
  lookup: PublicResultLookup
): Promise<{ studentName: string; results: PublicExamResult[] }> {
  if (!lookup.schoolId || !lookup.admissionNo?.trim() || !lookup.dob) throw new Error("Missing required fields");
  if (!(await schoolBelongsToOwner(lookup.schoolId, ownerId))) throw new Error("No matching record found");

  const { data: student } = await supabaseAdmin
    .from("students")
    .select("id, full_name")
    .eq("school_id", lookup.schoolId)
    .eq("admission_no", lookup.admissionNo.trim())
    .eq("dob", lookup.dob)
    .maybeSingle();

  if (!student) throw new Error("No matching record found");

  const { data: resultRows } = await supabaseAdmin
    .from("exam_results")
    .select("id, marks_obtained, max_marks, grade, is_absent, exams!inner(name, status), subjects(name)")
    .eq("student_id", student.id)
    .eq("exams.status", "published");

  const results = ((resultRows ?? []) as unknown as ExamResultRow[]).map((r) => ({
    id: r.id,
    examName: r.exams?.name ?? "",
    subject: r.subjects?.name ?? "",
    marksObtained: r.marks_obtained,
    maxMarks: r.max_marks,
    grade: r.grade,
    isAbsent: r.is_absent,
  }));

  return { studentName: student.full_name, results };
}

export interface PublicGrievanceInput {
  schoolId: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  subject: string;
  message: string;
  website: string; // honeypot — must stay empty
}

export async function submitPublicSiteGrievance(ownerId: string, values: PublicGrievanceInput): Promise<void> {
  // Honeypot — bots tend to fill every field, humans never see this one.
  if (values.website) return;

  if (!values.schoolId || !values.name?.trim() || !values.subject?.trim() || !values.message?.trim()) {
    throw new Error("Missing required fields");
  }
  if (!(await schoolBelongsToOwner(values.schoolId, ownerId))) throw new Error("Unknown school");

  const { error } = await supabaseAdmin.from("grievances").insert({
    school_id: values.schoolId,
    name: values.name.trim(),
    email: values.email?.trim() || null,
    phone: values.phone?.trim() || null,
    category: values.category?.trim() || "other",
    subject: values.subject.trim(),
    message: values.message.trim(),
    status: "open",
  });

  if (error) throw new Error("Failed to submit grievance");
}
