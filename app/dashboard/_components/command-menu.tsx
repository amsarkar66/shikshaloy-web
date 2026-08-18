"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  ArrowUp,
  ArrowDown,
  CornerDownLeft,
  Settings,
  CreditCard,
  LifeBuoy,
  Clock,
  Loader2,
  GraduationCap,
  Briefcase,
  Users2,
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { getNavGroupsForRole, type NavItem } from "../_lib/nav-data";
import { useIsMac } from "../_lib/use-is-mac";
import { searchDirectory } from "../_lib/directory-search";

type Entry = { label: string; href: string; icon: React.ElementType; group: string; sublabel?: string };

const RECENTS_LIMIT = 5;
const DIRECTORY_SEARCH_MIN_CHARS = 2;
const DIRECTORY_SEARCH_DEBOUNCE_MS = 250;

const DIRECTORY_GROUP_ICON: Record<string, React.ElementType> = {
  Students: GraduationCap,
  Staff: Briefcase,
  Parents: Users2,
};

// Directory picks (students/staff/parents) aren't in the static nav list, so
// a bare href isn't enough to redisplay them next time the menu opens —
// label/group/sublabel are persisted alongside it. Nav/account picks are
// re-resolved against the live entry list instead (see `recents` below), so
// their label/icon always reflect the current nav, not a stale snapshot.
interface RecentEntry {
  href: string;
  label: string;
  group: string;
  sublabel?: string;
}

function recentsKey(userId: string) {
  return `shikshaloy:cmdk-recents:${userId}`;
}

function readRecents(userId: string): RecentEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(recentsKey(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is RecentEntry =>
        !!item && typeof item === "object" && typeof item.href === "string" && typeof item.label === "string"
    );
  } catch {
    return [];
  }
}

function writeRecents(userId: string, items: RecentEntry[]) {
  try {
    window.localStorage.setItem(recentsKey(userId), JSON.stringify(items.slice(0, RECENTS_LIMIT)));
  } catch {
    // ignore storage failures (private mode, quota, etc.)
  }
}

