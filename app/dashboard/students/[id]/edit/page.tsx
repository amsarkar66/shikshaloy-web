import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getVerifiedRole } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { EditStudentForm, type EditableStudent } from "../../_components/edit-student-form";
import type { SectionOption } from "../../_components/add-student-modal";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins can edit student records.</p>
      </div>
    </div>
  );
}

interface EditStudentRow {
  id: string;
  full_name: string;
  roll_no: string | null;
  admission_no: string | null;
  dob: string | null;
  gender: string | null;
  address: string | null;
  phone: string | null;
  photo_url: string | null;
  status: string | null;
  section_id: string | null;
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
  student_parents: {
    is_primary: boolean | null;
    parents: { id: string; full_name: string | null; phone: string | null; email: string | null } | null;
  }[] | null;
}

interface EditSectionRow {
  id: string;
  name: string | null;
  grades: { level: number | null } | null;
}

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const role = await getVerifiedRole();
  if (role !== "admin") return <Unauthorized />;

  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const [{ data: studentRow }, { data: sectionRows }] = await Promise.all([
    supabaseAdmin
      .from("students")
      .select(`
        id, full_name, roll_no, admission_no, dob, gender, address, phone, photo_url, status, section_id,
        blood_group, category, religion, caste, mother_tongue, language,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
        medical_conditions, allergies,
        student_parents ( is_primary, parents ( id, full_name, phone, email ) )
      `)
      .eq("school_id", schoolId)
      .eq("id", id)
      .maybeSingle(),

    supabaseAdmin
      .from("sections")
      .select("id, name, grades ( level )")
      .eq("school_id", schoolId)
      .eq("academic_year_id", academicYearId)
      .order("name"),
  ]);

  if (!studentRow) notFound();

  const s = studentRow as unknown as EditStudentRow;
  const parentLinks = s.student_parents ?? [];
  const primaryLink = parentLinks.find((sp) => sp.is_primary) ?? parentLinks[0] ?? null;
  const parent = primaryLink?.parents ?? null;

  const sections: SectionOption[] = ((sectionRows ?? []) as unknown as EditSectionRow[])
    .map((sec) => ({ id: sec.id, name: sec.name ?? "", gradeLevel: sec.grades?.level ?? 0 }))
    .sort((a: SectionOption, b: SectionOption) => a.gradeLevel - b.gradeLevel || a.name.localeCompare(b.name));

  const student: EditableStudent = {
    id: s.id,
    fullName: s.full_name,
    rollNo: s.roll_no ?? "",
    admissionNo: s.admission_no ?? "",
    dob: s.dob ?? "",
    gender: (s.gender as EditableStudent["gender"]) ?? "Male",
    address: s.address ?? "",
    phone: s.phone ?? "",
    photoUrl: s.photo_url ?? null,
    active: s.status === "active",
    sectionId: s.section_id ?? sections[0]?.id ?? "",
    parentId: parent?.id ?? null,
    parentName: parent?.full_name ?? "",
    parentPhone: parent?.phone ?? "",
    parentEmail: parent?.email ?? "",
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
  };

  return <EditStudentForm student={student} sections={sections} />;
}
