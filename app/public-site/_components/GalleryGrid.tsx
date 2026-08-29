"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X, Images } from "lucide-react";
import type { PublicSchool } from "@/lib/domains/public-site-data";
import { RevealStagger, RevealItem } from "./Reveal";

export function GalleryGrid({
  school,
  limit,
  bare,
}: {
  school: PublicSchool;
  limit?: number;
  bare?: boolean;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const items = limit ? school.gallery.slice(0, limit) : school.gallery;

  const body = (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Campus Gallery</h2>
        {limit && school.gallery.length > limit && (
          <Link
            href="/gallery"
            className="flex items-center gap-1 text-sm font-semibold text-primary-600 hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 py-12 text-gray-400">
          <Images className="h-6 w-6" />
          <p className="text-sm">Gallery photos coming soon.</p>
        </div>
      ) : (
        <RevealStagger className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((g, i) => (
            <RevealItem key={g.id}>
              <button
                onClick={() => setOpenIndex(i)}
                className="group relative aspect-square w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g.imageUrl}
                  alt={g.caption ?? "School gallery photo"}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {g.caption && (
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {g.caption}
                  </span>
                )}
              </button>
            </RevealItem>
          ))}
        </RevealStagger>
      )}

      <AnimatePresence>
        {openIndex !== null && items[openIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
            onClick={() => setOpenIndex(null)}
          >
            <button
              onClick={() => setOpenIndex(null)}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
            <motion.img
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              src={items[openIndex].imageUrl}
              alt={items[openIndex].caption ?? "School gallery photo"}
              className="max-h-full max-w-full rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  if (bare) return body;

  return (
    <section id="gallery" className="mx-auto max-w-5xl px-6 py-16">
      {body}
    </section>
  );
}
