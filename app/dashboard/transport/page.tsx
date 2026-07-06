import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import TransportClient from "./_components/TransportClient";
import type { Route, Vehicle, StudentTransport } from "./_data/transport";

export default async function TransportPage() {
  const [{ data: routeRows }, { data: vehicleRows }, { data: studentRows }] = await Promise.all([
    supabaseAdmin
      .from("transport_routes")
      .select("id, route_no, route_name, driver_id, driver_phone, stops, capacity, status, morning_departure, evening_departure")
      .eq("school_id", DEMO_SCHOOL_ID)
      .order("route_no"),

    supabaseAdmin
      .from("vehicles")
      .select("id, reg_no, model, capacity, year, status, driver_id, fuel_type, last_service, next_service")
      .eq("school_id", DEMO_SCHOOL_ID)
      .order("reg_no"),

    supabaseAdmin
      .from("student_transport")
      .select(`
        id, stop_name, monthly_fee, fee_status,
        students ( full_name, roll_no, phone, sections ( name, grades ( level ) ) ),
        transport_routes ( route_no, route_name )
      `)
      .eq("school_id", DEMO_SCHOOL_ID),
  ]);

  const studentCountByRoute: Record<string, number> = {};
  for (const r of (studentRows ?? []) as any[]) {
    const routeNo = r.transport_routes?.route_no;
    if (routeNo) studentCountByRoute[routeNo] = (studentCountByRoute[routeNo] ?? 0) + 1;
  }

  const routes: Route[] = (routeRows ?? []).map((r: any) => ({
    id: r.id,
    routeNo: r.route_no ?? "",
    routeName: r.route_name ?? "",
    driverPhone: r.driver_phone,
    stops: Array.isArray(r.stops) ? r.stops : [],
    studentCount: studentCountByRoute[r.route_no] ?? 0,
    capacity: r.capacity ?? 0,
    status: r.status ?? "active",
    morningDeparture: r.morning_departure,
    eveningDeparture: r.evening_departure,
  }));

  const vehicles: Vehicle[] = (vehicleRows ?? []).map((v: any) => ({
    id: v.id,
    regNo: v.reg_no ?? "",
    model: v.model ?? "",
    capacity: v.capacity ?? 0,
    year: v.year ?? 0,
    status: v.status ?? "active",
    hasDriver: Boolean(v.driver_id),
    fuelType: v.fuel_type ?? "diesel",
    lastService: v.last_service,
    nextService: v.next_service,
  }));

  const students: StudentTransport[] = (studentRows ?? []).map((s: any) => ({
    id: s.id,
    studentName: s.students?.full_name ?? "Unknown",
    rollNo: s.students?.roll_no ?? "",
    classNum: String(s.students?.sections?.grades?.level ?? ""),
    section: s.students?.sections?.name ?? "",
    phone: s.students?.phone ?? "—",
    routeNo: s.transport_routes?.route_no ?? "",
    routeName: s.transport_routes?.route_name ?? "",
    stopName: s.stop_name ?? "",
    feeStatus: s.fee_status ?? "overdue",
    monthlyFee: Number(s.monthly_fee ?? 0),
  }));

  return <TransportClient routes={routes} vehicles={vehicles} students={students} />;
}
