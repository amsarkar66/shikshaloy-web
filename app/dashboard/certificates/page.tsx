import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import CertificatesClient from "./_components/CertificatesClient";
import type { Cert } from "./_components/CertificatesClient";

export default async function CertificatesPage() {
  const { data } = await supabaseAdmin
    .from("certificate_requests")
    .select(`
      id, cert_type, purpose, status, requested_on, issued_on,
      students ( full_name, roll_no, sections ( name, grades ( level ) ) )
    `)
    .eq("school_id", DEMO_SCHOOL_ID)
    .order("requested_on", { ascending: false });

  const certs: Cert[] = (data ?? []).map((c: any) => ({
    id: c.id,
    studentName: c.students?.full_name ?? "Unknown",
    rollNo: c.students?.roll_no ?? "",
    class: String(c.students?.sections?.grades?.level ?? ""),
    section: c.students?.sections?.name ?? "",
    certType: c.cert_type,
    purpose: c.purpose ?? "",
    requestedOn: c.requested_on ?? "",
    issuedOn: c.issued_on ?? undefined,
    status: c.status ?? "pending",
    issuedBy: undefined,
  }));

  return <CertificatesClient initialCerts={certs} />;
}
