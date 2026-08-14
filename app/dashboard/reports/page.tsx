import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getParentContext } from "@/lib/parents/context";
import ReportsClient from "./_components/ReportsClient";
import { REPORT_CATALOG } from "./_data/reports";
import type { Report, RecentReport } from "./_data/reports";
import ParentReportsClient, { type ChildReportData, type ChildExamGroup, type ChildCertificate } from "./_components/ParentReportsClient";
import type { CertType } from "../certificates/_data/certificates";

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
    return <ParentReportsClient childrenData={[]} />;
  }

  const childIds = parent.children.map((c) => c.id);

  const [{ data: examRows }, { data: certRows }] = await Promise.all([
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

  return <ParentReportsClient childrenData={childrenData} />;
}

export default async function ReportsPage() {
  const { data: { user } } = await getUser();
  const role = user?.user_metadata?.role as string | undefined;

  if (role === "parent" && user) {
    return <ParentReports userId={user.id} />;
  }

  const schoolId = await getCurrentSchoolIdOrThrow();

  const { data: rows } = await supabaseAdmin
    .from("report_generations")
    .select("id, report_id, report_name, category, format, generated_by, size_kb, created_at")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });

  const recentReports: RecentReport[] = (rows ?? []).map((r) => ({
    id: r.id,
    reportId: r.report_id,
    reportName: r.report_name,
    category: r.category,
    format: r.format,
    generatedAt: r.created_at,
    generatedBy: r.generated_by,
    sizeKb: r.size_kb,
  })).slice(0, 8);

  const lastGeneratedByReport: Record<number, string> = {};
  for (const r of rows ?? []) {
    if (!lastGeneratedByReport[r.report_id]) lastGeneratedByReport[r.report_id] = r.created_at;
  }

  const reports: Report[] = REPORT_CATALOG.map((r) => ({
    ...r,
    lastGenerated: lastGeneratedByReport[r.id] ?? null,
  }));

  return <ReportsClient reports={reports} recentReports={recentReports} />;
}
