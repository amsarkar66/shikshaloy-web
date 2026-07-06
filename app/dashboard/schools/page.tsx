import { supabaseAdmin } from "@/lib/supabase/service";
import SchoolsClient from "./_components/SchoolsClient";
import type { School } from "./_data/schools";

export default async function SchoolsPage() {
  const { data: schoolRows } = await supabaseAdmin
    .from("schools")
    .select("id, name, institution_type, city, state, country, phone, website, address, status, principal_name, principal_email, established_year")
    .order("name");

  const schoolIds = (schoolRows ?? []).map((s: any) => s.id);

  const [
    { data: studentRows },
    { data: staffRows },
    { data: adminRows },
    { data: feeRows },
  ] = await Promise.all([
    schoolIds.length
      ? supabaseAdmin.from("students").select("school_id, attendance_pct").in("school_id", schoolIds)
      : Promise.resolve({ data: [] as any[] }),
    schoolIds.length
      ? supabaseAdmin.from("staff_members").select("school_id").in("school_id", schoolIds).neq("status", "inactive")
      : Promise.resolve({ data: [] as any[] }),
    schoolIds.length
      ? supabaseAdmin.from("profiles").select("school_id").in("school_id", schoolIds).eq("role", "admin")
      : Promise.resolve({ data: [] as any[] }),
    schoolIds.length
      ? supabaseAdmin.from("fee_payments").select("school_id, month_str, amount_due, amount_paid").in("school_id", schoolIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const studentsBySchool: Record<string, { count: number; attendanceSum: number }> = {};
  for (const s of (studentRows ?? []) as any[]) {
    const entry = studentsBySchool[s.school_id] ?? { count: 0, attendanceSum: 0 };
    entry.count += 1;
    entry.attendanceSum += Number(s.attendance_pct ?? 0);
    studentsBySchool[s.school_id] = entry;
  }

  const staffBySchool: Record<string, number> = {};
  for (const s of (staffRows ?? []) as any[]) {
    staffBySchool[s.school_id] = (staffBySchool[s.school_id] ?? 0) + 1;
  }

  const adminsBySchool: Record<string, number> = {};
  for (const a of (adminRows ?? []) as any[]) {
    adminsBySchool[a.school_id] = (adminsBySchool[a.school_id] ?? 0) + 1;
  }

  const latestMonthBySchool: Record<string, string> = {};
  for (const f of (feeRows ?? []) as any[]) {
    if (!latestMonthBySchool[f.school_id] || f.month_str > latestMonthBySchool[f.school_id]) {
      latestMonthBySchool[f.school_id] = f.month_str;
    }
  }
  const feeAggBySchool: Record<string, { due: number; paid: number }> = {};
  for (const f of (feeRows ?? []) as any[]) {
    if (f.month_str !== latestMonthBySchool[f.school_id]) continue;
    const entry = feeAggBySchool[f.school_id] ?? { due: 0, paid: 0 };
    entry.due += Number(f.amount_due ?? 0);
    entry.paid += Number(f.amount_paid ?? 0);
    feeAggBySchool[f.school_id] = entry;
  }

  const schools: School[] = (schoolRows ?? []).map((s: any) => {
    const studentStats = studentsBySchool[s.id] ?? { count: 0, attendanceSum: 0 };
    const fee = feeAggBySchool[s.id] ?? { due: 0, paid: 0 };
    return {
      id: s.id,
      name: s.name ?? "",
      institutionType: s.institution_type ?? "—",
      city: s.city ?? "—",
      state: s.state ?? "—",
      country: s.country ?? "—",
      phone: s.phone ?? "—",
      website: s.website,
      address: s.address,
      status: s.status ?? "active",
      principalName: s.principal_name,
      principalEmail: s.principal_email,
      establishedYear: s.established_year,
      students: studentStats.count,
      staff: staffBySchool[s.id] ?? 0,
      admins: adminsBySchool[s.id] ?? 0,
      attendancePct: studentStats.count ? Math.round(studentStats.attendanceSum / studentStats.count) : 0,
      feePct: fee.due ? Math.round((fee.paid / fee.due) * 100) : 0,
      monthlyRevenue: fee.paid,
    };
  });

  return <SchoolsClient schools={schools} />;
}
