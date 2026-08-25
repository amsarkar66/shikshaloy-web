"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FadingDividerGridItem {
  id: string;
  icon: ReactNode;
  label: string;
  description: string;
}

// Column boundaries split each of the 3 vertical dividers into a segment per
// row, and row boundaries split each of the 2 horizontal dividers into a
// segment per column — so every segment fades transparent → solid → transparent
// on its own, instead of one long line only fading at the grid's outer edges.
const VERTICAL_DIVIDER_LEFT = ["left-1/4", "left-1/2", "left-3/4"];
const ROW_SPANS = [
  { top: "top-0", bottom: "bottom-2/3" },
  { top: "top-1/3", bottom: "bottom-1/3" },
  { top: "top-2/3", bottom: "bottom-0" },
];

const HORIZONTAL_DIVIDER_TOP = ["top-1/3", "top-2/3"];
const COLUMN_SPANS = [
  { left: "left-0", right: "right-3/4" },
  { left: "left-1/4", right: "right-1/2" },
  { left: "left-1/2", right: "right-1/4" },
  { left: "left-3/4", right: "right-0" },
];

function GridCell({
  item,
  isActive,
  onSelect,
}: {
  item: FadingDividerGridItem;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group flex h-full w-full items-center gap-3 px-5 py-4 text-left transition-colors duration-300",
        isActive ? "bg-primary-50" : "hover:bg-zinc-50"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm shadow-zinc-900/5 transition-colors [&_svg]:h-4 [&_svg]:w-4",
          isActive ? "bg-primary-600 text-white" : "bg-white text-primary-600"
        )}
      >
        {item.icon}
      </span>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-zinc-900">{item.label}</h3>
        <p className="mt-0.5 truncate text-xs text-zinc-500">{item.description}</p>
      </div>
    </button>
  );
}

/**
 * A 4-column x 3-row grid (12 items) for showcasing selectable options.
 * Below `lg` it falls back to plain hairline dividers; from `lg` up, each
 * divider segment fades transparent → solid → transparent on its own, with
 * square dots marking the 4-way intersections. One item can be marked
 * active/selected via `activeId` + `onSelect`.
 */
export function FadingDividerGrid({
  items,
  activeId,
  onSelect,
  className,
}: {
  items: FadingDividerGridItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      <div className="grid grid-cols-1 gap-px bg-zinc-100 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:bg-transparent">
        {items.map((item) => (
          <div key={item.id} className="bg-white">
            <GridCell item={item} isActive={item.id === activeId} onSelect={() => onSelect?.(item.id)} />
          </div>
        ))}
      </div>

      {/* Fading divider segments — each one fades transparent → solid → transparent on its own (desktop 4x3 grid) */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block">
        {VERTICAL_DIVIDER_LEFT.flatMap((left) =>
          ROW_SPANS.map(({ top, bottom }) => (
            <span
              key={`v-${left}-${top}`}
              className={cn("absolute w-px bg-gradient-to-b from-transparent via-zinc-200 to-transparent", left, top, bottom)}
            />
          ))
        )}
        {HORIZONTAL_DIVIDER_TOP.flatMap((top) =>
          COLUMN_SPANS.map(({ left, right }) => (
            <span
              key={`h-${top}-${left}`}
              className={cn("absolute h-px bg-gradient-to-r from-transparent via-zinc-200 to-transparent", top, left, right)}
            />
          ))
        )}

        {/* Square dots at every 4-way divider intersection */}
        {VERTICAL_DIVIDER_LEFT.flatMap((left) =>
          HORIZONTAL_DIVIDER_TOP.map((top) => (
            <span
              key={`dot-${left}-${top}`}
              className={cn(
                "absolute flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[3px] bg-white",
                left,
                top
              )}
            >
              <span className="h-1.5 w-1.5 rounded-[2px] bg-zinc-200" />
            </span>
          ))
        )}
      </div>
    </div>
  );
}
