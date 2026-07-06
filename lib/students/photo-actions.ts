"use server";

import { supabaseAdmin } from "@/lib/supabase/service";

export async function uploadStudentPhoto(formData: FormData): Promise<string> {
  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) throw new Error("No file provided");

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
