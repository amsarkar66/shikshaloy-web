import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import DocumentsClient from "./_components/DocumentsClient";
import type { SchoolDocument } from "./_data/documents";

export default async function DocumentsPage() {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data: rows } = await supabaseAdmin
    .from("documents")
    .select("id, title, category, audience, file_kind, size_kb, uploaded_by, uploaded_date, file_url, file_name")
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
    fileUrl: d.file_url,
    fileName: d.file_name,
  }));

  return <DocumentsClient docs={docs} />;
}
