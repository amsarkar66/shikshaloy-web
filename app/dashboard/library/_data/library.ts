export type BookStatus = "available" | "low" | "out";

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  issued: number;
  overdue: number;
  addedYear: number;
}

export function bookStatus(book: Book): BookStatus {
  const available = book.totalCopies - book.issued;
  if (available <= 0) return "out";
  if (available <= 2) return "low";
  return "available";
}

export function availableCopies(book: Book): number {
  return Math.max(0, book.totalCopies - book.issued);
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

export function initials(title: string): string {
  return title.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
