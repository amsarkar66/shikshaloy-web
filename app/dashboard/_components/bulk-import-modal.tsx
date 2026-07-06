"use client";

import { useRef, useState } from "react";
import { Upload, Download, X, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";

export interface ImportColumn {
  key: string;
  label: string;
  required?: boolean;
}

interface BulkImportModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  columns: ImportColumn[];
  onImport: (rows: Record<string, string>[]) => void;
}

function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")));
}

export function BulkImportModal({ open, onClose, title, columns, onImport }: BulkImportModalProps) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const rows = raw ? parseCsv(raw) : [];
  const [header, ...body] = rows;
  const preview = body.slice(0, 5);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const csv = columns.map((c) => c.label).join(",") + "\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleClose() {
    setRaw("");
    setError("");
    onClose();
  }

  function handleImport() {
    if (!header || body.length === 0) {
      setError("No rows to import.");
      return;
    }
    const missing = columns.filter(
      (c) => c.required && !header.some((h) => h.toLowerCase() === c.label.toLowerCase())
    );
    if (missing.length > 0) {
      setError(`Missing required column(s): ${missing.map((m) => m.label).join(", ")}`);
      return;
    }
    const mapped = body.map((cells) => {
      const record: Record<string, string> = {};
      columns.forEach((c) => {
        const idx = header.findIndex((h) => h.toLowerCase() === c.label.toLowerCase());
        record[c.key] = idx >= 0 ? cells[idx] ?? "" : "";
      });
      return record;
    });
    onImport(mapped);
    handleClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Bulk Import — {title}</p>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5 space-y-4">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <Download className="h-3.5 w-3.5" /> Download CSV template
          </button>

          <div
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-700 p-6 text-center cursor-pointer hover:border-indigo-400 transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-6 w-6 text-gray-400 dark:text-zinc-500" />
            <p className="text-sm text-gray-600 dark:text-zinc-400">Click to upload a .csv file</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>

          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder={`Or paste CSV rows here, e.g.\n${columns.map((c) => c.label).join(",")}\n...`}
            rows={4}
            className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-xs font-mono text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          />

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {preview.length > 0 && (
            <div className="rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
              <div className="flex items-center gap-1.5 border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-3 py-2 text-xs font-medium text-gray-600 dark:text-zinc-400">
                <FileSpreadsheet className="h-3.5 w-3.5" /> Preview — {body.length} row{body.length === 1 ? "" : "s"} detected
              </div>
              <div className="max-h-40 overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gray-400 dark:text-zinc-500">
                      {header?.map((h, i) => (
                        <th key={i} className="px-3 py-1.5 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {preview.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-1.5 text-gray-600 dark:text-zinc-400">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button
            onClick={handleClose}
            className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={body.length === 0}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 px-4 text-sm font-medium text-white transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            Import{body.length > 0 ? ` ${body.length} row${body.length === 1 ? "" : "s"}` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
