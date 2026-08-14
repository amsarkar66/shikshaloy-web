"use client";

import { useRef, useState, useTransition } from "react";
import { Images, Upload, Trash2, ChevronUp, ChevronDown, Loader2, ImageOff } from "lucide-react";
import { uploadGalleryImage, deleteGalleryImage, moveGalleryImage } from "../actions";
import { FancyButton } from "@/components/ui/fancy-button";

export interface GalleryImage {
  id: string;
  imageUrl: string;
  caption: string | null;
}

function UploadPanel() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Choose an image first");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("caption", caption);
      await uploadGalleryImage(formData);
      setCaption("");
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 space-y-3">
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900">
          {preview ? (
            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <ImageOff className="h-5 w-5 text-gray-300 dark:text-zinc-600" />
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="text-sm text-gray-600 dark:text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 dark:file:bg-primary-500/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary-600 dark:file:text-primary-400 hover:file:bg-primary-100"
        />
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (optional)"
          className="h-9 flex-1 min-w-[10rem] rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
        />
        <FancyButton
          onClick={handleUpload}
          disabled={busy}
          size="sm"
          className="shrink-0"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload
        </FancyButton>
      </div>
    </div>
  );
}

function GalleryTile({ image, isFirst, isLast }: { image: GalleryImage; isFirst: boolean; isLast: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleMove(direction: "up" | "down") {
    setError(null);
    startTransition(async () => {
      try {
        await moveGalleryImage(image.id, direction);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reorder");
      }
    });
  }

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteGalleryImage(image.id, image.imageUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete");
      }
    });
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50">
      <img src={image.imageUrl} alt={image.caption ?? "Gallery image"} className="aspect-[4/3] w-full object-cover" />
      <div className="absolute inset-0 flex flex-col justify-between bg-black/0 group-hover:bg-black/40 transition-colors">
        <div className="flex justify-end gap-1 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleMove("up")}
            disabled={pending || isFirst}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-gray-700 hover:bg-white disabled:opacity-40"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleMove("down")}
            disabled={pending || isLast}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-gray-700 hover:bg-white disabled:opacity-40"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={pending}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-red-600 hover:bg-white disabled:opacity-40"
          >
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </button>
        </div>
        {image.caption && (
          <p className="truncate bg-gradient-to-t from-black/60 to-transparent px-3 py-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
            {image.caption}
          </p>
        )}
      </div>
      {error && <p className="px-2 py-1 text-[10px] text-red-500">{error}</p>}
    </div>
  );
}

export default function GalleryClient({ initialData }: { initialData: GalleryImage[] }) {
  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Website Gallery</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Photos shown in the gallery on your public school website</p>
      </div>

      <UploadPanel />

      {initialData.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-20">
          <Images className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No photos uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {initialData.map((img, i) => (
            <GalleryTile key={img.id} image={img} isFirst={i === 0} isLast={i === initialData.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}
