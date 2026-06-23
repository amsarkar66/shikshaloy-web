export type ItemStatus    = "in_stock" | "low_stock" | "out_of_stock";
export type ItemCondition = "good" | "fair" | "poor";
export type ItemCategory  =
  | "Furniture"
  | "Lab Equipment"
  | "Sports & PE"
  | "IT & Electronics"
  | "Stationery & Supplies"
  | "Cleaning & Sanitation"
  | "Audio Visual"
  | "Kitchen & Canteen"
  | "Safety & First Aid"
  | "Miscellaneous";

export interface InventoryItem {
  id:          number;
  name:        string;
  category:    ItemCategory;
  location:    string;
  totalQty:    number;
  inUse:       number;
  damaged:     number;
  condition:   ItemCondition;
  unitCost:    number;
  lastUpdated: string;
  notes?:      string;
}

export const ALL_ITEMS: InventoryItem[] = [
  { id:  1, name: "Student Desk",             category: "Furniture",              location: "All Classrooms",   totalQty: 320, inUse: 310, damaged:  5, condition: "good",  unitCost:  1800, lastUpdated: "2026-05-10" },
  { id:  2, name: "Teacher's Chair",           category: "Furniture",              location: "All Classrooms",   totalQty:  28, inUse:  26, damaged:  1, condition: "good",  unitCost:  2400, lastUpdated: "2026-05-10" },
  { id:  3, name: "Steel Almirah",             category: "Furniture",              location: "Staff Room",       totalQty:  12, inUse:  12, damaged:  0, condition: "good",  unitCost:  6500, lastUpdated: "2026-04-20" },
  { id:  4, name: "Whiteboard",                category: "Furniture",              location: "All Classrooms",   totalQty:  30, inUse:  28, damaged:  2, condition: "fair",  unitCost:  3200, lastUpdated: "2026-05-15" },
  { id:  5, name: "Library Bookshelf",         category: "Furniture",              location: "Library",          totalQty:  18, inUse:  18, damaged:  0, condition: "good",  unitCost:  4500, lastUpdated: "2026-03-01" },
  { id:  6, name: "Microscope",                category: "Lab Equipment",          location: "Science Lab",      totalQty:  20, inUse:  18, damaged:  2, condition: "fair",  unitCost: 12000, lastUpdated: "2026-05-20" },
  { id:  7, name: "Bunsen Burner",             category: "Lab Equipment",          location: "Science Lab",      totalQty:  15, inUse:  12, damaged:  1, condition: "good",  unitCost:   850, lastUpdated: "2026-05-20" },
  { id:  8, name: "Beaker Set (500ml)",        category: "Lab Equipment",          location: "Science Lab",      totalQty:  40, inUse:  35, damaged:  6, condition: "fair",  unitCost:   120, lastUpdated: "2026-06-01" },
  { id:  9, name: "Digital Weighing Scale",    category: "Lab Equipment",          location: "Science Lab",      totalQty:   8, inUse:   7, damaged:  1, condition: "good",  unitCost:  3500, lastUpdated: "2026-04-15" },
  { id: 10, name: "Globe",                     category: "Lab Equipment",          location: "Geography Lab",    totalQty:   6, inUse:   6, damaged:  0, condition: "good",  unitCost:  2200, lastUpdated: "2026-03-10" },
  { id: 11, name: "Football",                  category: "Sports & PE",            location: "Sports Room",      totalQty:  15, inUse:  12, damaged:  3, condition: "fair",  unitCost:   450, lastUpdated: "2026-06-05" },
  { id: 12, name: "Cricket Bat",               category: "Sports & PE",            location: "Sports Room",      totalQty:  10, inUse:   9, damaged:  1, condition: "good",  unitCost:   800, lastUpdated: "2026-06-05" },
  { id: 13, name: "Badminton Racket",          category: "Sports & PE",            location: "Sports Room",      totalQty:  20, inUse:  16, damaged:  4, condition: "fair",  unitCost:   350, lastUpdated: "2026-06-05" },
  { id: 14, name: "Yoga Mat",                  category: "Sports & PE",            location: "Yoga Room",        totalQty:  40, inUse:  38, damaged:  2, condition: "good",  unitCost:   250, lastUpdated: "2026-05-01" },
  { id: 15, name: "Table Tennis Table",        category: "Sports & PE",            location: "Recreation Hall",  totalQty:   2, inUse:   2, damaged:  0, condition: "good",  unitCost: 18000, lastUpdated: "2026-04-01" },
  { id: 16, name: "Desktop Computer",          category: "IT & Electronics",       location: "Computer Lab",     totalQty:  40, inUse:  38, damaged:  2, condition: "fair",  unitCost: 35000, lastUpdated: "2026-05-25" },
  { id: 17, name: "Laptop (Staff)",            category: "IT & Electronics",       location: "Staff Room",       totalQty:  12, inUse:  12, damaged:  0, condition: "good",  unitCost: 55000, lastUpdated: "2026-05-25" },
  { id: 18, name: "Projector",                 category: "IT & Electronics",       location: "Classrooms",       totalQty:   8, inUse:   7, damaged:  1, condition: "fair",  unitCost: 28000, lastUpdated: "2026-04-10" },
  { id: 19, name: "UPS / Inverter",            category: "IT & Electronics",       location: "Computer Lab",     totalQty:   5, inUse:   5, damaged:  0, condition: "good",  unitCost: 15000, lastUpdated: "2026-03-20" },
  { id: 20, name: "Wi-Fi Router",             category: "IT & Electronics",       location: "Server Room",      totalQty:   4, inUse:   4, damaged:  0, condition: "good",  unitCost:  6000, lastUpdated: "2026-03-01" },
  { id: 21, name: "A4 Paper Ream",            category: "Stationery & Supplies",  location: "Store Room",       totalQty: 200, inUse: 190, damaged:  0, condition: "good",  unitCost:   220, lastUpdated: "2026-06-10" },
  { id: 22, name: "Whiteboard Marker Set",    category: "Stationery & Supplies",  location: "Store Room",       totalQty:  80, inUse:  72, damaged:  0, condition: "good",  unitCost:    40, lastUpdated: "2026-06-10" },
  { id: 23, name: "Stapler",                  category: "Stationery & Supplies",  location: "Admin Office",     totalQty:  20, inUse:  18, damaged:  2, condition: "fair",  unitCost:   150, lastUpdated: "2026-05-05" },
  { id: 24, name: "Printer Ink Cartridge",    category: "Stationery & Supplies",  location: "Admin Office",     totalQty:  10, inUse:   9, damaged:  0, condition: "good",  unitCost:   900, lastUpdated: "2026-06-01" },
  { id: 25, name: "Dustbin (Large)",          category: "Cleaning & Sanitation",  location: "All Floors",       totalQty:  25, inUse:  25, damaged:  0, condition: "good",  unitCost:   280, lastUpdated: "2026-04-01" },
  { id: 26, name: "Mop & Bucket Set",         category: "Cleaning & Sanitation",  location: "Housekeeping",     totalQty:  10, inUse:  10, damaged:  1, condition: "fair",  unitCost:   350, lastUpdated: "2026-04-01" },
  { id: 27, name: "Liquid Soap Dispenser",    category: "Cleaning & Sanitation",  location: "Washrooms",        totalQty:  18, inUse:  16, damaged:  2, condition: "fair",  unitCost:   180, lastUpdated: "2026-05-15" },
  { id: 28, name: "Smart TV (55″)",           category: "Audio Visual",           location: "Conference Room",  totalQty:   3, inUse:   3, damaged:  0, condition: "good",  unitCost: 42000, lastUpdated: "2026-03-15" },
  { id: 29, name: "Speaker System",           category: "Audio Visual",           location: "Assembly Hall",    totalQty:   2, inUse:   2, damaged:  0, condition: "good",  unitCost: 22000, lastUpdated: "2026-03-15" },
  { id: 30, name: "Microphone (Wireless)",    category: "Audio Visual",           location: "Assembly Hall",    totalQty:   4, inUse:   3, damaged:  1, condition: "fair",  unitCost:  5500, lastUpdated: "2026-04-20" },
  { id: 31, name: "Gas Stove (4-burner)",     category: "Kitchen & Canteen",      location: "Canteen",          totalQty:   3, inUse:   3, damaged:  0, condition: "good",  unitCost: 12000, lastUpdated: "2026-02-10" },
  { id: 32, name: "Refrigerator (Large)",     category: "Kitchen & Canteen",      location: "Canteen",          totalQty:   2, inUse:   2, damaged:  0, condition: "good",  unitCost: 28000, lastUpdated: "2026-02-10" },
  { id: 33, name: "First Aid Kit",            category: "Safety & First Aid",     location: "Each Floor",       totalQty:   6, inUse:   6, damaged:  0, condition: "good",  unitCost:  1200, lastUpdated: "2026-06-01" },
  { id: 34, name: "Fire Extinguisher",        category: "Safety & First Aid",     location: "All Areas",        totalQty:  15, inUse:  15, damaged:  0, condition: "good",  unitCost:  3500, lastUpdated: "2026-01-15" },
  { id: 35, name: "CCTV Camera",              category: "Safety & First Aid",     location: "Corridors / Gate", totalQty:  20, inUse:  18, damaged:  2, condition: "fair",  unitCost:  8000, lastUpdated: "2026-05-01" },
  { id: 36, name: "Wall Clock",               category: "Miscellaneous",          location: "Classrooms",       totalQty:  30, inUse:  28, damaged:  2, condition: "fair",  unitCost:   350, lastUpdated: "2026-04-15" },
  { id: 37, name: "Notice Board",             category: "Miscellaneous",          location: "Corridors",        totalQty:  12, inUse:  12, damaged:  0, condition: "good",  unitCost:   900, lastUpdated: "2026-03-10" },
];

export const CATEGORIES: ItemCategory[] = [
  "Furniture",
  "Lab Equipment",
  "Sports & PE",
  "IT & Electronics",
  "Stationery & Supplies",
  "Cleaning & Sanitation",
  "Audio Visual",
  "Kitchen & Canteen",
  "Safety & First Aid",
  "Miscellaneous",
];

export function availableQty(item: InventoryItem): number {
  return item.totalQty - item.inUse - item.damaged;
}

export function itemStatus(item: InventoryItem): ItemStatus {
  const avail = availableQty(item);
  const pct   = item.totalQty > 0 ? avail / item.totalQty : 0;
  if (avail <= 0)   return "out_of_stock";
  if (pct <= 0.15)  return "low_stock";
  return "in_stock";
}

export function totalValue(items: InventoryItem[]): number {
  return items.reduce((s, i) => s + i.totalQty * i.unitCost, 0);
}

export const AVATAR_COLORS = [
  "bg-blue-500",   "bg-violet-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500",  "bg-teal-500",   "bg-indigo-500",  "bg-pink-500",
  "bg-cyan-500",   "bg-orange-500",
];

export function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

export function initials(name: string) {
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
