"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import type { RouteStatus, VehicleStatus, FuelType, TransportFeeStatus } from "./_data/transport";

export interface DriverOption {
  id: string;
  name: string;
  phone: string | null;
}

export async function getDriverOptions(): Promise<DriverOption[]> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, phone")
    .eq("school_id", schoolId)
    .eq("role", "driver")
    .order("full_name");

  if (error) throw new Error(error.message);

  return (data ?? []).map((d) => ({
    id: d.id,
    name: d.full_name ?? "Unnamed driver",
    phone: d.phone,
  }));
}

// ── Routes ────────────────────────────────────────────────────────────────────

export interface RouteInput {
  routeNo: string;
  routeName: string;
  driverId?: string | null;
  driverPhone?: string | null;
  stops: string[];
  capacity: number;
  status: RouteStatus;
  morningDeparture?: string | null;
  eveningDeparture?: string | null;
}

function cleanStops(stops: string[]): string[] {
  return stops.map((s) => s.trim()).filter(Boolean);
}

export async function createRoute(input: RouteInput): Promise<{ id: string }> {
  if (!input.routeNo.trim()) throw new Error("Route number is required.");
  if (!input.routeName.trim()) throw new Error("Route name is required.");

  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data, error } = await supabaseAdmin
    .from("transport_routes")
    .insert({
      school_id: schoolId,
      route_no: input.routeNo.trim(),
      route_name: input.routeName.trim(),
      driver_id: input.driverId || null,
      driver_phone: input.driverPhone?.trim() || null,
      stops: cleanStops(input.stops),
      capacity: input.capacity > 0 ? input.capacity : null,
      status: input.status,
      morning_departure: input.morningDeparture || null,
      evening_departure: input.eveningDeparture || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error(`Route ${input.routeNo} already exists.`);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/transport");
  return { id: data.id };
}

export interface UpdateRouteInput extends RouteInput {
  id: string;
}

export async function updateRoute(input: UpdateRouteInput): Promise<void> {
  if (!input.routeNo.trim()) throw new Error("Route number is required.");
  if (!input.routeName.trim()) throw new Error("Route name is required.");

  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("transport_routes")
    .update({
      route_no: input.routeNo.trim(),
      route_name: input.routeName.trim(),
      driver_id: input.driverId || null,
      driver_phone: input.driverPhone?.trim() || null,
      stops: cleanStops(input.stops),
      capacity: input.capacity > 0 ? input.capacity : null,
      status: input.status,
      morning_departure: input.morningDeparture || null,
      evening_departure: input.eveningDeparture || null,
    })
    .eq("id", input.id)
    .eq("school_id", schoolId);

  if (error) {
    if (error.code === "23505") throw new Error(`Route ${input.routeNo} already exists.`);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/transport");
}

// ── Vehicles ──────────────────────────────────────────────────────────────────

export interface VehicleInput {
  regNo: string;
  model: string;
  capacity: number;
  year: number;
  status: VehicleStatus;
  driverId?: string | null;
  fuelType: FuelType;
  lastService?: string | null;
  nextService?: string | null;
}

export async function createVehicle(input: VehicleInput): Promise<{ id: string }> {
  if (!input.regNo.trim()) throw new Error("Registration number is required.");
  if (!input.model.trim()) throw new Error("Model is required.");

  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data, error } = await supabaseAdmin
    .from("vehicles")
    .insert({
      school_id: schoolId,
      reg_no: input.regNo.trim().toUpperCase(),
      model: input.model.trim(),
      capacity: input.capacity > 0 ? input.capacity : null,
      year: input.year || null,
      status: input.status,
      driver_id: input.driverId || null,
      fuel_type: input.fuelType,
      last_service: input.lastService || null,
      next_service: input.nextService || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error(`Vehicle ${input.regNo} already exists.`);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/transport");
  return { id: data.id };
}

export interface UpdateVehicleInput extends VehicleInput {
  id: string;
}

export async function updateVehicle(input: UpdateVehicleInput): Promise<void> {
  if (!input.regNo.trim()) throw new Error("Registration number is required.");
  if (!input.model.trim()) throw new Error("Model is required.");

  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("vehicles")
    .update({
      reg_no: input.regNo.trim().toUpperCase(),
      model: input.model.trim(),
      capacity: input.capacity > 0 ? input.capacity : null,
      year: input.year || null,
      status: input.status,
      driver_id: input.driverId || null,
      fuel_type: input.fuelType,
      last_service: input.lastService || null,
      next_service: input.nextService || null,
    })
    .eq("id", input.id)
    .eq("school_id", schoolId);

  if (error) {
    if (error.code === "23505") throw new Error(`Vehicle ${input.regNo} already exists.`);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/transport");
}

// ── Student assignments ───────────────────────────────────────────────────────

export interface StudentSearchResult {
  id: string;
  name: string;
  rollNo: string;
  classNum: string;
  section: string;
}

export async function searchUnassignedStudents(query: string): Promise<StudentSearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const { data: assigned } = await supabaseAdmin
    .from("student_transport")
    .select("student_id")
    .eq("school_id", schoolId)
    .eq("academic_year_id", academicYearId);

  const assignedIds = new Set((assigned ?? []).map((a) => a.student_id));

  const { data, error } = await supabaseAdmin
    .from("students")
    .select("id, full_name, roll_no, sections ( name, grades ( level ) )")
    .eq("school_id", schoolId)
    .or(`full_name.ilike.%${q}%,roll_no.ilike.%${q}%`)
    .order("full_name")
    .limit(10);

  if (error) throw new Error(error.message);

  return (data ?? [])
    .filter((s) => !assignedIds.has(s.id))
    .map((s) => {
      const section = Array.isArray(s.sections) ? s.sections[0] : s.sections;
      const grade = section?.grades ? (Array.isArray(section.grades) ? section.grades[0] : section.grades) : null;
      return {
        id: s.id,
        name: s.full_name ?? "Unknown",
        rollNo: s.roll_no ?? "",
        classNum: String(grade?.level ?? ""),
        section: section?.name ?? "",
      };
    });
}

export interface AssignStudentInput {
  studentId: string;
  routeId: string;
  stopName: string;
  monthlyFee: number;
  feeStatus: TransportFeeStatus;
}

export async function assignStudentTransport(input: AssignStudentInput): Promise<{ id: string }> {
  if (!input.studentId) throw new Error("Select a student.");
  if (!input.routeId) throw new Error("Select a route.");
  if (!input.stopName.trim()) throw new Error("Stop name is required.");

  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const { data, error } = await supabaseAdmin
    .from("student_transport")
    .insert({
      school_id: schoolId,
      academic_year_id: academicYearId,
      student_id: input.studentId,
      route_id: input.routeId,
      stop_name: input.stopName.trim(),
      monthly_fee: input.monthlyFee >= 0 ? input.monthlyFee : 0,
      fee_status: input.feeStatus,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("This student is already assigned to a transport route.");
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/transport");
  return { id: data.id };
}

export interface UpdateStudentTransportInput {
  id: string;
  routeId: string;
  stopName: string;
  monthlyFee: number;
  feeStatus: TransportFeeStatus;
}

export async function updateStudentTransport(input: UpdateStudentTransportInput): Promise<void> {
  if (!input.routeId) throw new Error("Select a route.");
  if (!input.stopName.trim()) throw new Error("Stop name is required.");

  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("student_transport")
    .update({
      route_id: input.routeId,
      stop_name: input.stopName.trim(),
      monthly_fee: input.monthlyFee >= 0 ? input.monthlyFee : 0,
      fee_status: input.feeStatus,
    })
    .eq("id", input.id)
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/transport");
}

export async function removeStudentTransport(id: string): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { error } = await supabaseAdmin
    .from("student_transport")
    .delete()
    .eq("id", id)
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/transport");
}
