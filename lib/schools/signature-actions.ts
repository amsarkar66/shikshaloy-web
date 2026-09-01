"use server";

import { supabaseAdmin } from "@/lib/supabase/service";
import { requireRole } from "@/lib/auth/verified-role";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_SIZE = 2 * 1024 * 1024;

export async function uploadSchoolSignature(formData: FormData): Promise<string> {
  await requireRole(["admin", "super_admin"]);

  const file = formData.get("signature") as File | null;
  if (!file || file.size === 0) throw new Error("No file provided");
  if (!ALLOWED_TYPES.has(file.type)) throw new Error("Signature must be a PNG, JPEG, or WEBP image.");
  if (file.size > MAX_SIZE) throw new Error("Signature must be under 2MB.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `signatures/${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabaseAdmin.storage
    .from("school-logos")
    .upload(path, Buffer.from(arrayBuffer), { contentType: file.type, upsert: false });

  if (error) throw new Error(`Failed to upload signature: ${error.message}`);

  const { data } = supabaseAdmin.storage.from("school-logos").getPublicUrl(path);
  return data.publicUrl;
}
