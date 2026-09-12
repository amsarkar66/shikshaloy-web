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
  notes: string | null;
  lastUpdated: string;
  schoolId?: string;
  schoolName?: string;
}

export type ActivityEventType = "created" | "updated" | "stock_adjusted";

export interface ActivityLogEntry {
  id: string;
  eventType: ActivityEventType;
  description: string;
  delta: number | null;
  reason: string | null;
  actorName: string;
  createdAt: string;
}

export const STATUS_BADGE: Record<ItemStatus, { label: string; cls: string }> = {
  in_stock:     { label: "In Stock",     cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  low_stock:    { label: "Low Stock",    cls: "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20"   },
  out_of_stock: { label: "Out of Stock", cls: "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20"     },
};

export const CONDITION_BADGE: Record<ItemCondition, { label: string; cls: string }> = {
  good: { label: "Good", cls: "bg-blue-500/10   text-blue-600   dark:text-blue-400   border-blue-500/20"   },
  fair: { label: "Fair", cls: "bg-zinc-500/10   text-zinc-600   dark:text-zinc-400   border-zinc-500/20"   },
  poor: { label: "Poor", cls: "bg-red-500/10    text-red-600    dark:text-red-400    border-red-500/20"    },
};

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

export interface ItemRow {
  id: string; name: string | null; category: string | null; location: string | null;
  total_qty: number | null; in_use_qty: number | null; damaged_qty: number | null;
  condition: string | null; unit_cost: number | null; notes: string | null; last_updated: string;
  school_id: string;
}

export const ITEM_SELECT = "id, name, category, location, total_qty, in_use_qty, damaged_qty, condition, unit_cost, notes, last_updated, school_id";

export function toItem(i: ItemRow, schoolName?: string): InventoryItem {
  return {
    id: i.id,
    name: i.name ?? "",
    category: i.category ?? "Uncategorized",
    location: i.location ?? "—",
    totalQty: i.total_qty ?? 0,
    inUse: i.in_use_qty ?? 0,
    damaged: i.damaged_qty ?? 0,
    condition: (i.condition ?? "good") as ItemCondition,
    unitCost: Number(i.unit_cost ?? 0),
    notes: i.notes,
    lastUpdated: i.last_updated,
    schoolId: schoolName !== undefined ? i.school_id : undefined,
    schoolName,
  };
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
