"use client";

import { useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { uploadStudentPhoto } from "@/lib/students/photo-actions";

function AvatarPlaceholder() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/user-profile-icon.svg" alt="" className="h-full w-full" />;
}

interface PhotoUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function PhotoUpload({ value, onChange }: PhotoUploadProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
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
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />

      {/* Photo preview */}
      <div className="relative h-[60px] w-[60px] shrink-0">
        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Photo" className="h-full w-full object-cover" />
          ) : (
            <AvatarPlaceholder />
          )}
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute -right-[2px] -top-[2px] flex h-5 w-5 items-center justify-center rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
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
            <p className="text-[11px] text-gray-400 dark:text-zinc-500">JPG, PNG or WebP (max. 2MB)</p>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
