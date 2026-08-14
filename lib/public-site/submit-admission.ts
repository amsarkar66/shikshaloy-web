import { supabaseAdmin } from "@/lib/supabase/service";

export type PrimaryContact = "father" | "mother" | "guardian";

export interface PublicAdmissionInput {
  schoolId: string;
  applicantName: string;
  dob: string | null;
  gender: "Male" | "Female" | "Other";
  applyingForGrade: string;
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

  notes?: string;
}

export interface PublicAdmissionResult {
  applicationId: string;
  applicationNo: string;
}

export async function submitPublicAdmission(input: PublicAdmissionInput): Promise<PublicAdmissionResult> {
  const { data: year } = await supabaseAdmin
    .from("academic_years")
    .select("id, name")
    .eq("school_id", input.schoolId)
    .eq("is_current", true)
    .maybeSingle();

  if (!year) throw new Error("This school has no active academic year configured yet");

  const startYear = parseInt((year.name ?? "").split("-")[0], 10);
  const admYear = Number.isNaN(startYear) ? new Date().getFullYear() : startYear + 1;

  const { count } = await supabaseAdmin
    .from("admission_applications")
    .select("id", { count: "exact", head: true })
    .eq("academic_year_id", year.id);

  const seq = String((count ?? 0) + 1).padStart(3, "0");
  const applicationNo = `ADM-${admYear}-${seq}`;

  const primary =
    input.primaryContact === "father"
      ? { name: input.fatherName, phone: input.fatherPhone, email: input.fatherEmail }
      : input.primaryContact === "mother"
      ? { name: input.motherName, phone: input.motherPhone, email: input.motherEmail }
      : { name: input.guardianName, phone: input.guardianPhone, email: undefined };

  const { data, error } = await supabaseAdmin
    .from("admission_applications")
    .insert({
      school_id: input.schoolId,
      academic_year_id: year.id,
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
      submitted_date: new Date().toISOString().slice(0, 10),
      status: "pending",
      notes: input.notes || null,
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to submit application");

  return { applicationId: data.id, applicationNo };
}
