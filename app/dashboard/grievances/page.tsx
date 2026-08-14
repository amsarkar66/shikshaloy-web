import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import GrievancesClient from "./_components/GrievancesClient";
import type { Grievance } from "./_components/GrievancesClient";

export default async function GrievancesPage() {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data } = await supabaseAdmin
    .from("grievances")
    .select("id, name, email, phone, category, subject, message, status, resolution_notes, created_at")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  const grievances: Grievance[] = (data ?? []).map((g) => ({
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
  }));

  return <GrievancesClient initialData={grievances} />;
}
