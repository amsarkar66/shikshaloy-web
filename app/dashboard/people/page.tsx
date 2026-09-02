import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import PeopleClient, {
  type SchoolOption, type StudentRow, type StaffRow, type ParentRow, type AdminRow,
} from "./_components/PeopleClient";

export const dynamic = "force-dynamic";

interface StudentQueryRow {
  id: string;
  full_name: string;
  roll_no: string | null;
  gender: string | null;
  phone: string | null;
  status: string | null;
  school_id: string;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
}

interface StaffQueryRow {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  type: string | null;
  designation: string | null;
  department: string | null;
  status: string | null;
  school_id: string;
}

interface ParentQueryRow {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  status: string | null;
  school_id: string;
}

interface AdminQueryRow {
  id: string;
  full_name: string | null;
  phone: string | null;
  status: string | null;
  school_id: string | null;
  created_at: string;
}

export default async function PeoplePage() {
  const verifiedUser = await getVerifiedUser();
  if (!verifiedUser) redirect("/login");
  if (verifiedUser.role !== "super_admin") redirect("/dashboard");

  const institutionId = await getCurrentInstitutionIdOrThrow();

  const { data: schoolRows } = await supabaseAdmin
    .from("schools")
    .select("id, name")
    .eq("institution_id", institutionId)
    .order("name");

  const schools: SchoolOption[] = (schoolRows ?? []).map((s) => ({ id: s.id, name: s.name ?? "" }));
  const schoolIds = schools.map((s) => s.id);
  const schoolNameById = new Map(schools.map((s) => [s.id, s.name]));

  if (schoolIds.length === 0) {
    return <PeopleClient schools={schools} students={[]} staff={[]} parents={[]} admins={[]} />;
  }

  const [{ data: studentRows }, { data: staffRows }, { data: parentRows }, { data: adminRows }] = await Promise.all([
    supabaseAdmin
      .from("students")
      .select("id, full_name, roll_no, gender, phone, status, school_id, sections ( name, grades ( level ) )")
      .in("school_id", schoolIds)
      .order("full_name"),
    supabaseAdmin
      .from("staff_members")
      .select("id, full_name, phone, email, type, designation, department, status, school_id")
      .in("school_id", schoolIds)
      .order("full_name"),
    supabaseAdmin
      .from("parents")
      .select("id, full_name, phone, email, status, school_id")
      .in("school_id", schoolIds)
      .order("full_name"),
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone, status, school_id, created_at")
      .in("school_id", schoolIds)
      .eq("role", "admin")
      .order("created_at", { ascending: false }),
  ]);

  const students: StudentRow[] = ((studentRows ?? []) as unknown as StudentQueryRow[]).map((s) => ({
    id: s.id,
    name: s.full_name,
    rollNo: s.roll_no ?? "—",
    class: s.sections?.grades?.level ? `Class ${s.sections.grades.level}${s.sections?.name ? `-${s.sections.name}` : ""}` : "—",
    gender: s.gender,
    phone: s.phone ?? "—",
    status: (s.status ?? "active") as StudentRow["status"],
    schoolId: s.school_id,
    schoolName: schoolNameById.get(s.school_id) ?? "—",
  }));

  const staff: StaffRow[] = ((staffRows ?? []) as unknown as StaffQueryRow[]).map((s) => ({
    id: s.id,
    name: s.full_name,
    phone: s.phone ?? "—",
    email: s.email ?? "—",
    type: (s.type ?? "teaching") as StaffRow["type"],
    designation: s.designation ?? "—",
    department: s.department ?? "—",
    status: (s.status ?? "active") as StaffRow["status"],
    schoolId: s.school_id,
    schoolName: schoolNameById.get(s.school_id) ?? "—",
  }));

  const parents: ParentRow[] = ((parentRows ?? []) as unknown as ParentQueryRow[]).map((p) => ({
    id: p.id,
    name: p.full_name,
    phone: p.phone ?? "—",
    email: p.email ?? "—",
    status: (p.status ?? "active") as ParentRow["status"],
    schoolId: p.school_id,
    schoolName: schoolNameById.get(p.school_id) ?? "—",
  }));

  const admins: AdminRow[] = await Promise.all(
    ((adminRows ?? []) as unknown as AdminQueryRow[]).map(async (a) => {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(a.id);
      return {
        id: a.id,
        name: a.full_name ?? "—",
        email: authUser?.user?.email ?? "—",
        phone: a.phone ?? "—",
        status: (a.status ?? "active") as AdminRow["status"],
        joinedDate: a.created_at,
        schoolId: a.school_id ?? "",
        schoolName: a.school_id ? (schoolNameById.get(a.school_id) ?? "—") : "—",
      };
    })
  );

  return <PeopleClient schools={schools} students={students} staff={staff} parents={parents} admins={admins} />;
}
