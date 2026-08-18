import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import DriversClient from "./_components/DriversClient";
import type { Driver } from "./_data/drivers";

interface ProfileRow {
  id: string;
  full_name: string | null;
  phone: string | null;
}

interface StaffRow {
  id: string;
  profile_id: string | null;
  employee_id: string | null;
  phone: string | null;
  email: string | null;
  joined_date: string | null;
  status: string | null;
}

export default async function DriversPage() {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const [{ data: profileRows }, { data: staffRows }, { data: vehicleRows }, { data: routeRows }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone")
      .eq("school_id", schoolId)
      .eq("role", "driver")
      .order("full_name"),

    supabaseAdmin
      .from("staff_members")
      .select("id, profile_id, employee_id, phone, email, joined_date, status")
      .eq("school_id", schoolId)
      .eq("designation", "Driver"),

    supabaseAdmin
      .from("vehicles")
      .select("reg_no, driver_id")
      .eq("school_id", schoolId)
      .not("driver_id", "is", null),

    supabaseAdmin
      .from("transport_routes")
      .select("route_no, driver_id")
      .eq("school_id", schoolId)
      .not("driver_id", "is", null),
  ]);

  const staffByProfile = new Map<string, StaffRow>();
  for (const s of (staffRows ?? []) as StaffRow[]) {
    if (s.profile_id) staffByProfile.set(s.profile_id, s);
  }

  const vehicleByDriver = new Map<string, string>();
  for (const v of (vehicleRows ?? []) as { reg_no: string | null; driver_id: string | null }[]) {
    if (v.driver_id) vehicleByDriver.set(v.driver_id, v.reg_no ?? "");
  }

  const routesByDriver = new Map<string, string[]>();
  for (const r of (routeRows ?? []) as { route_no: string | null; driver_id: string | null }[]) {
    if (!r.driver_id) continue;
    const list = routesByDriver.get(r.driver_id) ?? [];
    list.push(r.route_no ?? "");
    routesByDriver.set(r.driver_id, list);
  }

  const drivers: Driver[] = ((profileRows ?? []) as ProfileRow[]).map((p) => {
    const staff = staffByProfile.get(p.id);
    return {
      id: p.id,
      staffId: staff?.id ?? null,
      name: p.full_name ?? "Unnamed Driver",
      phone: staff?.phone ?? p.phone ?? "",
      email: staff?.email ?? "",
      employeeId: staff?.employee_id ?? "",
      joinedDate: staff?.joined_date ?? "",
      status: (staff?.status ?? "active") as Driver["status"],
      assignedVehicle: vehicleByDriver.get(p.id) ?? null,
      assignedRoutes: routesByDriver.get(p.id) ?? [],
    };
  });

  return <DriversClient initialDrivers={drivers} />;
}
