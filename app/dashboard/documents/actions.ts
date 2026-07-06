"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import type { DocCategory, DocAudience, FileKind } from "./_data/documents";

export async function uploadDocument(input: {
  title: string;
  category: DocCategory;
  audience: DocAudience;
  fileKind: FileKind;
  sizeKb: number;
}) {
  const { error } = await supabaseAdmin.from("documents").insert({
    school_id: DEMO_SCHOOL_ID,
    title: input.title,
    category: input.category,
    audience: input.audience,
    file_kind: input.fileKind,
    size_kb: input.sizeKb,
    uploaded_by: "Principal Office",
    uploaded_date: new Date().toISOString().slice(0, 10),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/documents");
}

export async function deleteDocument(id: string) {
  const { error } = await supabaseAdmin.from("documents").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/documents");
}
