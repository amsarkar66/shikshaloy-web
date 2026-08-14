"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import type { ReportCategory, ReportFormat } from "./_data/reports";
import { getReportData, type ReportTable } from "./report-data";

function csvByteSize(table: ReportTable) {
  const text = [table.columns.join(","), ...table.rows.map((r) => r.join(","))].join("\n");
  return new TextEncoder().encode(text).length;
}

export async function generateReport(input: {
  reportId: number;
  reportName: string;
  category: ReportCategory;
  format: ReportFormat;
  dateFrom: string;
  dateTo: string;
}): Promise<ReportTable> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const table = await getReportData(input.reportId, input.dateFrom, input.dateTo);
  const sizeKb = Math.max(1, Math.round(csvByteSize(table) / 1024));

  const { error } = await supabaseAdmin.from("report_generations").insert({
    school_id: schoolId,
    report_id: input.reportId,
    report_name: input.reportName,
    category: input.category,
    format: input.format,
    generated_by: "Admin",
    size_kb: sizeKb,
    date_from: input.dateFrom,
    date_to: input.dateTo,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/reports");
  return table;
}

export async function downloadRecentReport(recentReportId: string): Promise<{ table: ReportTable; reportName: string } | null> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data } = await supabaseAdmin
    .from("report_generations")
    .select("report_id, report_name, date_from, date_to")
    .eq("id", recentReportId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!data) return null;

  const table = await getReportData(
    data.report_id,
    data.date_from ?? "2000-01-01",
    data.date_to ?? new Date().toISOString().slice(0, 10)
  );
  return { table, reportName: data.report_name };
}
