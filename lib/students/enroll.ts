import { supabaseAdmin } from "@/lib/supabase/service";
import { randomPassword } from "@/lib/auth/random-password";
import { pickGradeApplicable } from "@/lib/fees/resolve";
import { recomputeStudentFeeStatus } from "@/lib/fees/recompute-status";

export type AdmissionPaymentMode = "online" | "cash" | "cheque" | "upi";

export interface EnrollStudentInput {
  schoolId: string;
  fullName: string;
  dob: string | null;
  gender: "Male" | "Female" | "Other" | null;
  gradeLevel: number;
  academicYearId: string;
  sectionId?: string | null;
  sectionName?: string | null;
  rollNo?: string | null;
  admissionNo?: string | null;
  phone?: string | null;
  address?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
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
  // Admission fee collected at the enrollment desk, if any — see billOneTimeFees.
  admissionFeeCollected?: number;
  admissionFeePaymentMode?: AdmissionPaymentMode;
}

export interface ParentLogin {
  email: string;
  password: string;
  reused: boolean;
}

export interface EnrollStudentResult {
  studentId: string;
  rollNo: string;
  loginEmail: string;
  loginPassword: string;
  parentLogin: ParentLogin | null;
  admissionFeeDue: number;
  admissionFeeCollected: number;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "") || "student";
}

// Provisions a login for a student row that predates (or otherwise skipped)
// the enrollment flow above, e.g. rows inserted directly via seed data.
export async function createLoginForExistingStudent(
  studentId: string,
  schoolId: string
): Promise<{ email: string; password: string }> {
  const { data: student, error } = await supabaseAdmin
    .from("students")
    .select("id, full_name, profile_id")
    .eq("id", studentId)
    .eq("school_id", schoolId)
    .single();

  if (error || !student) throw new Error("Student not found");
  if (student.profile_id) throw new Error("This student already has a login account");

  const loginEmail = `${slugify(student.full_name)}.${Math.floor(1000 + Math.random() * 9000)}@students.shikshaloy.app`;
  const loginPassword = randomPassword();

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: loginEmail,
    password: loginPassword,
    email_confirm: true,
    user_metadata: {
      role: "student",
      full_name: student.full_name,
      school_id: schoolId,
      status: "active",
    },
  });

  if (authError || !authUser?.user) {
    throw new Error(`Failed to create student login: ${authError?.message ?? "unknown error"}`);
  }

  const { error: updateError } = await supabaseAdmin
    .from("students")
    .update({ profile_id: authUser.user.id })
    .eq("id", studentId);

  if (updateError) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    throw new Error(`Failed to link student login: ${updateError.message}`);
  }

  return { email: loginEmail, password: loginPassword };
}


