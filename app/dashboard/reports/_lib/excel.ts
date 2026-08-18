import type { ReportTable } from "../report-data";

export async function downloadExcel(filename: string, { columns, rows }: ReportTable) {
  const XLSX = await import("xlsx");
  const worksheet = XLSX.utils.aoa_to_sheet([columns, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}
