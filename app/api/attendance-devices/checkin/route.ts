import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { hashDeviceKey } from "@/lib/attendance/crypto";
import { resolveCredential, markAttendanceEvent, type CredentialMethod } from "@/lib/attendance/resolve";

interface CheckinBody {
  external_id?: string;
  method?: string;
  event?: string;
}

export async function POST(req: NextRequest) {
  const deviceKey = req.headers.get("x-device-key");
  if (!deviceKey) {
    return NextResponse.json({ error: "Missing x-device-key header" }, { status: 401 });
  }

  const keyHash = await hashDeviceKey(deviceKey);
  const { data: device } = await supabaseAdmin
    .from("attendance_devices")
    .select("id, school_id, type, is_active")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (!device || !device.is_active) {
    return NextResponse.json({ error: "Invalid or inactive device key" }, { status: 401 });
  }

  let body: CheckinBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { external_id: externalId, method, event = "in" } = body;
  if (!externalId || typeof externalId !== "string") {
    return NextResponse.json({ error: "external_id is required" }, { status: 400 });
  }
  if (method !== device.type) {
    return NextResponse.json({ error: `This device is registered as '${device.type}', not '${method}'` }, { status: 400 });
  }
  if (event !== "in" && event !== "out") {
    return NextResponse.json({ error: "event must be 'in' or 'out'" }, { status: 400 });
  }

  const person = await resolveCredential(device.school_id, method as CredentialMethod, externalId);
  if (!person) {
    return NextResponse.json({ error: "No student or staff member enrolled with this ID" }, { status: 404 });
  }

  const date = new Date().toISOString().split("T")[0];
  await markAttendanceEvent({
    schoolId: device.school_id,
    person,
    date,
    event,
    source: device.type,
    deviceId: device.id,
  });

  await supabaseAdmin
    .from("attendance_devices")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", device.id);

  return NextResponse.json({ ok: true, person: person.kind, event });
}
