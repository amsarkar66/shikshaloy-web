"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FadeIn } from "@/components/ui/fade-in";

export type ChangeType = "feat" | "fix" | "improve" | "docs";

export interface ChangelogEntryLine {
  type: ChangeType;
  text: string;
}

export interface ChangelogRelease {
  version: string;
  hash: string;
  date: string;
  entries: ChangelogEntryLine[];
}

const TYPE_META: Record<ChangeType, { glyph: string; className: string; label: string }> = {
  feat: { glyph: "+", className: "text-emerald-400", label: "feat" },
  fix: { glyph: "~", className: "text-amber-400", label: "fix" },
  improve: { glyph: "*", className: "text-sky-400", label: "improve" },
  docs: { glyph: "#", className: "text-zinc-500", label: "docs" },
};

interface Segment {
  text: string;
  className: string;
}

interface TypedLine {
  segments: Segment[];
  speed: number;
  pause: number;
}

const PROMPT_SPEED = 20;
const META_SPEED = 9;
const ENTRY_SPEED = 7;

function releaseToLines(release: ChangelogRelease): TypedLine[] {
  const lines: TypedLine[] = [
    {
      segments: [
        { text: "$ ", className: "text-emerald-500 font-semibold" },
        { text: "git show ", className: "text-zinc-600" },
        { text: `v${release.version}`, className: "text-emerald-400 font-semibold" },
      ],
      speed: PROMPT_SPEED,
      pause: 80,
    },
    {
      segments: [
        { text: "  commit ", className: "text-zinc-700" },
        { text: release.hash, className: "text-zinc-500" },
        { text: " · ", className: "text-zinc-700" },
        { text: release.date, className: "text-zinc-600" },
      ],
      speed: META_SPEED,
      pause: 140,
    },
    ...release.entries.map((entry): TypedLine => {
      const meta = TYPE_META[entry.type];
      return {
        segments: [
          { text: `${meta.glyph}  `, className: `${meta.className} font-semibold` },
          { text: meta.label.padEnd(8, " "), className: "text-zinc-600" },
          { text: entry.text, className: "text-zinc-300" },
        ],
        speed: ENTRY_SPEED,
        pause: 90,
      };
    }),
  ];
  // Extra breathing room before the next release's prompt starts typing.
  lines[lines.length - 1] = { ...lines[lines.length - 1], pause: lines[lines.length - 1].pause + 260 };
  return lines;
}

function lineText(line: TypedLine): string {
  return line.segments.map((s) => s.text).join("");
}

function RenderSegments({
  segments,
  revealCount,
  showCursor,
}: {
  segments: Segment[];
  revealCount: number;
  showCursor: boolean;
}) {
  let offset = 0;
  return (
    <span className="whitespace-pre">
      {segments.map((seg, i) => {
        const start = offset;
        offset += seg.text.length;
        const visible = Math.max(0, Math.min(seg.text.length, revealCount - start));
        return (
          <span key={i} className={seg.className}>
            {seg.text.slice(0, visible)}
          </span>
        );
      })}
      {showCursor && (
        <span className="ml-px inline-block h-[1em] w-[6px] translate-y-[2px] bg-emerald-400 animate-blink align-text-bottom" />
      )}
    </span>
  );
}

function StaticFallback({ releases }: { releases: ChangelogRelease[] }) {
  // Full content, always in the DOM, for screen readers and crawlers — the
  // typewriter view above is purely decorative and marked aria-hidden.
  return (
    <div className="sr-only">
      <h2>Changelog</h2>
      {releases.map((release) => (
        <section key={release.version}>
          <h3>
            v{release.version} — {release.date} ({release.hash})
          </h3>
          <ul>
            {release.entries.map((entry, i) => (
              <li key={i}>
                {TYPE_META[entry.type].label}: {entry.text}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function ChangelogTerminal({ releases }: { releases: ChangelogRelease[] }) {
  const releaseGroups = useMemo(
    () => releases.map((release) => ({ release, lines: releaseToLines(release) })),
    [releases]
  );
  const flatLines = useMemo(
    () => releaseGroups.flatMap((g) => g.lines),
    [releaseGroups]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [started, setStarted] = useState(false);
  const [lineIndex, setLineIndex] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const done = lineIndex >= flatLines.length;

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setLineIndex(flatLines.length);
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [flatLines.length]);

  useEffect(() => {
    if (!started || done) return;
    const current = flatLines[lineIndex];
    const full = lineText(current);
    if (charCount < full.length) {
      timeoutRef.current = setTimeout(() => setCharCount((c) => c + 1), current.speed);
    } else {
      timeoutRef.current = setTimeout(() => {
        setLineIndex((i) => i + 1);
        setCharCount(0);
      }, current.pause);
    }
    return () => clearTimeout(timeoutRef.current);
  }, [started, done, lineIndex, charCount, flatLines]);

  function skip() {
    clearTimeout(timeoutRef.current);
    setCharCount(0);
    setLineIndex(flatLines.length);
  }

  let globalIdx = 0;

  return (
    <FadeIn className="mx-auto max-w-3xl">
      <StaticFallback releases={releases} />
      <div
        ref={containerRef}
        aria-hidden="true"
        onClick={done ? undefined : skip}
        className={`overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-zinc-900/30 ring-1 ring-white/5 ${
          done ? "" : "cursor-pointer"
        }`}
      >
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-white/10 bg-zinc-900/60 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-amber-400/80" />
            <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-2 font-mono text-xs text-zinc-500">shikshaloy — changelog.log</span>
          {done ? (
            <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-zinc-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-blink" />
              live
            </span>
          ) : (
            <span className="ml-auto font-mono text-[11px] text-zinc-700">click to skip ⏭</span>
          )}
        </div>

        {/* Body */}
        <div className="overflow-x-auto px-5 py-6 font-mono text-[13px] leading-relaxed sm:px-8 sm:py-8 sm:text-sm">
          <div className="space-y-8">
            {releaseGroups.map((group) => {
              const groupStart = globalIdx;
              globalIdx += group.lines.length;
              const visibleCount = Math.min(group.lines.length, Math.max(0, lineIndex - groupStart + 1));
              if (visibleCount === 0) return null;

              const headLines = group.lines.slice(0, 2);
              const entryLines = group.lines.slice(2);

              return (
                <div key={group.release.version}>
                  {headLines.map((line, li) => {
                    if (li >= visibleCount) return null;
                    const globalLineIdx = groupStart + li;
                    const revealCount = globalLineIdx < lineIndex ? Infinity : charCount;
                    return (
                      <div key={li}>
                        <RenderSegments
                          segments={line.segments}
                          revealCount={revealCount}
                          showCursor={globalLineIdx === lineIndex && !done}
                        />
                      </div>
                    );
                  })}

                  {visibleCount > 2 && (
                    <ul className="mt-2.5 ml-4 space-y-1.5 border-l border-zinc-800 pl-4">
                      {entryLines.map((line, li) => {
                        const localIdx = 2 + li;
                        if (localIdx >= visibleCount) return null;
                        const globalLineIdx = groupStart + localIdx;
                        const revealCount = globalLineIdx < lineIndex ? Infinity : charCount;
                        return (
                          <li key={li}>
                            <RenderSegments
                              segments={line.segments}
                              revealCount={revealCount}
                              showCursor={globalLineIdx === lineIndex && !done}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {done && (
            <div className="mt-8 flex items-center gap-2 border-t border-zinc-800 pt-6">
              <span className="text-emerald-500">$</span>
              <span className="h-4 w-2 bg-emerald-500/80 animate-blink" />
            </div>
          )}
        </div>
      </div>
    </FadeIn>
  );
}
