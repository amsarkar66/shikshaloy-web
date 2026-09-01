"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { requireRole } from "@/lib/auth/verified-role";
import { generatePublishKey, hashPublishKey, publishKeyPrefix } from "./crypto";

export interface PublishKeyRow {
  id: string;
  label: string | null;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

async function requireOwner() {
  return requireRole(["super_admin", "kernel"]);
}

export async function createPublishKey(label?: string): Promise<{ plaintextKey: string }> {
  const user = await requireOwner();

  const plaintextKey = generatePublishKey();
  const keyHash = await hashPublishKey(plaintextKey);

  const { error } = await supabaseAdmin.from("public_site_keys").insert({
    owner_id: user.id,
    key_hash: keyHash,
    key_prefix: publishKeyPrefix(plaintextKey),
    label: label?.trim() || null,
  });

  if (error) throw new Error(`Failed to create publish key: ${error.message}`);

  revalidatePath("/dashboard/settings");
  return { plaintextKey };
}

export async function revokePublishKey(keyId: string): Promise<void> {
  const user = await requireOwner();

  const { data: row } = await supabaseAdmin
    .from("public_site_keys")
    .select("owner_id")
    .eq("id", keyId)
    .maybeSingle();

  if (!row || row.owner_id !== user.id) {
    throw new Error("Not found");
  }

  const { error } = await supabaseAdmin
    .from("public_site_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId);

  if (error) throw new Error(`Failed to revoke publish key: ${error.message}`);

  revalidatePath("/dashboard/settings");
}

export async function listPublishKeys(): Promise<PublishKeyRow[]> {
  const user = await requireOwner();

  const { data } = await supabaseAdmin
    .from("public_site_keys")
    .select("id, label, key_prefix, created_at, last_used_at, revoked_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map((k) => ({
    id: k.id,
    label: k.label,
    keyPrefix: k.key_prefix,
    createdAt: k.created_at,
    lastUsedAt: k.last_used_at,
    revokedAt: k.revoked_at,
  }));
}
