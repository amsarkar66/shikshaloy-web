export interface GradeBand {
  id: string;
  label: string;
  minPercent: number;
}

/** Used when a school hasn't configured its own scale yet. */
export const DEFAULT_GRADE_BANDS: GradeBand[] = [
  { id: "default-a-plus", label: "A+", minPercent: 90 },
  { id: "default-a",      label: "A",  minPercent: 80 },
  { id: "default-b-plus", label: "B+", minPercent: 70 },
  { id: "default-b",      label: "B",  minPercent: 60 },
  { id: "default-c",      label: "C",  minPercent: 50 },
  { id: "default-d",      label: "D",  minPercent: 35 },
  { id: "default-f",      label: "F",  minPercent: 0  },
];

const BAND_COLORS = [
  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  "bg-green-500/10   text-green-600   dark:text-green-400   border-green-500/20",
  "bg-blue-500/10    text-blue-600    dark:text-blue-400    border-blue-500/20",
  "bg-indigo-500/10  text-indigo-600  dark:text-indigo-400  border-indigo-500/20",
  "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  "bg-orange-500/10  text-orange-600  dark:text-orange-400  border-orange-500/20",
  "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
];

function sortedDescending(bands: GradeBand[]): GradeBand[] {
  return [...bands].sort((a, b) => b.minPercent - a.minPercent);
}

/** Resolves a percentage score to a grade label using a school's configured bands. */
export function resolveGrade(pct: number, bands: GradeBand[]): string {
  const sorted = sortedDescending(bands.length ? bands : DEFAULT_GRADE_BANDS);
  for (const b of sorted) {
    if (pct >= b.minPercent) return b.label;
  }
  return sorted[sorted.length - 1]?.label ?? "—";
}

/**
 * Colors a grade badge by its rank among the school's bands (top band always
 * reads as "best", bottom as "worst"), rather than matching hardcoded label
 * text — so a custom scale (e.g. CBSE's A1–E2) still colors sensibly.
 */
export function gradeBandStyle(label: string, bands: GradeBand[]): string {
  const sorted = sortedDescending(bands.length ? bands : DEFAULT_GRADE_BANDS);
  const idx = sorted.findIndex((b) => b.label === label);
  if (idx === -1) return BAND_COLORS[BAND_COLORS.length - 1];
  const colorIdx = sorted.length > 1
    ? Math.round((idx / (sorted.length - 1)) * (BAND_COLORS.length - 1))
    : 0;
  return BAND_COLORS[colorIdx];
}
