"use client";

import { useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { addSchoolBanner, removeSchoolBanner, moveSchoolBanner, type SchoolBanner } from "@/lib/schools/banner-actions";

export function BannerManager({ initialBanners }: { initialBanners: SchoolBanner[] }) {
  const [banners, setBanners] = useState(initialBanners);
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
      formData.append("banner", file);
      const banner = await addSchoolBanner(formData);
      setBanners((prev) => [...prev, banner]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove(id: string) {
    setBanners((prev) => prev.filter((b) => b.id !== id));
    try {
      await removeSchoolBanner(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove banner");
    }
  }

  async function handleMove(id: string, direction: "up" | "down") {
    const index = banners.findIndex((b) => b.id === id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= banners.length) return;

    const next = [...banners];
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    setBanners(next);
    try {
      await moveSchoolBanner(id, direction);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder");
    }
  }

  return (
    <div>
      {banners.length === 0 ? (
        <div className="flex h-32 w-full items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-300 dark:text-zinc-600">
          <ImageIcon className="h-8 w-8" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {banners.map((b, i) => (
            <div key={b.id} className="group relative overflow-hidden rounded-lg border border-gray-200 dark:border-zinc-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.imageUrl} alt="" className="h-24 w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => handleMove(b.id, "up")}
                  disabled={i === 0}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-gray-700 disabled:opacity-40"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(b.id, "down")}
                  disabled={i === banners.length - 1}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-gray-700 disabled:opacity-40"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(b.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Add Banner Image
        </button>
      </div>
      <p className="mt-1 text-[11px] text-gray-400 dark:text-zinc-500">
        Rotates through as a slideshow on your public website homepage. Landscape, up to 2MB each.
      </p>
      {error && <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}
