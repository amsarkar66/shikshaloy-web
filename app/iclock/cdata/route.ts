import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { resolveCredential, markAttendanceEvent } from "@/lib/attendance/resolve";

// ZKTeco "ADMS/PUSH" (iClock) protocol. A device configured with
// Net Mode = Internet and Server Set pointing at this host calls these
// exact paths itself — they're fixed by the device firmware, not
// something we choose, so this route MUST live at /iclock/cdata (not
// nested under /api).
//
// Built against a working reference server (github.com/saifulcoder/
// adms-server-ZKTeco, tested on an X100-C) and the protocol writeup at
// github.com/adrobinoga/zk-protocol — NOT yet verified against a real
// K40 Pro. Once the device is on the network, capture its actual
// handshake/ATTLOG traffic and adjust parseAttLogLine / the handshake
// option string below if it differs (status-code meaning for in/out and
// the exact option keys the device expects are the most likely spots to
// need tweaking).
//
// Auth note: unlike /api/attendance-devices/checkin (a hashed API key in
// a header), this protocol only gives us the device's serial number as a
// query param — there's no secret in the stock handshake. That's weaker
// than the key-based route; treat the SN as identifying, not secret.

interface DeviceRow {
  id: string;
  school_id: string;
  is_active: boolean;
}

async function findDevice(serialNumber: string | null): Promise<DeviceRow | null> {
  if (!serialNumber) return null;
  const { data } = await supabaseAdmin
    .from("attendance_devices")
    .select("id, school_id, is_active")
    .eq("serial_number", serialNumber)
    .maybeSingle();
  return data ?? null;
}

async function touchDevice(deviceId: string) {
  await supabaseAdmin
    .from("attendance_devices")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", deviceId);
}

/** Handshake — the device calls this on connect/reconnect to fetch its polling config. */
export async function GET(req: NextRequest) {
  const sn = req.nextUrl.searchParams.get("SN");
  const device = await findDevice(sn);

  if (!device || !device.is_active) {
    return new NextResponse("ERROR: unregistered device", { status: 200 });
  }

  await touchDevice(device.id);

  const body = [
    `GET OPTION FROM: ${sn}`,
    `Stamp=9999`,
    `OpStamp=${Math.floor(Date.now() / 1000)}`,
    `ErrorDelay=60`,
    `Delay=30`,
    `ResLogDay=18250`,
    `ResLogDelCount=10000`,
    `ResLogCount=50000`,
    `TransTimes=00:00;14:05`,
    `TransInterval=1`,
    `TransFlag=1111000000`,
    `Realtime=1`,
    `Encrypt=0`,
  ].join("\r\n");

  return new NextResponse(body, { status: 200, headers: { "Content-Type": "text/plain" } });
}

interface ParsedPunch {
  pin: string;
  date: string;
  event: "in" | "out";
}

/**
 * ATTLOG line: PIN, timestamp, status, verify-mode, work-code (tab-separated).
 * Status 0/1 = check-in/out is the common ZK convention but is device-configurable —
 * confirm against real punches once hardware arrives.
 */
function parseAttLogLine(line: string): ParsedPunch | null {
  const fields = line.split("\t");
  const [pin, timestamp, status] = fields;
  if (!pin || !timestamp) return null;

  const date = timestamp.split(" ")[0] || new Date().toISOString().split("T")[0];
  const event: "in" | "out" = status === "1" ? "out" : "in";
  return { pin, date, event };
}

/** Attendance push — the device POSTs new punches here (immediately, since Realtime=1 above). */
export async function POST(req: NextRequest) {
  const sn = req.nextUrl.searchParams.get("SN");
  const table = req.nextUrl.searchParams.get("table");
  const device = await findDevice(sn);

  if (!device || !device.is_active) {
    return new NextResponse("ERROR: unregistered device", { status: 200 });
  }

  await touchDevice(device.id);

  const raw = await req.text();
  const lines = raw.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0);

  // Operation logs (enrollment/admin actions on the device) aren't attendance — ack and skip.
  if (table === "OPERLOG") {
    return new NextResponse(`OK: ${lines.length}`, { status: 200 });
  }

  for (const line of lines) {
    const parsed = parseAttLogLine(line);
    if (!parsed) continue;

    // The device reports the PIN it knows the person by (assigned when they
    // were enrolled on the device itself) — shared across fingerprint/face/
    // card taps, not the raw card UID — so it's looked up under method
    // "biometric" regardless of which verify method was actually used.
    const person = await resolveCredential(device.school_id, "biometric", parsed.pin);
    if (!person) {
      console.error(`[iclock] Unrecognized device PIN "${parsed.pin}" from device SN ${sn}`);
      continue;
    }

    try {
      await markAttendanceEvent({
        schoolId: device.school_id,
        person,
        date: parsed.date,
        event: parsed.event,
        source: "biometric",
        deviceId: device.id,
      });
    } catch (err) {
      console.error(`[iclock] Failed to record attendance for PIN "${parsed.pin}":`, err);
    }
  }

  // Ack the full line count, not just successfully-resolved ones, so the
  // device doesn't treat an unenrolled PIN as a delivery failure and retry
  // it forever.
  return new NextResponse(`OK: ${lines.length}`, { status: 200 });
}
