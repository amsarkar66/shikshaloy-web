import { getUser } from "@/lib/supabase/server";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getParentContext } from "@/lib/parents/context";
import ReportsClient from "./_components/ReportsClient";
import { REPORT_CATALOG } from "./_data/reports";
import type { Report, RecentReport } from "./_data/reports";
import ParentReportsClient, { type ChildReportData, type ChildExamGroup, type ChildCertificate } from "./_components/ParentReportsClient";
import type { CertType } from "../certificates/_data/certificates";
import { getSchoolGradeBands } from "@/lib/exams/grading-data";
import { DEFAULT_GRADE_BANDS } from "@/lib/exams/grading";

interface ParentExamResultRow {
  student_id: string;
  marks_obtained: number | null;
  max_marks: number | null;
  grade: string | null;
  is_absent: boolean | null;
  subjects: { name: string | null } | null;
  exams: { id: string; name: string | null; status: string | null; start_date: string } | null;
}

interface ParentCertRow {
  id: string; student_id: string; cert_type: string; purpose: string | null;
  status: string | null; requested_on: string | null; issued_on: string | null;
}

async function ParentReports({ userId }: { userId: string }) {
  const parent = await getParentContext(userId);

  if (!parent) {
    return <ParentReportsClient childrenData={[]} gradeBands={DEFAULT_GRADE_BANDS} />;
  }

  const childIds = parent.children.map((c) => c.id);

  const [{ data: examRows }, { data: certRows }, gradeBands] = await Promise.all([
    childIds.length
      ? supabaseAdmin
          .from("exam_results")
          .select(`student_id, marks_obtained, max_marks, grade, is_absent, subjects ( name ), exams ( id, name, status, start_date )`)
          .in("student_id", childIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as ParentExamResultRow[] }),

    childIds.length
      ? supabaseAdmin
          .from("certificate_requests")
          .select("id, student_id, cert_type, purpose, status, requested_on, issued_on")
          .in("student_id", childIds)
          .order("requested_on", { ascending: false })
      : Promise.resolve({ data: [] as ParentCertRow[] }),

    getSchoolGradeBands(await getCurrentSchoolIdOrThrow()),
  ]);

  const childrenData: ChildReportData[] = parent.children.map((child) => {
    const published = ((examRows ?? []) as unknown as ParentExamResultRow[])
      .filter((r) => r.student_id === child.id && r.exams?.status === "published");

    const byExam = new Map<string, ParentExamResultRow[]>();
    for (const r of published) {
      const key = r.exams?.id;
      if (!key) continue;
      (byExam.get(key) ?? byExam.set(key, []).get(key)!).push(r);
    }

    const examGroups: ChildExamGroup[] = Array.from(byExam.entries()).map(([examId, rows]) => {
      const subjectRows = rows.map((r) => ({
        subject: r.subjects?.name ?? "Subject",
        marks: Math.round(Number(r.marks_obtained ?? 0)),
        max: Math.round(Number(r.max_marks ?? 100)),
        grade: r.grade ?? "—",
        isAbsent: !!r.is_absent,
      }));
      const total = subjectRows.reduce((a, b) => a + b.marks, 0);
      const maxTotal = subjectRows.reduce((a, b) => a + b.max, 0);
      const pct = maxTotal ? Math.round((total / maxTotal) * 100) : 0;
      return {
        examId,
        examName: rows[0].exams?.name ?? "Exam",
        date: rows[0].exams?.start_date ?? "",
        rows: subjectRows,
        total, maxTotal, pct,
      };
    }).sort((a, b) => (b.date > a.date ? 1 : -1));

    const certificates: ChildCertificate[] = ((certRows ?? []) as unknown as ParentCertRow[])
      .filter((c) => c.student_id === child.id)
      .map((c) => ({
        id: c.id,
        certType: c.cert_type as CertType,
        purpose: c.purpose ?? "",
        status: (c.status ?? "pending") as ChildCertificate["status"],
        requestedOn: c.requested_on ?? "",
        issuedOn: c.issued_on ?? undefined,
      }));

    return {
      id: child.id,
      name: child.fullName,
      classLabel: child.gradeLevel ? `${child.gradeLevel}-${child.sectionName}` : "—",
      rollNo: child.rollNo,
      examGroups,
      certificates,
    };
  });

  return <ParentReportsClient childrenData={childrenData} gradeBands={gradeBands} />;
}

export default async function ReportsPage() {
  const { data: { user } } = await getUser();
  const vu = await getVerifiedUser();
  const role = vu?.role;

  if (role === "parent" && user) {
    return <ParentReports userId={user.id} />;
  }

  if (!vu || (role !== "admin" && role !== "super_admin")) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
          <p className="text-sm text-gray-500 dark:text-zinc-400">You don&apos;t have access to reports.</p>
        </div>
      </div>
    );
  }

  const schoolId = await getCurrentSchoolIdOrThrow();

  const [{ data: rows }, { data: customRows }] = await Promise.all([
    supabaseAdmin
      .from("report_generations")
      .select("id, report_id, custom_report_id, report_name, category, format, generated_by, size_kb, created_at")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("custom_reports")
      .select("id, name, description, entity, columns, filters, group_by, aggregate, sort_by, sort_dir, is_scheduled, schedule_label")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false }),
  ]);

  const recentReports: RecentReport[] = (rows ?? []).map((r) => ({
    id: r.id,
    reportId: r.custom_report_id ?? r.report_id,
    reportName: r.report_name,
    category: r.category,
    format: r.format,
    generatedAt: r.created_at,
    generatedBy: r.generated_by,
    sizeKb: r.size_kb,
  })).slice(0, 8);

  const lastGeneratedByReport: Record<string, string> = {};
  for (const r of rows ?? []) {
    const key = String(r.custom_report_id ?? r.report_id);
    if (!lastGeneratedByReport[key]) lastGeneratedByReport[key] = r.created_at;
  }

  const staticReports: Report[] = REPORT_CATALOG.map((r) => ({
    ...r,
    lastGenerated: lastGeneratedByReport[String(r.id)] ?? null,
  }));

  const customReports: Report[] = (customRows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? "Custom report built from your school's data.",
    category: "custom",
    formats: ["csv"],
    lastGenerated: lastGeneratedByReport[r.id] ?? null,
    isScheduled: r.is_scheduled ?? false,
    scheduleLabel: r.schedule_label ?? undefined,
    isCustom: true,
    builderDef: {
      entity: r.entity,
      columns: r.columns ?? [],
      filters: r.filters ?? [],
      groupBy: r.group_by,
      aggregate: r.aggregate,
      sortBy: r.sort_by,
      sortDir: r.sort_dir ?? "asc",
    },
  }));

  const reports: Report[] = [...staticReports, ...customReports];

  return <ReportsClient reports={reports} recentReports={recentReports} />;
}
