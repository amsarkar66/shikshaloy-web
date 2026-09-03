import { ShieldAlert } from "lucide-react";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentInstitutionIdOrThrow, getInstitutionSchools } from "@/lib/supabase/institution-context";
import ParentsClient from "./_components/ParentsClient";
import type { Parent, Child } from "./_components/ParentsClient";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins can view parent records.</p>
      </div>
    </div>
  );
}

interface ParentRow {
  id: string;
  full_name: string | null;
  occupation: string | null;
  phone: string | null;
  email: string | null;
  status: string | null;
  school_id: string;
  student_parents: {
    students: {
      id: string;
      full_name: string | null;
      roll_no: string | null;
      fee_status: string | null;
      sections: { name: string | null; grades: { level: number | null } | null } | null;
    } | null;
  }[] | null;
}

function toParent(p: ParentRow, schoolNameById?: Map<string, string>): Parent {
  const children: Child[] = (p.student_parents ?? []).flatMap((sp) => {
    const s = sp.students;
    if (!s) return [];
    return [{
      id:        s.id,
      name:      s.full_name ?? "Unknown",
      rollNo:    s.roll_no ?? "",
      class:     String(s.sections?.grades?.level ?? ""),
      section:   s.sections?.name ?? "",
      feeStatus: (s.fee_status ?? "overdue") as Child["feeStatus"],
    }];
  });

  return {
    id:         p.id,
    name:       p.full_name ?? "Unknown",
    occupation: p.occupation ?? "",
    phone:      p.phone ?? "",
    email:      p.email ?? "",
    active:     p.status !== "inactive",
    children,
    schoolId: schoolNameById ? p.school_id : undefined,
    schoolName: schoolNameById ? (schoolNameById.get(p.school_id) ?? "—") : undefined,
  };
}

const PARENT_SELECT = `
  id, full_name, occupation, phone, email, status, school_id,
  student_parents (
    students (
      id, full_name, roll_no, fee_status,
      sections ( name, grades ( level ) )
    )
  )
`;

export default async function ParentsPage() {
  const verifiedUser = await getVerifiedUser();
  if (!verifiedUser || (verifiedUser.role !== "admin" && verifiedUser.role !== "super_admin")) return <Unauthorized />;

  if (verifiedUser.role === "super_admin") {
    const institutionId = await getCurrentInstitutionIdOrThrow();
    const schools = await getInstitutionSchools(institutionId);
    const schoolIds = schools.map((s) => s.id);
    const schoolNameById = new Map(schools.map((s) => [s.id, s.name]));

    if (schoolIds.length === 0) {
      return <ParentsClient initialParents={[]} schools={schools} />;
    }

    const { data: parentRows } = await supabaseAdmin
      .from("parents")
      .select(PARENT_SELECT)
      .in("school_id", schoolIds)
      .order("full_name");

    const parents: Parent[] = ((parentRows ?? []) as unknown as ParentRow[]).map((p) => toParent(p, schoolNameById));

    return <ParentsClient initialParents={parents} schools={schools} />;
  }

  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data: parentRows } = await supabaseAdmin
    .from("parents")
    .select(PARENT_SELECT)
    .eq("school_id", schoolId)
    .order("full_name");

  const parents: Parent[] = ((parentRows ?? []) as unknown as ParentRow[]).map((p) => toParent(p));

  return <ParentsClient initialParents={parents} />;
}
