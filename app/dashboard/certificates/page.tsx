import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import CertificatesClient from "./_components/CertificatesClient";
import type { Cert, StudentOption } from "./_components/CertificatesClient";

interface CertificateRequestRow {
  id: string;
  cert_type: string;
  purpose: string | null;
  status: string | null;
  requested_on: string | null;
  issued_on: string | null;
  students: {
    full_name: string | null;
    roll_no: string | null;
    sections: { name: string | null; grades: { level: number | null } | null } | null;
  } | null;
}

interface StudentPickerRow {
  id: string;
  full_name: string;
  roll_no: string | null;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
}

export default async function CertificatesPage() {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId().catch(() => null);

  const [{ data }, { data: studentRows }, { data: schoolRow }, { data: ayRow }] = await Promise.all([
    supabaseAdmin
      .from("certificate_requests")
      .select(`
        id, cert_type, purpose, status, requested_on, issued_on,
        students ( full_name, roll_no, sections ( name, grades ( level ) ) )
      `)
      .eq("school_id", schoolId)
      .order("requested_on", { ascending: false }),

    supabaseAdmin
      .from("students")
      .select("id, full_name, roll_no, sections ( name, grades ( level ) )")
      .eq("school_id", schoolId)
      .eq("status", "active")
      .order("full_name"),

    supabaseAdmin
      .from("schools")
      .select("name, address, city, state, logo_url, principal_signature_url")
      .eq("id", schoolId)
      .maybeSingle(),

    academicYearId
      ? supabaseAdmin.from("academic_years").select("name").eq("id", academicYearId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const certs: Cert[] = ((data ?? []) as unknown as CertificateRequestRow[]).map((c) => ({
    id: c.id,
    studentName: c.students?.full_name ?? "Unknown",
    rollNo: c.students?.roll_no ?? "",
    class: String(c.students?.sections?.grades?.level ?? ""),
    section: c.students?.sections?.name ?? "",
    certType: c.cert_type as Cert["certType"],
    purpose: c.purpose ?? "",
    requestedOn: c.requested_on ?? "",
    issuedOn: c.issued_on ?? undefined,
    status: (c.status ?? "pending") as Cert["status"],
    issuedBy: undefined,
  }));

  const studentOptions: StudentOption[] = ((studentRows ?? []) as unknown as StudentPickerRow[]).map((s) => ({
    id: s.id,
    name: s.full_name,
    rollNo: s.roll_no ?? "",
    class: String(s.sections?.grades?.level ?? ""),
    section: s.sections?.name ?? "",
  }));

  const schoolAddress = [schoolRow?.address, schoolRow?.city, schoolRow?.state].filter(Boolean).join(", ");

  return (
    <CertificatesClient
      initialCerts={certs}
      studentOptions={studentOptions}
      schoolName={schoolRow?.name ?? "Shikshaloy"}
      schoolAddress={schoolAddress}
      schoolLogoUrl={schoolRow?.logo_url ?? null}
      schoolSignatureUrl={schoolRow?.principal_signature_url ?? null}
      academicYear={ayRow?.name ?? ""}
    />
  );
}
