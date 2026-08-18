"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import type { ReportCategory, ReportFormat } from "./_data/reports";
import { getReportData, type ReportTable } from "./report-data";
import { runCustomReportQuery } from "./report-builder-data";
import {
  BUILDER_ENTITIES,
  type EntityKey, type ReportFilter, type AggregateFn, type CustomReportDefinition,
} from "./_data/report-builder-fields";

function csvByteSize(table: ReportTable) {
  const text = [table.columns.join(","), ...table.rows.map((r) => r.join(","))].join("\n");
  return new TextEncoder().encode(text).length;
}

async function loadCustomReportDef(id: string, schoolId: string): Promise<CustomReportDefinition> {
  const { data } = await supabaseAdmin
    .from("custom_reports")
    .select("entity, columns, filters, group_by, aggregate, sort_by, sort_dir")
    .eq("id", id)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!data) throw new Error("Custom report not found");
  return {
    entity: data.entity as EntityKey,
    columns: (data.columns ?? []) as string[],
    filters: (data.filters ?? []) as ReportFilter[],
    groupBy: data.group_by,
    aggregate: data.aggregate,
    sortBy: data.sort_by,
    sortDir: (data.sort_dir ?? "asc") as "asc" | "desc",
  };
}

interface CustomReportInput {
  name: string;
  description?: string;
  entity: EntityKey;
  columns: string[];
  filters: ReportFilter[];
  groupBy?: string | null;
  aggregate?: { field: string; fn: AggregateFn } | null;
  sortBy?: string | null;
  sortDir?: "asc" | "desc";
  isScheduled?: boolean;
  scheduleLabel?: string;
}

function validateCustomReportInput(input: CustomReportInput) {
  if (!BUILDER_ENTITIES[input.entity]) throw new Error("Unknown report data source");
  if (!input.name.trim()) throw new Error("Name is required");
  if (input.columns.length === 0) throw new Error("Select at least one column");
}

export async function createCustomReport(input: CustomReportInput): Promise<{ id: string }> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  validateCustomReportInput(input);

  const { data, error } = await supabaseAdmin
    .from("custom_reports")
    .insert({
      school_id: schoolId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      entity: input.entity,
      columns: input.columns,
      filters: input.filters,
      group_by: input.groupBy || null,
      aggregate: input.aggregate || null,
      sort_by: input.sortBy || null,
      sort_dir: input.sortDir || "asc",
      is_scheduled: input.isScheduled ?? false,
      schedule_label: input.scheduleLabel || null,
      created_by: "Admin",
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create report");
  revalidatePath("/dashboard/reports");
  return { id: data.id };
}

export async function updateCustomReport(id: string, input: CustomReportInput): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  validateCustomReportInput(input);

  const { error } = await supabaseAdmin
    .from("custom_reports")
    .update({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      entity: input.entity,
      columns: input.columns,
      filters: input.filters,
      group_by: input.groupBy || null,
      aggregate: input.aggregate || null,
      sort_by: input.sortBy || null,
      sort_dir: input.sortDir || "asc",
      is_scheduled: input.isScheduled ?? false,
      schedule_label: input.scheduleLabel || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("school_id", schoolId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/reports");
}

export async function deleteCustomReport(id: string): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin.from("custom_reports").delete().eq("id", id).eq("school_id", schoolId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/reports");
}

export async function generateReport(input: {
  reportId: number | string;
  reportName: string;
  category: ReportCategory;
  format: ReportFormat;
  dateFrom: string;
  dateTo: string;
}): Promise<ReportTable> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const isCustom = typeof input.reportId === "string";

  const table = isCustom
    ? await runCustomReportQuery(await loadCustomReportDef(input.reportId as string, schoolId), input.dateFrom, input.dateTo, schoolId)
    : await getReportData(input.reportId as number, input.dateFrom, input.dateTo);

  const sizeKb = Math.max(1, Math.round(csvByteSize(table) / 1024));

  const { error } = await supabaseAdmin.from("report_generations").insert({
    school_id: schoolId,
    report_id: isCustom ? null : input.reportId,
    custom_report_id: isCustom ? input.reportId : null,
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
    .select("report_id, custom_report_id, report_name, date_from, date_to")
    .eq("id", recentReportId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!data) return null;

  const dateFrom = data.date_from ?? "2000-01-01";
  const dateTo = data.date_to ?? new Date().toISOString().slice(0, 10);

  const table = data.custom_report_id
    ? await runCustomReportQuery(await loadCustomReportDef(data.custom_report_id, schoolId), dateFrom, dateTo, schoolId)
    : await getReportData(data.report_id!, dateFrom, dateTo);

  return { table, reportName: data.report_name };
}
