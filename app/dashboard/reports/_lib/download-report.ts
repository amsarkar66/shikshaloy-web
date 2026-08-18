import type { ReportTable } from "../report-data";
import type { ReportFormat } from "../_data/reports";
import { downloadCsv } from "./csv";
import { downloadPdf } from "./pdf";
import { downloadExcel } from "./excel";

export async function downloadReportTable(filename: string, table: ReportTable, format: ReportFormat) {
  if (format === "pdf") return downloadPdf(filename, table);
  if (format === "excel") return downloadExcel(filename, table);
  return downloadCsv(filename, table);
}
