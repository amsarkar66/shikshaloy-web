import { ShieldAlert } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentInstitutionIdOrThrow, getInstitutionSchools } from "@/lib/supabase/institution-context";
import { getVerifiedUser, requireRoleOrStaffTemplate } from "@/lib/auth/verified-role";
import AdmissionsClient from "./_components/AdmissionsClient";
import type { Application } from "./_components/AdmissionsClient";
import { parseAddress } from "@/lib/students/address";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins, institution owners, and front-desk staff can view admissions.</p>
      </div>
    </div>
  );
}

interface AdmissionApplicationRow {
  id: string; application_no: string | null; applicant_name: string | null; dob: string | null;
  gender: string | null; applying_for_grade: number | null; parent_name: string | null;
  parent_phone: string | null; parent_email: string | null; previous_school: string | null;
  submitted_date: string | null; status: string | null; notes: string | null; academic_year_id: string | null;
  present_address: unknown; permanent_address: unknown; blood_group: string | null; category: string | null; nationality: string | null;
  father_name: string | null; father_occupation: string | null; father_phone: string | null; father_email: string | null;
  mother_name: string | null; mother_occupation: string | null; mother_phone: string | null; mother_email: string | null;
  guardian_name: string | null; guardian_relation: string | null; guardian_phone: string | null;
  sibling_studying: boolean | null; sibling_name: string | null;
  emergency_contact_name: string | null; emergency_contact_phone: string | null;
  photo_url: string | null;
  school_id: string;
  academic_years: { name: string | null } | null;
}

const ADMISSION_SELECT = `
  id, application_no, applicant_name, dob, gender, applying_for_grade,
  parent_name, parent_phone, parent_email, previous_school, submitted_date,
  status, notes, academic_year_id,
  present_address, permanent_address, blood_group, category, nationality,
  father_name, father_occupation, father_phone, father_email,
  mother_name, mother_occupation, mother_phone, mother_email,
  guardian_name, guardian_relation, guardian_phone,
  sibling_studying, sibling_name,
  emergency_contact_name, emergency_contact_phone,
  photo_url, school_id,
  academic_years ( name )
`;

function toApplication(a: AdmissionApplicationRow, schoolNameById?: Map<string, string>): Application {
  return {
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
    status:           (a.status ?? "pending") as Application["status"],
    academicYear:     a.academic_years?.name ?? "",
    academicYearId:   a.academic_year_id ?? "",
    notes:            a.notes ?? undefined,

    presentAddress:        parseAddress(a.present_address),
    permanentAddress:      parseAddress(a.permanent_address),
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
    schoolId: schoolNameById ? a.school_id : undefined,
    schoolName: schoolNameById ? (schoolNameById.get(a.school_id) ?? "—") : undefined,
  };
}

export default async function AdmissionsPage() {
  try {
    await requireRoleOrStaffTemplate(["admin", "super_admin"], ["receptionist"]);
  } catch {
    return <Unauthorized />;
  }

  const verifiedUser = await getVerifiedUser();

  if (verifiedUser?.role === "super_admin") {
    const institutionId = await getCurrentInstitutionIdOrThrow();
    const schools = await getInstitutionSchools(institutionId);
    const schoolIds = schools.map((s) => s.id);
    const schoolNameById = new Map(schools.map((s) => [s.id, s.name]));

    if (schoolIds.length === 0) {
      return <AdmissionsClient initialApps={[]} schools={schools} />;
    }

    const { data } = await supabaseAdmin
      .from("admission_applications")
      .select(ADMISSION_SELECT)
      .in("school_id", schoolIds)
      .order("submitted_date", { ascending: false });

    const apps: Application[] = ((data ?? []) as unknown as AdmissionApplicationRow[]).map((a) => toApplication(a, schoolNameById));

    return <AdmissionsClient initialApps={apps} schools={schools} />;
  }

  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data } = await supabaseAdmin
    .from("admission_applications")
    .select(ADMISSION_SELECT)
    .eq("school_id", schoolId)
    .order("submitted_date", { ascending: false });

  const apps: Application[] = ((data ?? []) as unknown as AdmissionApplicationRow[]).map((a) => toApplication(a));

  return <AdmissionsClient initialApps={apps} />;
}
