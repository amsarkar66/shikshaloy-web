"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { resolveAuthorizedSchoolId, assertAuthorizedSchool } from "@/lib/supabase/authorized-school";
import type { DocCategory, DocAudience, FileKind } from "./_data/documents";

// Reachable both from the single-school Documents page (no explicit
// schoolId — falls back to the school-switcher cookie) and, once combined
// across an institution's schools, with an explicit schoolId the caller
// picked, which must be verified as theirs before it's trusted.
async function resolveTargetSchoolId(explicitSchoolId?: string): Promise<string> {
  if (explicitSchoolId) {
    const vu = await getVerifiedUser();
    if (!vu) throw new Error("Unauthorized");
    await assertAuthorizedSchool(vu, explicitSchoolId);
    return explicitSchoolId;
  }
  return getCurrentSchoolIdOrThrow();
}

export async function uploadDocument(input: {
  title: string;
  category: DocCategory;
  audience: DocAudience;
  fileKind: FileKind;
  sizeKb: number;
  fileUrl: string;
  fileName: string;
  schoolId?: string;
}) {
  const schoolId = await resolveTargetSchoolId(input.schoolId);
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
  const schoolId = await resolveAuthorizedSchoolId("documents", id);
  const { error } = await supabaseAdmin.from("documents").delete().eq("id", id).eq("school_id", schoolId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/documents");
}
