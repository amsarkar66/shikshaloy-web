import { supabaseAdmin } from "@/lib/supabase/service";

export interface DriverVehicle {
  id: string;
  regNo: string;
  model: string;
  capacity: number;
  year: number | null;
  fuelType: string;
  status: string;
  lastService: string | null;
  nextService: string | null;
}

export interface DriverRosterStudent {
  id: string;
  fullName: string;
  rollNo: string;
  classNum: string;
  section: string;
  phone: string;
  stopName: string;
  feeStatus: string;
}

export interface DriverRoute {
  id: string;
  routeNo: string;
  routeName: string;
  stops: string[];
  status: string;
  capacity: number;
  morningDeparture: string | null;
  eveningDeparture: string | null;
  vehicle: DriverVehicle | null;
  roster: DriverRosterStudent[];
}

export interface DriverContext {
  id: string;
  staffId: string;
  schoolId: string;
  fullName: string;
  phone: string;
  designation: string;
  routes: DriverRoute[];
}

interface RouteRow {
  id: string;
  route_no: string | null;
  route_name: string | null;
  stops: unknown;
  status: string | null;
  capacity: number | null;
  morning_departure: string | null;
  evening_departure: string | null;
  vehicles: {
    id: string;
    reg_no: string | null;
    model: string | null;
    capacity: number | null;
    year: number | null;
    fuel_type: string | null;
    status: string | null;
    last_service: string | null;
    next_service: string | null;
  } | null;
}

interface RosterRow {
  route_id: string;
  stop_name: string | null;
  fee_status: string | null;
  students: {
    id: string;
    full_name: string | null;
    roll_no: string | null;
    phone: string | null;
    sections: { name: string | null; grades: { level: number | null } | null } | null;
  } | null;
}

export async function getDriverContext(profileId: string): Promise<DriverContext | null> {
  const { data: staff } = await supabaseAdmin
    .from("staff_members")
    .select("id, school_id, full_name, phone, designation")
    .eq("profile_id", profileId)
    .maybeSingle();

  if (!staff) return null;

  const { data: routeRows } = await supabaseAdmin
    .from("transport_routes")
    .select(`
      id, route_no, route_name, stops, status, capacity, morning_departure, evening_departure,
      vehicles ( id, reg_no, model, capacity, year, fuel_type, status, last_service, next_service )
    `)
    .eq("driver_id", profileId)
    .order("route_no");

  const routes = (routeRows ?? []) as unknown as RouteRow[];
  const routeIds = routes.map((r) => r.id);

  const { data: rosterRows } = routeIds.length
    ? await supabaseAdmin
        .from("student_transport")
        .select(`
          route_id, stop_name, fee_status,
          students ( id, full_name, roll_no, phone, sections ( name, grades ( level ) ) )
        `)
        .in("route_id", routeIds)
    : { data: [] as RosterRow[] };

  const rosterByRoute: Record<string, DriverRosterStudent[]> = {};
  for (const r of (rosterRows ?? []) as unknown as RosterRow[]) {
    if (!r.students) continue;
    if (!rosterByRoute[r.route_id]) rosterByRoute[r.route_id] = [];
    rosterByRoute[r.route_id].push({
      id: r.students.id,
      fullName: r.students.full_name ?? "Unknown",
      rollNo: r.students.roll_no ?? "",
      classNum: String(r.students.sections?.grades?.level ?? "?"),
      section: r.students.sections?.name ?? "",
      phone: r.students.phone ?? "—",
      stopName: r.stop_name ?? "",
      feeStatus: r.fee_status ?? "overdue",
    });
  }

  return {
    id: profileId,
    staffId: staff.id,
    schoolId: staff.school_id,
    fullName: staff.full_name,
    phone: staff.phone ?? "",
    designation: staff.designation ?? "Driver",
    routes: routes.map((r) => ({
      id: r.id,
      routeNo: r.route_no ?? "",
      routeName: r.route_name ?? "",
      stops: Array.isArray(r.stops) ? (r.stops as string[]) : [],
      status: r.status ?? "active",
      capacity: r.capacity ?? 0,
      morningDeparture: r.morning_departure,
      eveningDeparture: r.evening_departure,
      vehicle: r.vehicles
        ? {
            id: r.vehicles.id,
            regNo: r.vehicles.reg_no ?? "",
            model: r.vehicles.model ?? "",
            capacity: r.vehicles.capacity ?? 0,
            year: r.vehicles.year,
            fuelType: r.vehicles.fuel_type ?? "diesel",
            status: r.vehicles.status ?? "active",
            lastService: r.vehicles.last_service,
            nextService: r.vehicles.next_service,
          }
        : null,
      roster: (rosterByRoute[r.id] ?? []).sort((a, b) =>
        a.stopName.localeCompare(b.stopName) || a.fullName.localeCompare(b.fullName)
      ),
    })),
  };
}
