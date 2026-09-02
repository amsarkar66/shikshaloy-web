import { ShieldAlert } from "lucide-react";
import { getVerifiedUser, requireRole } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import CertificatesClient from "./_components/CertificatesClient";
import type { Cert, SchoolOption } from "./_components/CertificatesClient";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins can manage certificates.</p>
      </div>
    </div>
  );
}

interface CertificateRequestRow {
  id: string;
  cert_type: string;
  purpose: string | null;
  status: string | null;
  requested_on: string | null;
  issued_on: string | null;
  school_id: string;
  students: {
    full_name: string | null;
    roll_no: string | null;
    sections: { name: string | null; grades: { level: number | null } | null } | null;
  } | null;
  staff_members: { full_name: string | null } | null;
}

export default async function CertificatesPage() {
  try {
    await requireRole(["admin", "super_admin"]);
  } catch {
    return <Unauthorized />;
  }

  const verifiedUser = await getVerifiedUser();
  const isSuperAdmin = verifiedUser?.role === "super_admin";

  if (isSuperAdmin) {
    const institutionId = await getCurrentInstitutionIdOrThrow();
    const { data: schoolRows } = await supabaseAdmin
      .from("schools")
      .select("id, name, address, city, state, logo_url, principal_signature_url")
      .eq("institution_id", institutionId)
      .order("name");

    const schools: SchoolOption[] = (schoolRows ?? []).map((s) => ({ id: s.id, name: s.name ?? "" }));
    const schoolIds = schools.map((s) => s.id);

    if (schoolIds.length === 0) {
      return <CertificatesClient initialCerts={[]} schoolName="" schoolAddress="" schoolLogoUrl={null} schoolSignatureUrl={null} academicYear="" schools={[]} />;
    }

    const [{ data: certRows }, { data: currentYearRows }] = await Promise.all([
      supabaseAdmin
        .from("certificate_requests")
        .select(`
          id, cert_type, purpose, status, requested_on, issued_on, school_id,
          students ( full_name, roll_no, sections ( name, grades ( level ) ) ),
          staff_members ( full_name )
        `)
        .in("school_id", schoolIds)
        .order("requested_on", { ascending: false }),
      supabaseAdmin
        .from("academic_years")
        .select("school_id, name")
        .in("school_id", schoolIds)
        .eq("is_current", true),
    ]);

    const schoolById = new Map((schoolRows ?? []).map((s) => [s.id, s]));
    const academicYearBySchool = new Map((currentYearRows ?? []).map((y) => [y.school_id, y.name]));

    const certs: Cert[] = ((certRows ?? []) as unknown as CertificateRequestRow[]).map((c) => {
      const school = schoolById.get(c.school_id);
      const schoolAddress = school ? [school.address, school.city, school.state].filter(Boolean).join(", ") : "";
      return {
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
        issuedBy: c.staff_members?.full_name ?? undefined,
        schoolId: c.school_id,
        schoolName: school?.name ?? "—",
        schoolAddress,
        schoolLogoUrl: school?.logo_url ?? null,
        schoolSignatureUrl: school?.principal_signature_url ?? null,
        academicYear: academicYearBySchool.get(c.school_id) ?? "",
      };
    });

    return (
      <CertificatesClient
        initialCerts={certs}
        schoolName=""
        schoolAddress=""
        schoolLogoUrl={null}
        schoolSignatureUrl={null}
        academicYear=""
        schools={schools}
      />
    );
  }

  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId().catch(() => null);

  const [{ data }, { data: schoolRow }, { data: ayRow }] = await Promise.all([
    supabaseAdmin
      .from("certificate_requests")
      .select(`
        id, cert_type, purpose, status, requested_on, issued_on,
        students ( full_name, roll_no, sections ( name, grades ( level ) ) ),
        staff_members ( full_name )
      `)
      .eq("school_id", schoolId)
      .order("requested_on", { ascending: false }),

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
    issuedBy: c.staff_members?.full_name ?? undefined,
  }));

  const schoolAddress = [schoolRow?.address, schoolRow?.city, schoolRow?.state].filter(Boolean).join(", ");

  return (
    <CertificatesClient
      initialCerts={certs}
      schoolName={schoolRow?.name ?? "Shikshaloy"}
      schoolAddress={schoolAddress}
      schoolLogoUrl={schoolRow?.logo_url ?? null}
      schoolSignatureUrl={schoolRow?.principal_signature_url ?? null}
      academicYear={ayRow?.name ?? ""}
    />
  );
}
