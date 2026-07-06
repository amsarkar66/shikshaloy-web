"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { uploadStudentPhoto } from "@/lib/students/photo-actions";

interface PhotoUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function PhotoUpload({ value, onChange }: PhotoUploadProps) {
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
      formData.append("photo", file);
      const url = await uploadStudentPhoto(formData);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="Photo" className="h-full w-full object-cover" />
        ) : (
          <Camera className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        )}
      </div>
      <div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {busy && <Loader2 className="h-3 w-3 animate-spin" />}
            {value ? "Change Photo" : "Upload Photo"}
          </button>
          {value && (
            <button type="button" onClick={() => onChange(null)} className="text-xs text-red-500 hover:underline">
              Remove
            </button>
          )}
        </div>
        <p className="mt-1 text-[11px] text-gray-400 dark:text-zinc-500">JPG, PNG or WebP, up to 2MB</p>
        {error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
      </div>
    </div>
  );
}
