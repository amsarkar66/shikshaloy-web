export type ItemStatus = "in_stock" | "low_stock" | "out_of_stock";
export type ItemCondition = "good" | "fair" | "poor";

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  location: string;
  totalQty: number;
  inUse: number;
  damaged: number;
  condition: ItemCondition;
  unitCost: number;
  lastUpdated: string;
}

export function availableQty(item: InventoryItem): number {
  return item.totalQty - item.inUse - item.damaged;
}

export function itemStatus(item: InventoryItem): ItemStatus {
  const avail = availableQty(item);
  const pct = item.totalQty > 0 ? avail / item.totalQty : 0;
  if (avail <= 0) return "out_of_stock";
  if (pct <= 0.15) return "low_stock";
  return "in_stock";
}

export function totalValue(items: InventoryItem[]): number {
  return items.reduce((s, i) => s + i.totalQty * i.unitCost, 0);
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500",
  "bg-cyan-500", "bg-orange-500",
];

export function avatarColor(id: string): string {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

export function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export function formatCurrency(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}