async function ensureParentAccount(input: {
  schoolId: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string | null;
}): Promise<{ parentId: string; login: ParentLogin | null }> {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const HEADERS = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

  const { data: existingParent } = await supabaseAdmin
    .from("parents")
    .select("id, profile_id")
    .eq("school_id", input.schoolId)
    .eq("email", input.parentEmail)
    .maybeSingle();

  let parentId = existingParent?.id ?? null;
  let profileId = existingParent?.profile_id ?? null;
  let login: ParentLogin | null = null;

  if (!profileId) {
    const lookupRes = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(input.parentEmail)}`,
      { headers: HEADERS }
    );
    const lookupData = await lookupRes.json();
    const existingUser = lookupData?.users?.find((u: { email: string; id: string }) => u.email === input.parentEmail);

    if (existingUser) {
      profileId = existingUser.id;
    } else {
      const password = randomPassword();
      const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email: input.parentEmail,
        password,
        email_confirm: true,
        user_metadata: {
          role: "parent",
          full_name: input.parentName,
          school_id: input.schoolId,
          status: "active",
        },
      });
      if (error || !newUser?.user) {
        throw new Error(`Failed to create parent login: ${error?.message ?? "unknown error"}`);
      }
      profileId = newUser.user.id;
      login = { email: input.parentEmail, password, reused: false };
    }
  }

  if (!parentId) {
    const { data: newParent } = await supabaseAdmin
      .from("parents")
      .insert({
        school_id: input.schoolId,
        profile_id: profileId,
        full_name: input.parentName,
        phone: input.parentPhone,
        email: input.parentEmail,
        status: "active",
        joined_date: new Date().toISOString().slice(0, 10),
      })
      .select("id")
      .single();
    parentId = newParent!.id;
  } else if (!existingParent?.profile_id && profileId) {
    await supabaseAdmin.from("parents").update({ profile_id: profileId }).eq("id", parentId);
  }

  return { parentId, login };
}

async function findGrade(schoolId: string, gradeLevel: number) {
  const { data: grade } = await supabaseAdmin
    .from("grades")
    .select("id")
    .eq("school_id", schoolId)
    .eq("level", gradeLevel)
    .maybeSingle();

  if (!grade) throw new Error(`No grade found for level ${gradeLevel}`);
  return grade;
}

async function pickSection(schoolId: string, gradeLevel: number, academicYearId: string, sectionName?: string | null) {
  const grade = await findGrade(schoolId, gradeLevel);

  const { data: sections } = await supabaseAdmin
    .from("sections")
    .select("id, name, grade_id, students ( id )")
    .eq("school_id", schoolId)
    .eq("grade_id", grade.id)
    .eq("academic_year_id", academicYearId)
    .order("name");

  if (!sections || sections.length === 0) throw new Error(`No sections found for grade ${gradeLevel}`);

  if (sectionName) {
    const match = sections.find((s) => s.name.toLowerCase() === sectionName.toLowerCase());
    if (match) return match as { id: string; name: string; grade_id: string };
  }

  const bySize = [...sections].sort(
    (a, b) => (a.students?.length ?? 0) - (b.students?.length ?? 0)
  );
  return bySize[0] as { id: string; name: string; grade_id: string };
}

// Bills any one-time fee categories (admission fee, security deposit, ...)
// configured for this student's grade — once, at enrollment. A grade-specific
// structure takes priority over an "all grades" one for the same category so
// admins can set a different admission fee per class without double-billing.
// If the desk collected a payment on the spot, it's allocated across these
// rows in order (same fill-the-balance approach as recordFeePayment) so the
// fee_payments row lands paid/partial/overdue instead of always overdue.
// Best-effort: a missing/misconfigured fee structure never blocks enrollment,
// matching how student_academic_history above is also fire-and-forget.
async function billOneTimeFees(
  schoolId: string, academicYearId: string, gradeId: string, studentId: string,
  collected?: { amount: number; paymentMode: AdmissionPaymentMode },
): Promise<{ totalDue: number }> {
  const { data: structures } = await supabaseAdmin
    .from("fee_structures")
    .select("category, amount, grade_id")
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId)
    .eq("is_one_time", true)
    .or(`grade_id.eq.${gradeId},grade_id.is.null`);

  if (!structures || structures.length === 0) return { totalDue: 0 };

  const applicable = pickGradeApplicable(structures, gradeId);
  const totalDue = applicable.reduce((s, r) => s + Number(r.amount), 0);

  const monthStr = new Date().toISOString().slice(0, 7);
  const paidDate = new Date().toISOString().slice(0, 10);
  const receiptNo = collected && collected.amount > 0
    ? `RCP-${monthStr.replace("-", "")}-${Math.floor(Math.random() * 9000) + 1000}`
    : null;

  let remaining = collected?.amount ?? 0;
  const rows = applicable.map((s) => {
    const due = Number(s.amount);
    const paid = Math.min(due, Math.max(remaining, 0));
    remaining -= paid;
    const status: "paid" | "partial" | "overdue" = paid >= due ? "paid" : paid > 0 ? "partial" : "overdue";
    return {
      school_id: schoolId,
      student_id: studentId,
      academic_year_id: academicYearId,
      month_str: monthStr,
      category: s.category,
      amount_due: due,
      amount_paid: paid,
      status,
      paid_date: paid > 0 ? paidDate : null,
      payment_mode: paid > 0 ? collected!.paymentMode : null,
      receipt_no: paid > 0 ? receiptNo : null,
    };
  });

  await supabaseAdmin.from("fee_payments").insert(rows);
  await recomputeStudentFeeStatus(studentId);
  return { totalDue };
}

export async function enrollStudent(input: EnrollStudentInput): Promise<EnrollStudentResult> {
  const section = input.sectionId
    ? (await supabaseAdmin.from("sections").select("id, name, grade_id").eq("id", input.sectionId).single()).data
    : await pickSection(input.schoolId, input.gradeLevel, input.academicYearId, input.sectionName);

  if (!section) throw new Error("Could not resolve a section for this student");

  let rollNo = input.rollNo;
  if (!rollNo) {
    const { count: existingCount } = await supabaseAdmin
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("section_id", section.id);

    const seq = String((existingCount ?? 0) + 1).padStart(2, "0");
    rollNo = `${input.gradeLevel}${section.name}${seq}`;
  }

  const loginEmail = `${slugify(input.fullName)}.${Math.floor(1000 + Math.random() * 9000)}@students.shikshaloy.app`;
  const loginPassword = randomPassword();

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: loginEmail,
    password: loginPassword,
    email_confirm: true,
    user_metadata: {
      role: "student",
      full_name: input.fullName,
      school_id: input.schoolId,
      status: "active",
    },
  });

  if (authError || !authUser?.user) {
    throw new Error(`Failed to create student login: ${authError?.message ?? "unknown error"}`);
  }

  const { data: studentRow, error: studentError } = await supabaseAdmin
    .from("students")
    .insert({
      school_id: input.schoolId,
      profile_id: authUser.user.id,
      roll_no: rollNo,
      admission_no: input.admissionNo ?? null,
      section_id: section.id,
      academic_year_id: input.academicYearId,
      full_name: input.fullName,
      dob: input.dob,
      gender: input.gender,
      address: input.address ?? null,
      phone: input.phone ?? null,
      photo_url: input.photoUrl ?? null,
      blood_group: input.bloodGroup ?? null,
      category: input.category ?? null,
      religion: input.religion ?? null,
      caste: input.caste ?? null,
      mother_tongue: input.motherTongue ?? null,
      language: input.language ?? null,
      emergency_contact_name: input.emergencyContactName ?? null,
      emergency_contact_phone: input.emergencyContactPhone ?? null,
      emergency_contact_relation: input.emergencyContactRelation ?? null,
      medical_conditions: input.medicalConditions ?? null,
      allergies: input.allergies ?? null,
      attendance_pct: 0,
      fee_status: "overdue",
      status: "active",
      joined_date: new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();

  if (studentError || !studentRow) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    throw new Error(`Failed to create student record: ${studentError?.message ?? "unknown error"}`);
  }

  await supabaseAdmin.from("student_academic_history").insert({
    school_id: input.schoolId,
    student_id: studentRow.id,
    academic_year_id: input.academicYearId,
    section_id: section.id,
    roll_no: rollNo,
    outcome: "enrolled",
  });

  const { totalDue: admissionFeeDue } = await billOneTimeFees(
    input.schoolId, input.academicYearId, section.grade_id, studentRow.id,
    input.admissionFeeCollected && input.admissionFeeCollected > 0
      ? { amount: input.admissionFeeCollected, paymentMode: input.admissionFeePaymentMode ?? "cash" }
      : undefined,
  );

  let parentLogin: ParentLogin | null = null;

  if (input.parentName) {
    let parentId: string | null = null;

    if (input.parentEmail) {
      const result = await ensureParentAccount({
        schoolId: input.schoolId,
        parentName: input.parentName,
        parentEmail: input.parentEmail,
        parentPhone: input.parentPhone ?? null,
      });
      parentId = result.parentId;
      parentLogin = result.login;
    } else {
      const { data: newParent } = await supabaseAdmin
        .from("parents")
        .insert({
          school_id: input.schoolId,
          full_name: input.parentName,
          phone: input.parentPhone ?? null,
          email: null,
          status: "active",
          joined_date: new Date().toISOString().slice(0, 10),
        })
        .select("id")
        .single();
      parentId = newParent?.id ?? null;
    }

    if (parentId) {
      await supabaseAdmin.from("student_parents").insert({
        student_id: studentRow.id,
        parent_id: parentId,
        relationship: "parent",
        is_primary: true,
      });
    }
  }

  return {
    studentId: studentRow.id,
    rollNo,
    loginEmail,
    loginPassword,
    parentLogin,
    admissionFeeDue,
    admissionFeeCollected: input.admissionFeeCollected ?? 0,
  };
}
