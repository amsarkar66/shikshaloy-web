"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Search, FileText } from "lucide-react";
import type { DocSearchEntry } from "@/lib/docs/search";

export function DocsSearch({ index }: { index: DocSearchEntry[] }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const results = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];
    return index
      .filter((e) => {
        const haystack = `${e.title} ${e.summary} ${e.roleLabel}`.toLowerCase();
        return words.every((w) => haystack.includes(w));
      })
      .slice(0, 8);
  }, [query, index]);

  return (
    <div ref={ref} className="relative mx-auto max-w-xl">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-zinc-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search guides — e.g. &ldquo;mark attendance&rdquo;, &ldquo;pay fees&rdquo;…"
          className="h-13 w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-4 text-sm text-zinc-900 shadow-lg shadow-zinc-200/50 outline-none placeholder:text-zinc-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
        />
      </div>

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-2 text-left shadow-xl shadow-zinc-200/60">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-zinc-400">
              No guides match &ldquo;{query}&rdquo;
            </p>
          ) : (
            results.map((r) => (
              <Link
                key={`${r.roleSlug}-${r.articleSlug}`}
                href={`/docs/${r.roleSlug}/${r.articleSlug}`}
                onClick={() => setOpen(false)}
                className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-zinc-50"
              >
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900">{r.title}</p>
                  <p className="truncate text-xs text-zinc-500">
                    {r.roleLabel} · {r.summary}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
