"use client";

import { useRef, useState } from "react";
import { PenLine, Loader2, X } from "lucide-react";
import { uploadSchoolSignature } from "@/lib/schools/signature-actions";

interface SignatureUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function SignatureUpload({ value, onChange }: SignatureUploadProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("signature", file);
      const url = await uploadSchoolSignature(formData);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="flex items-stretch gap-4">
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleFile} />

      {/* Signature preview */}
      <div className="relative h-[60px] w-[120px] shrink-0">
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-zinc-100 border border-gray-100 dark:border-zinc-700">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Principal's signature" className="h-full w-full object-contain p-1" />
          ) : (
            <PenLine className="h-1/3 w-1/3 text-gray-300 dark:text-zinc-500" strokeWidth={1.5} />
          )}
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -right-2.5 -top-2.5 flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Dashed upload dropzone */}
      <div
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`flex h-[60px] flex-1 min-w-0 flex-col items-center justify-center gap-0.5 rounded-xl border border-dashed px-4 text-center cursor-pointer transition-colors ${
          dragActive
            ? "border-primary-400 bg-primary-50 dark:bg-primary-500/10"
            : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
        }`}
      >
        {busy ? (
          <Loader2 className="h-5 w-5 animate-spin text-gray-400 dark:text-zinc-500" />
        ) : (
          <>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              <span className="font-semibold text-primary-600 dark:text-primary-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500">PNG with a transparent background works best</p>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
