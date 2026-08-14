import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import SupportClient, { type PlatformGrievance } from "./_components/SupportClient";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const role = user.user_metadata?.role as string | undefined;
  if (role !== "kernel") redirect("/dashboard");

  const [{ data }, { data: schools }] = await Promise.all([
    supabaseAdmin
      .from("grievances")
      .select("id, school_id, name, email, phone, category, subject, message, status, resolution_notes, created_at")
      .order("created_at", { ascending: false }),
    supabaseAdmin.from("schools").select("id, name"),
  ]);

  const schoolsById = new Map((schools ?? []).map((s) => [s.id, s.name]));

  const grievances: PlatformGrievance[] = (data ?? []).map((g) => ({
    id: g.id,
    schoolName: schoolsById.get(g.school_id) ?? "—",
    name: g.name,
    email: g.email,
    phone: g.phone,
    category: g.category ?? "other",
    subject: g.subject,
    message: g.message,
    status: (g.status ?? "open") as PlatformGrievance["status"],
    resolutionNotes: g.resolution_notes,
    createdAt: g.created_at,
  }));

  return <SupportClient initialData={grievances} />;
}
