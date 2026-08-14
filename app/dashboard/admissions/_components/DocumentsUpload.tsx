"use client";

import { useRef, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { uploadAdmissionDocument } from "@/lib/admissions/document-actions";

export interface DocEntry {
  category: string;
  fileUrl: string;
  fileName: string;
}

export const DOCUMENT_CATEGORIES = [
  "Birth Certificate",
  "Transfer Certificate",
  "Report Card (Last Year)",
  "Passport Photo",
];

function DocumentSlot({
  category, value, onChange,
}: {
  category: string;
  value: DocEntry | null;
  onChange: (v: DocEntry | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("document", file);
      const { fileUrl, fileName } = await uploadAdmissionDocument(formData);
      onChange({ category, fileUrl, fileName });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500">
        <FileText className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{category}</p>
        {value ? (
          <a href={value.fileUrl} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
            {value.fileName}
          </a>
        ) : (
          <p className="text-xs text-gray-400 dark:text-zinc-500">Not uploaded</p>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
      <input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
      {value ? (
        <button type="button" onClick={() => onChange(null)} className="shrink-0 text-xs text-red-500 hover:underline">
          Remove
        </button>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {busy && <Loader2 className="h-3 w-3 animate-spin" />}
          Upload
        </button>
      )}
    </div>
  );
}

export function DocumentsUpload({ documents, onChange }: { documents: DocEntry[]; onChange: (docs: DocEntry[]) => void }) {
  function setDoc(category: string, entry: DocEntry | null) {
    const rest = documents.filter((d) => d.category !== category);
    onChange(entry ? [...rest, entry] : rest);
  }

  return (
    <div className="space-y-2">
      {DOCUMENT_CATEGORIES.map((cat) => (
        <DocumentSlot
          key={cat}
          category={cat}
          value={documents.find((d) => d.category === cat) ?? null}
          onChange={(v) => setDoc(cat, v)}
        />
      ))}
    </div>
  );
}
