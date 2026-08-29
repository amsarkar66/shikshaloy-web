import { NextRequest, NextResponse } from "next/server";
import { resolveKeyOwner, CORS_HEADERS } from "@/lib/publish-keys/resolve";
import { getPublicSiteSchools } from "@/lib/domains/public-site-data";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const resolved = await resolveKeyOwner(request);
  if (!resolved) return jsonError("Invalid or revoked publish key", 401);

  const schools = await getPublicSiteSchools(resolved.ownerId);
  return NextResponse.json({ schools }, { headers: CORS_HEADERS });
}
