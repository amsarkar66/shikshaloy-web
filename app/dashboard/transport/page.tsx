import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import TransportClient from "./_components/TransportClient";
import type { Route, Vehicle, StudentTransport } from "./_data/transport";

interface TransportRouteRow {
  id: string;
  route_no: string | null;
  route_name: string | null;
  driver_id: string | null;
  driver_phone: string | null;
  stops: unknown;
  capacity: number | null;
  status: string | null;
  morning_departure: string | null;
  evening_departure: string | null;
}

interface TransportVehicleRow {
  id: string;
  reg_no: string | null;
  model: string | null;
  capacity: number | null;
  year: number | null;
  status: string | null;
  driver_id: string | null;
  fuel_type: string | null;
  last_service: string | null;
  next_service: string | null;
}

interface StudentTransportRow {
  id: string;
  stop_name: string | null;
  monthly_fee: number | null;
  fee_status: string | null;
  students: {
    full_name: string | null;
    roll_no: string | null;
    phone: string | null;
    sections: { name: string | null; grades: { level: number | null } | null } | null;
  } | null;
  transport_routes: { route_no: string | null; route_name: string | null } | null;
}

export default async function TransportPage() {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const [{ data: routeRows }, { data: vehicleRows }, { data: studentRows }] = await Promise.all([
    supabaseAdmin
      .from("transport_routes")
      .select("id, route_no, route_name, driver_id, driver_phone, stops, capacity, status, morning_departure, evening_departure")
      .eq("school_id", schoolId)
      .order("route_no"),

    supabaseAdmin
      .from("vehicles")
      .select("id, reg_no, model, capacity, year, status, driver_id, fuel_type, last_service, next_service")
      .eq("school_id", schoolId)
      .order("reg_no"),

    supabaseAdmin
      .from("student_transport")
      .select(`
        id, stop_name, monthly_fee, fee_status,
        students ( full_name, roll_no, phone, sections ( name, grades ( level ) ) ),
        transport_routes ( route_no, route_name )
      `)
      .eq("school_id", schoolId),
  ]);

  const studentCountByRoute: Record<string, number> = {};
  for (const r of (studentRows ?? []) as unknown as StudentTransportRow[]) {
    const routeNo = r.transport_routes?.route_no;
    if (routeNo) studentCountByRoute[routeNo] = (studentCountByRoute[routeNo] ?? 0) + 1;
  }

  const routes: Route[] = ((routeRows ?? []) as unknown as TransportRouteRow[]).map((r) => ({
    id: r.id,
    routeNo: r.route_no ?? "",
    routeName: r.route_name ?? "",
    driverPhone: r.driver_phone,
    stops: Array.isArray(r.stops) ? r.stops : [],
    studentCount: studentCountByRoute[r.route_no ?? ""] ?? 0,
    capacity: r.capacity ?? 0,
    status: (r.status ?? "active") as Route["status"],
    morningDeparture: r.morning_departure,
    eveningDeparture: r.evening_departure,
  }));

  const vehicles: Vehicle[] = ((vehicleRows ?? []) as unknown as TransportVehicleRow[]).map((v) => ({
    id: v.id,
    regNo: v.reg_no ?? "",
    model: v.model ?? "",
    capacity: v.capacity ?? 0,
    year: v.year ?? 0,
    status: (v.status ?? "active") as Vehicle["status"],
    hasDriver: Boolean(v.driver_id),
    fuelType: (v.fuel_type ?? "diesel") as Vehicle["fuelType"],
    lastService: v.last_service,
    nextService: v.next_service,
  }));

  const students: StudentTransport[] = ((studentRows ?? []) as unknown as StudentTransportRow[]).map((s) => ({
    id: s.id,
    studentName: s.students?.full_name ?? "Unknown",
    rollNo: s.students?.roll_no ?? "",
    classNum: String(s.students?.sections?.grades?.level ?? ""),
    section: s.students?.sections?.name ?? "",
    phone: s.students?.phone ?? "—",
    routeNo: s.transport_routes?.route_no ?? "",
    routeName: s.transport_routes?.route_name ?? "",
    stopName: s.stop_name ?? "",
    feeStatus: (s.fee_status ?? "overdue") as StudentTransport["feeStatus"],
    monthlyFee: Number(s.monthly_fee ?? 0),
  }));

  return <TransportClient routes={routes} vehicles={vehicles} students={students} />;
}
