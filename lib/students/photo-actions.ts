"use server";

import { supabaseAdmin } from "@/lib/supabase/service";
import { requireRole } from "@/lib/auth/verified-role";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024;

export async function uploadStudentPhoto(formData: FormData): Promise<string> {
  await requireRole(["admin", "super_admin"]);

  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) throw new Error("No file provided");
  if (!ALLOWED_TYPES.has(file.type)) throw new Error("Photo must be a PNG, JPEG, or WEBP image.");
  if (file.size > MAX_SIZE) throw new Error("Photo must be under 5MB.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabaseAdmin.storage
    .from("student-photos")
    .upload(path, Buffer.from(arrayBuffer), { contentType: file.type, upsert: false });

  if (error) throw new Error(`Failed to upload photo: ${error.message}`);

  const { data } = supabaseAdmin.storage.from("student-photos").getPublicUrl(path);
  return data.publicUrl;
}
