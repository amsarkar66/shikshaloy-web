"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import type { ReportCategory, ReportFormat } from "./_data/reports";

export async function generateReport(input: {
  reportId: number;
  reportName: string;
  category: ReportCategory;
  format: ReportFormat;
}) {
  const sizeKb = 40 + Math.floor(Math.random() * 200);
  const { error } = await supabaseAdmin.from("report_generations").insert({
    school_id: DEMO_SCHOOL_ID,
    report_id: input.reportId,
    report_name: input.reportName,
    category: input.category,
    format: input.format,
    generated_by: "Admin",
    size_kb: sizeKb,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/reports");
}
