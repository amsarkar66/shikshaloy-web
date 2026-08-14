"use server";

import { supabaseAdmin } from "@/lib/supabase/service";

export interface UploadedDocument {
  fileUrl: string;
  fileName: string;
}

export async function uploadAdmissionDocument(formData: FormData): Promise<UploadedDocument> {
  const file = formData.get("document") as File | null;
  if (!file || file.size === 0) throw new Error("No file provided");

  const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const path = `${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabaseAdmin.storage
    .from("admission-documents")
    .upload(path, Buffer.from(arrayBuffer), { contentType: file.type, upsert: false });

  if (error) throw new Error(`Failed to upload document: ${error.message}`);

  const { data } = supabaseAdmin.storage.from("admission-documents").getPublicUrl(path);
  return { fileUrl: data.publicUrl, fileName: file.name };
}
