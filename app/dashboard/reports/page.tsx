import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import ReportsClient from "./_components/ReportsClient";
import { REPORT_CATALOG } from "./_data/reports";
import type { Report, RecentReport } from "./_data/reports";

export default async function ReportsPage() {
  const { data: rows } = await supabaseAdmin
    .from("report_generations")
    .select("id, report_id, report_name, category, format, generated_by, size_kb, created_at")
    .eq("school_id", DEMO_SCHOOL_ID)
    .order("created_at", { ascending: false });

  const recentReports: RecentReport[] = ((rows ?? []) as any[]).map((r) => ({
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
  for (const r of (rows ?? []) as any[]) {
    if (!lastGeneratedByReport[r.report_id]) lastGeneratedByReport[r.report_id] = r.created_at;
  }

  const reports: Report[] = REPORT_CATALOG.map((r) => ({
    ...r,
    lastGenerated: lastGeneratedByReport[r.id] ?? null,
  }));

  return <ReportsClient reports={reports} recentReports={recentReports} />;
}
