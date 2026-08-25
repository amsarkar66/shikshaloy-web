"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface SectionJumpNavItem {
  slug: string;
  title: string;
}

export function SectionJumpNav({ items }: { items: SectionJumpNavItem[] }) {
  const [activeSlug, setActiveSlug] = useState(items[0]?.slug);

  useEffect(() => {
    const sections = items
      .map((c) => document.getElementById(c.slug))
      .filter((el): el is HTMLElement => !!el);

    // A thin detection band just below the fixed navbar + sticky jump
    // nav — whichever section crosses it becomes "active".
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b
        );
        setActiveSlug(topMost.target.id);
      },
      { rootMargin: "-140px 0px -80% 0px", threshold: 0 }
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  return (
    <div className="sticky top-16 z-40 border-y border-zinc-100 bg-white/90 backdrop-blur">
      <div className="relative">
        <div className="mx-auto flex max-w-7xl justify-center gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
          {items.map((item) => (
            <a
              key={item.slug}
              href={`#${item.slug}`}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                activeSlug === item.slug
                  ? "border-primary-300 bg-primary-50 text-primary-700"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-primary-300 hover:text-primary-700"
              )}
            >
              {item.title}
            </a>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent" />
      </div>
    </div>
  );
}
