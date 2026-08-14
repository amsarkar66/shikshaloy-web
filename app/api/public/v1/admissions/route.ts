import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { resolveKeyOwner, schoolBelongsToOwner, CORS_HEADERS } from "@/lib/publish-keys/resolve";
import { submitPublicAdmission, type PublicAdmissionInput } from "@/lib/public-site/submit-admission";

const ALLOWED_DOC_TYPES = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const MAX_DOC_SIZE = 5 * 1024 * 1024;
const DOC_FIELDS: { field: string; category: string }[] = [
  { field: "photo", category: "photo" },
  { field: "birthCertificate", category: "birth_certificate" },
  { field: "other", category: "other" },
];

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  const resolved = await resolveKeyOwner(request);
  if (!resolved) return jsonError("Invalid or revoked publish key", 401);

  const form = await request.formData().catch(() => null);
  if (!form) return jsonError("Invalid form data", 400);

  // Honeypot — bots tend to fill every field, humans never see this one.
  if (String(form.get("website") ?? "").trim()) {
    return NextResponse.json({ ok: true, applicationNo: "" }, { headers: CORS_HEADERS });
  }

  const schoolId = String(form.get("schoolId") ?? "");
  const applicantName = String(form.get("applicantName") ?? "").trim();
  const gender = String(form.get("gender") ?? "");
  const applyingForGrade = String(form.get("applyingForGrade") ?? "").trim();
  const primaryContact = String(form.get("primaryContact") ?? "father");

  if (!schoolId || !applicantName || !applyingForGrade) {
    return jsonError("Missing required fields", 400);
  }
  if (!["Male", "Female", "Other"].includes(gender)) {
    return jsonError("Invalid gender", 400);
  }
  if (!["father", "mother", "guardian"].includes(primaryContact)) {
    return jsonError("Invalid primary contact", 400);
  }
  if (!(await schoolBelongsToOwner(schoolId, resolved.ownerId))) {
    return jsonError("Unknown school", 400);
  }

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

  let applicationId: string;
  let applicationNo: string;
  try {
    ({ applicationId, applicationNo } = await submitPublicAdmission(input));
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Failed to submit application", 500);
  }

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

  return NextResponse.json({ ok: true, applicationNo }, { headers: CORS_HEADERS });
}
