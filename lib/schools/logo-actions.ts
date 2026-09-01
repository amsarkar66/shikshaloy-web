"use server";

import { supabaseAdmin } from "@/lib/supabase/service";
import { requireRole } from "@/lib/auth/verified-role";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);
const MAX_SIZE = 2 * 1024 * 1024;

export async function uploadSchoolLogo(formData: FormData): Promise<string> {
  await requireRole(["admin", "super_admin"]);

  const file = formData.get("logo") as File | null;
  if (!file || file.size === 0) throw new Error("No file provided");
  if (!ALLOWED_TYPES.has(file.type)) throw new Error("Logo must be a PNG, JPEG, WEBP, or SVG image.");
  if (file.size > MAX_SIZE) throw new Error("Logo must be under 2MB.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabaseAdmin.storage
    .from("school-logos")
    .upload(path, Buffer.from(arrayBuffer), { contentType: file.type, upsert: false });

  if (error) throw new Error(`Failed to upload logo: ${error.message}`);

  const { data } = supabaseAdmin.storage.from("school-logos").getPublicUrl(path);
  return data.publicUrl;
}
