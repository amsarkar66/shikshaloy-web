"use server";

import { supabaseAdmin } from "@/lib/supabase/service";

export interface UploadedSchoolDocument {
  fileUrl: string;
  fileName: string;
}

export async function uploadSchoolDocumentFile(formData: FormData): Promise<UploadedSchoolDocument> {
  const file = formData.get("document") as File | null;
  if (!file || file.size === 0) throw new Error("No file provided");

  const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const path = `${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabaseAdmin.storage
    .from("school-documents")
    .upload(path, Buffer.from(arrayBuffer), { contentType: file.type, upsert: false });

  if (error) throw new Error(`Failed to upload document: ${error.message}`);

  const { data } = supabaseAdmin.storage.from("school-documents").getPublicUrl(path);
  return { fileUrl: data.publicUrl, fileName: file.name };
}
