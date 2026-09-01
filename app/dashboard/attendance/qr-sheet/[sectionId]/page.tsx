import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { ShieldAlert } from "lucide-react";
import { getVerifiedRole } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import QrSheetClient, { type QrSheetStudent } from "../../_components/QrSheetClient";

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins can print attendance QR sheets.</p>
      </div>
    </div>
  );
}

export default async function QrSheetPage({ params }: { params: Promise<{ sectionId: string }> }) {
  const { sectionId } = await params;
  const role = await getVerifiedRole();
  if (role !== "admin") return <Unauthorized />;

  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data: section } = await supabaseAdmin
    .from("sections")
    .select("id, name, school_id, grades ( level )")
    .eq("id", sectionId)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (!section) notFound();

  const [{ data: school }, { data: students }] = await Promise.all([
    supabaseAdmin.from("schools").select("name").eq("id", schoolId).maybeSingle(),
    supabaseAdmin
      .from("students")
      .select("id, full_name, roll_no")
      .eq("section_id", sectionId)
      .order("roll_no"),
  ]);

  const roster = students ?? [];
  const origin = siteUrl();

  const sheetStudents: QrSheetStudent[] = await Promise.all(
    roster.map(async (s) => ({
      id: s.id,
      name: s.full_name,
      rollNo: s.roll_no ?? "—",
      // Same code the ID card prints — this sheet is a fallback/reprint, not a second QR.
      qrDataUrl: await QRCode.toDataURL(`${origin}/s/${s.id}`, { margin: 0, width: 140 }),
    })),
  );

  const grades = section.grades as unknown as { level: number | null } | { level: number | null }[] | null;
  const level = Array.isArray(grades) ? grades[0]?.level : grades?.level;
  const sectionLabel = `Class ${level ?? "?"}–${section.name ?? ""}`;

  return <QrSheetClient schoolName={school?.name ?? "School"} sectionLabel={sectionLabel} students={sheetStudents} />;
}
