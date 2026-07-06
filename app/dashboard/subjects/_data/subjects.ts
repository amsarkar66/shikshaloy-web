export type SubjectType   = "core" | "elective";
export type SubjectStatus = "active" | "inactive";

const COLORS = [
  "bg-indigo-500", "bg-violet-500", "bg-blue-500", "bg-emerald-500",
  "bg-rose-500",   "bg-amber-500",  "bg-teal-500", "bg-pink-500",
  "bg-cyan-500",   "bg-orange-500",
];

export function avatarColor(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return COLORS[n % COLORS.length];
}

export function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function classRange(classes: string[]) {
  if (classes.length === 0) return "—";
  const nums = classes.map(Number).sort((a, b) => a - b);
  if (nums.length === 1) return `Class ${nums[0]}`;
  const isConsecutive = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
  if (isConsecutive) return `Class ${nums[0]}–${nums[nums.length - 1]}`;
  return nums.map((n) => `${n}`).join(", ");
}
