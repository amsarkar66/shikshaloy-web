import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { hashPublishKey } from "./crypto";

export interface ResolvedKey {
  keyId: string;
  ownerId: string;
}

export async function resolveKeyOwner(request: NextRequest): Promise<ResolvedKey | null> {
  const authHeader = request.headers.get("authorization") ?? "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const plaintextKey = match[1].trim();
  const keyHash = await hashPublishKey(plaintextKey);

  const { data: keyRow } = await supabaseAdmin
    .from("public_site_keys")
    .select("id, owner_id, revoked_at")
    .eq("key_hash", keyHash)
    .maybeSingle();

  if (!keyRow || keyRow.revoked_at) return null;

  await supabaseAdmin
    .from("public_site_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id);

  return { keyId: keyRow.id, ownerId: keyRow.owner_id };
}

export async function schoolBelongsToOwner(schoolId: string, ownerId: string): Promise<boolean> {
  const { data: school } = await supabaseAdmin
    .from("schools")
    .select("institution_id")
    .eq("id", schoolId)
    .maybeSingle();
  if (!school) return false;

  const { data: institution } = await supabaseAdmin
    .from("institutions")
    .select("id")
    .eq("id", school.institution_id)
    .eq("owner_id", ownerId)
    .maybeSingle();
  return Boolean(institution);
}

export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};
