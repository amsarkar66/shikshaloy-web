import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { resolveKeyOwner, schoolBelongsToOwner, CORS_HEADERS } from "@/lib/publish-keys/resolve";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
  const resolved = await resolveKeyOwner(request);
  if (!resolved) return jsonError("Invalid or revoked publish key", 401);

  const body = await request.json().catch(() => null);
  if (!body) return jsonError("Invalid request body", 400);

  const { schoolId, name, email, phone, category, subject, message, website } = body as Record<string, string>;

  // Honeypot — bots tend to fill every field, humans never see this one.
  if (website) {
    return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
  }

  if (!schoolId || !name?.trim() || !subject?.trim() || !message?.trim()) {
    return jsonError("Missing required fields", 400);
  }

  if (!(await schoolBelongsToOwner(schoolId, resolved.ownerId))) {
    return jsonError("Unknown school", 400);
  }

  const { error } = await supabaseAdmin.from("grievances").insert({
    school_id: schoolId,
    name: name.trim(),
    email: email?.trim() || null,
    phone: phone?.trim() || null,
    category: category?.trim() || "other",
    subject: subject.trim(),
    message: message.trim(),
    status: "open",
  });

  if (error) return jsonError("Failed to submit grievance", 500);

  return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
}
