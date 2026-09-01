import { notFound, redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import SchoolDetailClient, {
  type SchoolDetail, type SchoolActivity,
} from "./_components/SchoolDetailClient";

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs > 1 ? "s" : ""} ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function SchoolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const verifiedUser = await getVerifiedUser();
  if (!verifiedUser) redirect("/login");

  if (verifiedUser.role !== "super_admin") redirect("/dashboard");

  const institutionId = await getCurrentInstitutionIdOrThrow();

  const { data: row } = await supabaseAdmin
    .from("schools")
    .select(`
      id, name, short_name, institution_type, board, grades_from, grades_to,
      established_year, status, address, city, state, country, pin_code,
      phone, email, website, logo_url,
      principal_name, principal_email, principal_phone, principal_designation,
      institution_id, created_at
    `)
    .eq("id", id)
    .maybeSingle();

  if (!row || row.institution_id !== institutionId) notFound();

  const [
    { data: studentRows },
    { data: staffRows },
    { data: adminRows },
    { data: feeRows },
    { data: auditRows },
  ] = await Promise.all([
    supabaseAdmin.from("students").select("attendance_pct").eq("school_id", id),
    supabaseAdmin.from("staff_members").select("type").eq("school_id", id).neq("status", "inactive"),
    supabaseAdmin.from("profiles").select("id").eq("school_id", id).eq("role", "admin"),
    supabaseAdmin.from("fee_payments").select("month_str, amount_due, amount_paid").eq("school_id", id),
    supabaseAdmin.from("audit_log").select("action, module, description, actor_name, created_at")
      .eq("school_id", id).order("created_at", { ascending: false }).limit(6),
  ]);

  const students = studentRows ?? [];
  const staff = (staffRows ?? []) as { type: string | null }[];
  const teachingStaff = staff.filter((s) => s.type === "teaching").length;
  const nonTeachingStaff = staff.length - teachingStaff;

  const avgAttendance = students.length
    ? Math.round(students.reduce((s, x) => s + Number(x.attendance_pct ?? 0), 0) / students.length)
    : 0;

  const feeRowsTyped = (feeRows ?? []) as { month_str: string; amount_due: number | null; amount_paid: number | null }[];
  const months = Array.from(new Set(feeRowsTyped.map((f) => f.month_str))).sort();
  const latestMonth = months[months.length - 1];
  const latest = feeRowsTyped.filter((f) => f.month_str === latestMonth);
  const dueTotal = latest.reduce((s, f) => s + Number(f.amount_due ?? 0), 0);
  const paidTotal = latest.reduce((s, f) => s + Number(f.amount_paid ?? 0), 0);
  const feePct = dueTotal > 0 ? Math.round((paidTotal / dueTotal) * 100) : 0;

  const school: SchoolDetail = {
    id: row.id,
    name: row.name ?? "",
    shortName: row.short_name,
    institutionType: row.institution_type ?? "School",
    board: row.board,
    gradesFrom: row.grades_from,
    gradesTo: row.grades_to,
    establishedYear: row.established_year,
    status: (row.status ?? "active") as SchoolDetail["status"],
    address: row.address,
    city: row.city ?? "—",
    state: row.state ?? "—",
    country: row.country ?? "—",
    pinCode: row.pin_code,
    phone: row.phone,
    email: row.email,
    website: row.website,
    logoUrl: row.logo_url,
    principalName: row.principal_name,
    principalEmail: row.principal_email,
    principalPhone: row.principal_phone,
    principalDesignation: row.principal_designation,
    createdAt: row.created_at,
    students: students.length,
    teachingStaff,
    nonTeachingStaff,
    admins: (adminRows ?? []).length,
    attendancePct: avgAttendance,
    feePct,
    monthlyRevenue: paidTotal,
  };

  const activity: SchoolActivity[] = (auditRows ?? []).map((a) => ({
    action: a.action,
    module: a.module,
    description: a.description ?? "",
    actorName: a.actor_name ?? "—",
    time: formatRelativeTime(a.created_at),
  }));

  return <SchoolDetailClient school={school} activity={activity} />;
}
