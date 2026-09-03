import { ShieldAlert } from "lucide-react";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentInstitutionIdOrThrow, getInstitutionSchools } from "@/lib/supabase/institution-context";
import GrievancesClient from "./_components/GrievancesClient";
import type { Grievance } from "./_components/GrievancesClient";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins can view grievances.</p>
      </div>
    </div>
  );
}

interface GrievanceRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  category: string | null;
  subject: string;
  message: string;
  status: string | null;
  resolution_notes: string | null;
  created_at: string;
  school_id: string;
}

function toGrievance(g: GrievanceRow, schoolNameById?: Map<string, string>): Grievance {
  return {
    id: g.id,
    name: g.name,
    email: g.email,
    phone: g.phone,
    category: g.category ?? "other",
    subject: g.subject,
    message: g.message,
    status: (g.status ?? "open") as Grievance["status"],
    resolutionNotes: g.resolution_notes,
    createdAt: g.created_at,
    schoolId: schoolNameById ? g.school_id : undefined,
    schoolName: schoolNameById ? (schoolNameById.get(g.school_id) ?? "—") : undefined,
  };
}

const GRIEVANCE_SELECT = "id, name, email, phone, category, subject, message, status, resolution_notes, created_at, school_id";

export default async function GrievancesPage() {
  const vu = await getVerifiedUser();
  if (!vu || (vu.role !== "admin" && vu.role !== "super_admin" && vu.role !== "kernel")) return <Unauthorized />;

  if (vu.role === "super_admin") {
    const institutionId = await getCurrentInstitutionIdOrThrow();
    const schools = await getInstitutionSchools(institutionId);
    const schoolIds = schools.map((s) => s.id);
    const schoolNameById = new Map(schools.map((s) => [s.id, s.name]));

    if (schoolIds.length === 0) {
      return <GrievancesClient initialData={[]} schools={schools} />;
    }

    const { data } = await supabaseAdmin
      .from("grievances")
      .select(GRIEVANCE_SELECT)
      .in("school_id", schoolIds)
      .order("created_at", { ascending: false });

    const grievances: Grievance[] = ((data ?? []) as GrievanceRow[]).map((g) => toGrievance(g, schoolNameById));

    return <GrievancesClient initialData={grievances} schools={schools} />;
  }

  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data } = await supabaseAdmin
    .from("grievances")
    .select(GRIEVANCE_SELECT)
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  const grievances: Grievance[] = ((data ?? []) as GrievanceRow[]).map((g) => toGrievance(g));

  return <GrievancesClient initialData={grievances} />;
}
