"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import type { DocCategory, DocAudience, FileKind } from "./_data/documents";

export async function uploadDocument(input: {
  title: string;
  category: DocCategory;
  audience: DocAudience;
  fileKind: FileKind;
  sizeKb: number;
  fileUrl: string;
  fileName: string;
}) {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const {
    data: { user },
  } = await getUser();
  const uploadedBy = (user?.user_metadata?.full_name as string) || user?.email || "Unknown";

  const { error } = await supabaseAdmin.from("documents").insert({
    school_id: schoolId,
    title: input.title,
    category: input.category,
    audience: input.audience,
    file_kind: input.fileKind,
    size_kb: input.sizeKb,
    file_url: input.fileUrl,
    file_name: input.fileName,
    uploaded_by: uploadedBy,
    uploaded_date: new Date().toISOString().slice(0, 10),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/documents");
}

export async function deleteDocument(id: string) {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin.from("documents").delete().eq("id", id).eq("school_id", schoolId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/documents");
}
