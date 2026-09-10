"use client";

import { useRef, useState } from "react";
import { Upload, Download, X, FileSpreadsheet, CheckCircle2, AlertTriangle } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";

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
  onImport: (rows: Record<string, string>[]) => void | Promise<void>;
}

// A plain split(",") misaligns columns once any field itself contains a
// comma (e.g. "English, Hindi", or an address) — walk the line respecting
// quoted fields ("a, b" and "" as an escaped quote) instead.
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cell += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += ch;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function parseCsv(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map(parseCsvLine);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function BulkImportModal({ open, onClose, title, columns, onImport }: BulkImportModalProps) {
  const [raw, setRaw] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const rows = raw ? parseCsv(raw) : [];
  const [header, ...body] = rows;
  const preview = body.slice(0, 5);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    if (!picked) return;
    setFile(picked);
    setError("");
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result ?? ""));
    reader.readAsText(picked);
  }

  function removeFile(e: React.MouseEvent) {
    e.stopPropagation();
    setFile(null);
    setRaw("");
    if (fileRef.current) fileRef.current.value = "";
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
    setFile(null);
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
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Import {title}</p>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5 space-y-4">
          <div
            className={`rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 p-6 cursor-pointer hover:border-primary-400 transition-colors ${
              file ? "text-left" : "flex flex-col items-center justify-center gap-2 text-center"
            }`}
            onClick={() => fileRef.current?.click()}
          >
            {file ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-zinc-200">{file.name}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">
                    {formatFileSize(file.size)} · {body.length} row{body.length === 1 ? "" : "s"} detected
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  title="Remove file"
                  className="shrink-0 rounded-lg p-1.5 text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="h-6 w-6 text-gray-400 dark:text-zinc-500" />
                <p className="text-sm text-gray-600 dark:text-zinc-400">Click to upload a .csv file</p>
              </>
            )}
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </div>

          {!file && (
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              <Download className="h-3.5 w-3.5" /> Download CSV template
            </button>
          )}

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
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="divide-x divide-gray-200 dark:divide-zinc-700 border-b border-gray-200 dark:border-zinc-700 text-left text-gray-400 dark:text-zinc-500">
                      {header?.map((h, i) => (
                        <th key={i} className="max-w-[160px] truncate whitespace-nowrap px-3 py-1.5 font-medium" title={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {preview.map((row, i) => (
                      <tr key={i} className="divide-x divide-gray-100 dark:divide-zinc-800">
                        {row.map((cell, j) => (
                          <td key={j} className="max-w-[160px] truncate whitespace-nowrap px-3 py-1.5 text-gray-600 dark:text-zinc-400" title={cell}>{cell}</td>
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
          <FancyButton
            onClick={handleImport}
            disabled={body.length === 0}
            size="sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            Import{body.length > 0 ? ` ${body.length} row${body.length === 1 ? "" : "s"}` : ""}
          </FancyButton>
        </div>
      </div>
    </div>
  );
}
