import type { ReportTable } from "../report-data";

export async function downloadPdf(filename: string, { columns, rows }: ReportTable) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const doc = new jsPDF({
    orientation: columns.length > 6 ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  doc.setFontSize(13);
  doc.text(filename, 14, 15);

  autoTable(doc, {
    head: [columns],
    body: rows.map((r) => r.map((c) => String(c ?? ""))),
    startY: 20,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 10, right: 10 },
  });

  doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
