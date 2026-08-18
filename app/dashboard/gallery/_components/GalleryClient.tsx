"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Images, Upload, Trash2, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { deleteGalleryImage, moveGalleryImage } from "../actions";
import { FancyButton } from "@/components/ui/fancy-button";
import { UploadModal } from "./UploadModal";

export interface GalleryImage {
  id: string;
  imageUrl: string;
  caption: string | null;
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
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Website Gallery</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Manage photos shown on the public site</p>
        </div>
        <div className="sm:ml-auto">
          <FancyButton onClick={() => setUploadOpen(true)} size="sm"><Upload className="h-4 w-4" /> Upload</FancyButton>
        </div>
      </div>

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

      {uploadOpen && (
        <UploadModal onClose={() => setUploadOpen(false)} onUploaded={() => router.refresh()} />
      )}
    </div>
  );
}
