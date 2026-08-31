"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, Loader2, CheckCircle2, ImageIcon } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function GalleryUploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pickFile(f: File | null) {
    setError(null);
    setDone(false);
    if (!f) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!ACCEPTED.includes(f.type)) {
      setError("Only JPEG, PNG or WEBP images are supported.");
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("File is too large — max 5 MB.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    pickFile(e.dataTransfer.files?.[0] ?? null);
  }

  function removeFile() {
    setFile(null);
    setPreview(null);
    setDone(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleUpload() {
    if (!file) {
      setError("Choose a photo first.");
      return;
    }
    setBusy(true);
    setProgress(0);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);
    formData.append("caption", caption);

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setBusy(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        setProgress(100);
        setDone(true);
        onUploaded();
        setTimeout(onClose, 500);
      } else {
        const message = (() => {
          try {
            return JSON.parse(xhr.responseText)?.error as string | undefined;
          } catch {
            return undefined;
          }
        })();
        setError(message ?? "Failed to upload image");
      }
    };
    xhr.onerror = () => {
      setBusy(false);
      setError("Failed to upload image");
    };
    xhr.open("POST", "/api/gallery/upload");
    xhr.send(formData);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-gray-100 dark:border-zinc-800 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
            <UploadCloud className="h-4.5 w-4.5 text-gray-600 dark:text-zinc-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Upload Photo</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Select and upload a photo for the gallery</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex flex-col items-center gap-1.5 rounded-xl border border-dashed px-4 py-8 text-center transition-colors ${
              dragOver ? "border-primary-400 bg-primary-50/50 dark:bg-primary-500/5" : "border-gray-200 dark:border-zinc-700"
            }`}
          >
            <UploadCloud className="h-6 w-6 text-gray-400 dark:text-zinc-500" />
            <p className="mt-2 text-sm font-medium text-gray-800 dark:text-zinc-200">Choose a file or drag &amp; drop it here</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">JPEG, PNG or WEBP, up to 5 MB.</p>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED.join(",")}
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-3 h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            >
              Browse File
            </button>
          </div>

          {file && (
            <div className="rounded-xl border border-gray-200 dark:border-zinc-700 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-zinc-800">
                  {preview ? (
                    <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">{file.name}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-zinc-500">
                    <span>{formatSize(file.size)}</span>
                    <span>·</span>
                    {done ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3 w-3" /> Completed</span>
                    ) : busy ? (
                      <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400"><Loader2 className="h-3 w-3 animate-spin" /> Uploading… {progress}%</span>
                    ) : (
                      <span>Ready to upload</span>
                    )}
                  </div>
                </div>
                {!busy && !done && (
                  <button onClick={removeFile} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {(busy || done) && (
                <div className="mt-2.5 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-800 overflow-hidden">
                  <div className="h-1.5 rounded-full bg-primary-500 transition-[width]" style={{ width: `${done ? 100 : progress}%` }} />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Caption (optional)</label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Annual Day 2025"
              className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-zinc-800 px-5 py-4">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
            Cancel
          </button>
          <FancyButton onClick={handleUpload} disabled={busy || !file} size="sm">
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Upload
          </FancyButton>
        </div>
      </div>
    </div>
  );
}
