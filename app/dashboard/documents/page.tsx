import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentInstitutionId, getInstitutionSchools } from "@/lib/supabase/institution-context";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import DocumentsClient from "./_components/DocumentsClient";
import type { SchoolDocument } from "./_data/documents";

const DOCUMENT_SELECT = "id, title, category, audience, file_kind, size_kb, uploaded_by, uploaded_date, file_url, file_name, school_id";

interface DocumentRow {
  id: string; title: string; category: string; audience: string; file_kind: string;
  size_kb: number; uploaded_by: string; uploaded_date: string; file_url: string | null; file_name: string | null;
  school_id: string;
}

function toDoc(d: DocumentRow, schoolNameById?: Map<string, string>): SchoolDocument {
  return {
    id: d.id,
    title: d.title,
    category: d.category as SchoolDocument["category"],
    audience: d.audience as SchoolDocument["audience"],
    fileKind: d.file_kind as SchoolDocument["fileKind"],
    sizeKb: d.size_kb,
    uploadedBy: d.uploaded_by,
    uploadedDate: d.uploaded_date,
    fileUrl: d.file_url,
    fileName: d.file_name,
    schoolId: schoolNameById ? d.school_id : undefined,
    schoolName: schoolNameById ? (schoolNameById.get(d.school_id) ?? "—") : undefined,
  };
}

export default async function DocumentsPage() {
  const verifiedUser = await getVerifiedUser();

  if (verifiedUser?.role === "super_admin") {
    const institutionId = await getCurrentInstitutionId();
    if (institutionId) {
      const schools = await getInstitutionSchools(institutionId);
      const schoolIds = schools.map((s) => s.id);
      const schoolNameById = new Map(schools.map((s) => [s.id, s.name]));

      if (schoolIds.length === 0) {
        return <DocumentsClient docs={[]} schools={schools} />;
      }

      const { data: rows } = await supabaseAdmin
        .from("documents")
        .select(DOCUMENT_SELECT)
        .in("school_id", schoolIds)
        .order("uploaded_date", { ascending: false });

      const docs: SchoolDocument[] = ((rows ?? []) as DocumentRow[]).map((d) => toDoc(d, schoolNameById));

      return <DocumentsClient docs={docs} schools={schools} />;
    }
  }

  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data: rows } = await supabaseAdmin
    .from("documents")
    .select(DOCUMENT_SELECT)
    .eq("school_id", schoolId)
    .order("uploaded_date", { ascending: false });

  const docs: SchoolDocument[] = ((rows ?? []) as DocumentRow[]).map((d) => toDoc(d));

  return <DocumentsClient docs={docs} />;
}