export function CommandMenu({
  role, user, open, onOpenChange,
}: {
  role: string;
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const isMac = useIsMac();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
  const [directoryResults, setDirectoryResults] = useState<Entry[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const directoryRequestId = useRef(0);

  const staffTemplateId = user.user_metadata?.staff_template_id as string | undefined;

  const entries = useMemo<Entry[]>(() => {
    const navGroups = getNavGroupsForRole(role, staffTemplateId);
    const navEntries: Entry[] = navGroups.flatMap((g) =>
      g.items
        .filter((item): item is NavItem => item.badge !== "soon")
        .map((item) => ({ label: item.label, href: item.href, icon: item.icon, group: g.group ?? "Navigation" }))
    );
    const accountEntries: Entry[] = [
      { label: "Settings", href: "/dashboard/settings", icon: Settings, group: "Account" },
      { label: "Billing & Subscription", href: "/dashboard/billing", icon: CreditCard, group: "Account" },
    ];
    // Avoid duplicating links already surfaced by the role's own nav (e.g. kernel/super_admin already list Settings).
    const seen = new Set(navEntries.map((e) => e.href));
    return [...navEntries, ...accountEntries.filter((e) => !seen.has(e.href))];
  }, [role, staffTemplateId]);

  const entriesByHref = useMemo(() => new Map(entries.map((e) => [e.href, e])), [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) => e.label.toLowerCase().includes(q) || e.group.toLowerCase().includes(q)
    );
  }, [entries, query]);

  const recents = useMemo(() => {
    if (query.trim()) return [];
    return recentEntries.map((r): Entry => {
      // Prefer the live nav/account entry (fresher label/icon) when the href
      // still matches one; directory picks fall back to their persisted data.
      const live = entriesByHref.get(r.href);
      if (live) return live;
      return {
        label: r.label,
        href: r.href,
        group: r.group,
        sublabel: r.sublabel,
        icon: DIRECTORY_GROUP_ICON[r.group] ?? Search,
      };
    });
  }, [recentEntries, entriesByHref, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const entry of filtered) {
      const list = map.get(entry.group) ?? [];
      list.push(entry);
      map.set(entry.group, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const directoryGrouped = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const entry of directoryResults) {
      const list = map.get(entry.group) ?? [];
      list.push(entry);
      map.set(entry.group, list);
    }
    return Array.from(map.entries());
  }, [directoryResults]);

  // Flat, ordered list matching on-screen order: recents, then nav matches, then record matches.
  const flatVisible = useMemo(
    () => [...recents, ...filtered, ...directoryResults],
    [recents, filtered, directoryResults]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (open) {
      setRecentEntries(readRecents(user.id));
      setQuery("");
      setDirectoryResults([]);
      setDirectoryLoading(false);
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [open, user.id]);

  // Records (students/staff/parents) live in Supabase, not the static nav
  // list, so they're fetched on a short debounce once the query is long
  // enough to be worth a round-trip. A request-id guard drops stale
  // responses if the user keeps typing before an earlier lookup returns.
  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < DIRECTORY_SEARCH_MIN_CHARS) {
      setDirectoryResults([]);
      setDirectoryLoading(false);
      return;
    }
    setDirectoryLoading(true);
    const requestId = ++directoryRequestId.current;
    const timer = window.setTimeout(() => {
      searchDirectory(q)
        .then((results) => {
          if (directoryRequestId.current !== requestId) return;
          setDirectoryResults(
            results.map((r) => ({
              label: r.label,
              sublabel: r.sublabel,
              href: r.href,
              icon: DIRECTORY_GROUP_ICON[r.group],
              group: r.group,
            }))
          );
        })
        .catch(() => {
          if (directoryRequestId.current === requestId) setDirectoryResults([]);
        })
        .finally(() => {
          if (directoryRequestId.current === requestId) setDirectoryLoading(false);
        });
    }, DIRECTORY_SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query, open]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const modifierPressed = isMac ? e.metaKey : e.ctrlKey;
      if (modifierPressed && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === "Escape" && open) {
        e.preventDefault();
        onOpenChange(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange, isMac]);

  const navigateTo = useCallback(
    (entry: Entry) => {
      const recentEntry: RecentEntry = { href: entry.href, label: entry.label, group: entry.group, sublabel: entry.sublabel };
      const next = [recentEntry, ...recentEntries.filter((r) => r.href !== entry.href)].slice(0, RECENTS_LIMIT);
      writeRecents(user.id, next);
      onOpenChange(false);
      router.push(entry.href);
    },
    [recentEntries, router, user.id, onOpenChange]
  );

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  if (!open) return null;

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatVisible.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const entry = flatVisible[activeIndex];
      if (entry) navigateTo(entry);
    }
  }

  let runningIndex = recents.length;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 backdrop-blur-sm px-4 pt-[12vh]"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
      >
        {/* Search row */}
        <div className="flex items-center gap-2.5 border-b border-gray-100 dark:border-zinc-800 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-gray-400 dark:text-zinc-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKeyDown}
            placeholder="Search or jump to…"
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-zinc-50 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none"
          />
          <span className="hidden sm:flex h-5 items-center rounded-md border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900 px-1.5 text-[10px] font-medium text-gray-400 dark:text-zinc-500">
            ESC
          </span>
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-700 dark:hover:text-zinc-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto px-2 pt-2 pb-2">
          {recents.length > 0 && (
            <div className="mb-2">
              <p className="flex items-center gap-1 px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-600">
                <Clock className="h-3 w-3" /> Recent
              </p>
              {recents.map((entry, i) => (
                <ResultRow
                  key={`recent-${entry.href}`}
                  entry={entry}
                  index={i}
                  active={i === activeIndex}
                  onHover={() => setActiveIndex(i)}
                  onSelect={() => navigateTo(entry)}
                />
              ))}
            </div>
          )}

          {grouped.length === 0 && directoryGrouped.length === 0 && !directoryLoading ? (
            <div className="px-3 py-8 text-center text-sm text-gray-400 dark:text-zinc-500">
              No results for &ldquo;{query}&rdquo;. Try the{" "}
              <a href="/dashboard/help" className="text-primary-500 hover:underline">
                Help Center
              </a>
              .
            </div>
          ) : (
            <>
              {grouped.map(([group, items]) => {
                const startIndex = runningIndex;
                runningIndex += items.length;
                return (
                  <div key={group} className="mb-2">
                    <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-600">
                      {group}
                    </p>
                    {items.map((entry, i) => {
                      const index = startIndex + i;
                      return (
                        <ResultRow
                          key={entry.href}
                          entry={entry}
                          index={index}
                          active={index === activeIndex}
                          onHover={() => setActiveIndex(index)}
                          onSelect={() => navigateTo(entry)}
                        />
                      );
                    })}
                  </div>
                );
              })}

              {directoryGrouped.map(([group, items]) => {
                const startIndex = runningIndex;
                runningIndex += items.length;
                return (
                  <div key={group} className="mb-2">
                    <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-600">
                      {group}
                    </p>
                    {items.map((entry, i) => {
                      const index = startIndex + i;
                      return (
                        <ResultRow
                          key={entry.href}
                          entry={entry}
                          index={index}
                          active={index === activeIndex}
                          onHover={() => setActiveIndex(index)}
                          onSelect={() => navigateTo(entry)}
                        />
                      );
                    })}
                  </div>
                );
              })}

              {directoryLoading && (
                <p className="flex items-center gap-1.5 px-2.5 py-2 text-xs text-gray-400 dark:text-zinc-500">
                  <Loader2 className="h-3 w-3 animate-spin" /> Searching records…
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-zinc-800 px-4 py-2.5 text-[11px] text-gray-400 dark:text-zinc-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              <ArrowDown className="h-3 w-3" />
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" />
              Select
            </span>
          </div>
          <a
            href="/dashboard/help"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-zinc-200"
          >
            <LifeBuoy className="h-3 w-3" />
            Help Center
          </a>
        </div>
      </div>
    </div>
  );
}

function ResultRow({
  entry, index, active, onHover, onSelect,
}: {
  entry: Entry;
  index: number;
  active: boolean;
  onHover: () => void;
  onSelect: () => void;
}) {
  const Icon = entry.icon;
  return (
    <button
      data-index={index}
      onMouseEnter={onHover}
      onClick={onSelect}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
        active
          ? "bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400"
          : "text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800/60"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate font-medium">{entry.label}</span>
      {entry.sublabel && (
        <span className="shrink-0 truncate text-xs text-gray-400 dark:text-zinc-500">{entry.sublabel}</span>
      )}
    </button>
  );
}
