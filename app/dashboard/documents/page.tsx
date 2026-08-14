import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import DocumentsClient from "./_components/DocumentsClient";
import type { SchoolDocument } from "./_data/documents";

export default async function DocumentsPage() {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data: rows } = await supabaseAdmin
    .from("documents")
    .select("id, title, category, audience, file_kind, size_kb, uploaded_by, uploaded_date")
    .eq("school_id", schoolId)
    .order("uploaded_date", { ascending: false });

  const docs: SchoolDocument[] = (rows ?? []).map((d) => ({
    id: d.id,
    title: d.title,
    category: d.category,
    audience: d.audience,
    fileKind: d.file_kind,
    sizeKb: d.size_kb,
    uploadedBy: d.uploaded_by,
    uploadedDate: d.uploaded_date,
  }));

  return <DocumentsClient docs={docs} />;
}
