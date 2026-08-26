const DEPT_COLORS: Record<string, string> = {
  "Mathematics":           "bg-blue-500/10   text-blue-700   dark:text-blue-300",
  "Science":               "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "English":               "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  "Hindi":                 "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  "Humanities":            "bg-amber-500/10  text-amber-700  dark:text-amber-300",
  "Commerce":              "bg-teal-500/10   text-teal-700   dark:text-teal-300",
  "Administration":        "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  "Library":               "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  "Counseling":            "bg-rose-500/10   text-rose-700   dark:text-rose-300",
  "Accounts":              "bg-sky-500/10    text-sky-700    dark:text-sky-300",
  "Sports & Physical Ed.": "bg-cyan-500/10   text-cyan-700   dark:text-cyan-300",
  "Computer Science":      "bg-pink-500/10   text-pink-700   dark:text-pink-300",
};

export function deptColor(dept: string) {
  return DEPT_COLORS[dept] ?? "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300";
}

export function formatJoinDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
