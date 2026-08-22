"use server";

import { supabaseAdmin } from "@/lib/supabase/service";

export async function uploadSchoolSignature(formData: FormData): Promise<string> {
  const file = formData.get("signature") as File | null;
  if (!file || file.size === 0) throw new Error("No file provided");

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
