"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Library, BookOpen, BookCheck, AlertTriangle, BookX,
  Search, Plus, Download, ChevronLeft, ChevronRight, ChevronDown,
  Pencil, ArrowUpDown, ArrowUp, ArrowDown, X, Eye, Trash2,
  Loader2, UserPlus, RotateCcw,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";
import { DatePicker } from "@/components/ui/date-picker";
import {
  bookStatus, availableCopies, avatarColor, initials, formatDate,
  type Book, type BookStatus, type BookIssue, type BorrowerOption, type BorrowerType,
} from "../_data/library";
import { addBook, updateBook, deleteBook, issueBook, returnBook, type BookInput } from "../actions";

type SortField = "title" | "category" | "available" | "issued" | "overdue";
type SortDir = "asc" | "desc";

const STATUS_BADGE: Record<BookStatus, { label: string; cls: string }> = {
  available: { label: "Available", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  low:       { label: "Low Stock", cls: "bg-amber-500/10  text-amber-600   dark:text-amber-400   border-amber-500/20"   },
  out:       { label: "Out",       cls: "bg-red-500/10    text-red-600     dark:text-red-400     border-red-500/20"     },
};

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

function StatsRow({ books }: { books: Book[] }) {
  const totalTitles = books.length;
  const totalCopies = books.reduce((s, b) => s + b.totalCopies, 0);
  const totalIssued = books.reduce((s, b) => s + b.issued, 0);
  const totalOverdue = books.reduce((s, b) => s + b.overdue, 0);

  const items = [
    { label: "Total Titles", value: totalTitles, icon: Library,       accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Total Copies", value: totalCopies, icon: BookOpen,      accent: "text-blue-500    bg-blue-500/10"    },
    { label: "Issued",       value: totalIssued, icon: BookCheck,     accent: "text-amber-500   bg-amber-500/10"   },
    { label: "Overdue",      value: totalOverdue, icon: AlertTriangle, accent: "text-red-500     bg-red-500/10"     },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s) => (
        <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}>
            <s.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

function BookModal({
  book, categories, onClose, onSaved,
}: {
  book: Book | null;
  categories: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!book;
  const [title, setTitle] = useState(book?.title ?? "");
  const [author, setAuthor] = useState(book?.author ?? "");
  const [isbn, setIsbn] = useState(book?.isbn ?? "");
  const [category, setCategory] = useState(book?.category ?? "");
  const [totalCopies, setTotalCopies] = useState(String(book?.totalCopies ?? 1));
  const [addedYear, setAddedYear] = useState(String(book?.addedYear ?? new Date().getFullYear()));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Please enter a title."); return; }
    const copies = Number(totalCopies);
    const year = Number(addedYear);
    if (!Number.isFinite(copies) || copies < 1) { setError("Total copies must be at least 1."); return; }
    if (!Number.isFinite(year) || year < 1900) { setError("Please enter a valid year."); return; }
    setError(null);
    const input: BookInput = {
      title: title.trim(),
      author: author.trim(),
      isbn: isbn.trim(),
      category: category.trim() || "Uncategorized",
      totalCopies: copies,
      addedYear: year,
    };
    startTransition(async () => {
      try {
        if (isEdit) await updateBook(book.id, input);
        else await addBook(input);
        onSaved();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save book");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{isEdit ? "Edit Book" : "Add Book"}</p>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 p-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. To Kill a Mockingbird" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Author</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. Harper Lee" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">ISBN</label>
              <input value={isbn} onChange={(e) => setIsbn(e.target.value)} placeholder="978-…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Category</label>
              <input value={category} onChange={(e) => setCategory(e.target.value)} list="library-categories" placeholder="e.g. Fiction" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
              <datalist id="library-categories">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Total Copies</label>
              <input type="number" min={1} value={totalCopies} onChange={(e) => setTotalCopies(e.target.value)} required className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Added Year</label>
              <input type="number" min={1900} max={2100} value={addedYear} onChange={(e) => setAddedYear(e.target.value)} required className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
            </div>
          </div>
          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Cancel</button>
          <FancyButton type="submit" disabled={isPending} size="sm">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Book"}
          </FancyButton>
        </div>
      </form>
    </div>
  );
}

function DeleteConfirmModal({
  book, onClose, onDeleted,
}: {
  book: Book;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteBook(book.id);
        onDeleted();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete book");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="p-5 space-y-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Delete book?</p>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            This will permanently remove <span className="font-medium text-gray-700 dark:text-zinc-300">&ldquo;{book.title}&rdquo;</span> from the library catalog.
          </p>
          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Cancel</button>
          <button type="button" onClick={handleDelete} disabled={isPending} className="flex h-9 items-center gap-1.5 rounded-lg bg-red-500 px-4 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} {isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function IssueForm({
  book, borrowerOptions, onIssued,
}: {
  book: Book;
  borrowerOptions: BorrowerOption[];
  onIssued: () => void;
}) {
  const [borrowerKey, setBorrowerKey] = useState("");
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const students = borrowerOptions.filter((b) => b.type === "student");
  const staff = borrowerOptions.filter((b) => b.type === "staff");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const [borrowerType, borrowerId] = borrowerKey.split(":") as [BorrowerType, string];
    if (!borrowerId) { setError("Please select a borrower."); return; }
    if (!dueDate) { setError("Please choose a due date."); return; }
    setError(null);
    startTransition(async () => {
      try {
        await issueBook({ bookId: book.id, borrowerId, borrowerType, dueDate });
        setBorrowerKey("");
        setDueDate(defaultDueDate());
        onIssued();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to issue book");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5 rounded-lg border border-dashed border-gray-200 dark:border-zinc-700 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
        <UserPlus className="h-3.5 w-3.5" /> Issue a copy
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <select value={borrowerKey} onChange={(e) => setBorrowerKey(e.target.value)} required className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="">Select borrower…</option>
            {students.length > 0 && (
              <optgroup label="Students">
                {students.map((s) => <option key={`student:${s.profileId}`} value={`student:${s.profileId}`}>{s.name} — {s.subtitle}</option>)}
              </optgroup>
            )}
            {staff.length > 0 && (
              <optgroup label="Staff">
                {staff.map((s) => <option key={`staff:${s.profileId}`} value={`staff:${s.profileId}`}>{s.name} — {s.subtitle}</option>)}
              </optgroup>
            )}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        <DatePicker value={dueDate} onChange={setDueDate} className="w-auto" />
        <FancyButton type="submit" size="sm" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Issue
        </FancyButton>
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
      {borrowerOptions.length === 0 && <p className="text-[11px] text-gray-400 dark:text-zinc-500">No students or staff with active accounts were found.</p>}
    </form>
  );
}

function ViewModal({
  book, issues, borrowerOptions, onClose, onChanged,
}: {
  book: Book;
  issues: BookIssue[];
  borrowerOptions: BorrowerOption[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [returningId, setReturningId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const available = availableCopies(book);
  const status = bookStatus(book);
  const badge = STATUS_BADGE[status];
  const bookIssues = issues.filter((i) => i.bookId === book.id);

  function handleReturn(issueId: string) {
    setReturningId(issueId);
    startTransition(async () => {
      try {
        await returnBook(issueId);
        onChanged();
      } finally {
        setReturningId(null);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${avatarColor(book.id)}`}>{initials(book.title)}</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-zinc-50">{book.title}</p>
              <p className="truncate text-xs text-gray-400 dark:text-zinc-500">{book.author || "Unknown author"} · {book.isbn || "No ISBN"}</p>
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-2.5 text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-zinc-50 tabular-nums">{book.totalCopies}</p>
              <p className="text-[10px] text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Copies</p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-2.5 text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-zinc-50 tabular-nums">{available}</p>
              <p className="text-[10px] text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Available</p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-2.5 text-center">
              <p className="text-lg font-bold text-gray-900 dark:text-zinc-50 tabular-nums">{book.issued}</p>
              <p className="text-[10px] text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Issued</p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-zinc-800 p-2.5 text-center">
              <p className={`text-lg font-bold tabular-nums ${book.overdue > 0 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-zinc-50"}`}>{book.overdue}</p>
              <p className="text-[10px] text-gray-500 dark:text-zinc-400 uppercase tracking-wide">Overdue</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-zinc-400">
            <span className="inline-flex items-center rounded-lg bg-indigo-500/10 px-2.5 py-1 font-semibold text-indigo-700 dark:text-indigo-300">{book.category}</span>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span>
            <span>Added {book.addedYear}</span>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Currently Issued ({bookIssues.length})</p>
            {bookIssues.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-zinc-500">No copies are currently issued.</p>
            ) : (
              <div className="space-y-1.5">
                {bookIssues.map((issue) => (
                  <div key={issue.id} className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-zinc-800 px-3 py-2">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${avatarColor(issue.borrowerId)}`}>{initials(issue.borrowerName)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-zinc-100">{issue.borrowerName}</p>
                      <p className="truncate text-xs text-gray-400 dark:text-zinc-500">{issue.borrowerSubtitle} · Due {formatDate(issue.dueDate)}</p>
                    </div>
                    {issue.overdue && (
                      <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400"><AlertTriangle className="h-3 w-3" /> Overdue</span>
                    )}
                    <button
                      onClick={() => handleReturn(issue.id)}
                      disabled={returningId === issue.id}
                      className="shrink-0 flex h-7 items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 px-2 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                    >
                      {returningId === issue.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />} Return
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {available > 0 && <IssueForm book={book} borrowerOptions={borrowerOptions} onIssued={onChanged} />}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 10;

function escapeCsv(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function exportBooksCsv(books: Book[]) {
  const header = ["Title", "Author", "ISBN", "Category", "Total Copies", "Available", "Issued", "Overdue", "Status", "Added Year"];
  const rows = books.map((b) => [
    b.title, b.author, b.isbn, b.category,
    String(b.totalCopies), String(availableCopies(b)), String(b.issued), String(b.overdue),
    STATUS_BADGE[bookStatus(b)].label, String(b.addedYear),
  ]);
  const csv = [header, ...rows].map((r) => r.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `library-books-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function LibraryClient({
  books, issues, borrowerOptions,
}: {
  books: Book[];
  issues: BookIssue[];
  borrowerOptions: BorrowerOption[];
}) {
  const router = useRouter();
  const categories = useMemo(() => Array.from(new Set(books.map((b) => b.category))).sort(), [books]);

  const [query, setQuery] = useState("");
  const [catFilter, setCat] = useState<"all" | string>("all");
  const [statusFilter, setStatus] = useState<"all" | BookStatus>("all");
  const [sortField, setSortField] = useState<SortField>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const [addOpen, setAddOpen] = useState(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);
  const [viewingBookId, setViewingBookId] = useState<string | null>(null);

  const editingBook = books.find((b) => b.id === editingBookId) ?? null;
  const deletingBook = books.find((b) => b.id === deletingBookId) ?? null;
  const viewingBook = books.find((b) => b.id === viewingBookId) ?? null;

  function refresh() {
    router.refresh();
  }

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return books.filter((b) => {
      const matchQ = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.includes(q);
      const matchCat = catFilter === "all" || b.category === catFilter;
      const matchSt = statusFilter === "all" || bookStatus(b) === statusFilter;
      return matchQ && matchCat && matchSt;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === "title") cmp = a.title.localeCompare(b.title);
      if (sortField === "category") cmp = a.category.localeCompare(b.category);
      if (sortField === "available") cmp = availableCopies(a) - availableCopies(b);
      if (sortField === "issued") cmp = a.issued - b.issued;
      if (sortField === "overdue") cmp = a.overdue - b.overdue;
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [books, query, catFilter, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilter = query || catFilter !== "all" || statusFilter !== "all";

  function clearFilters() { setQuery(""); setCat("all"); setStatus("all"); setPage(1); }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Library</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Books, issues, and returns</p>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <button onClick={() => exportBooksCsv(filtered)} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><Download className="h-3.5 w-3.5" /> Export</button>
          <FancyButton size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add Book</FancyButton>
        </div>
      </div>

      <StatsRow books={books} />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search by title, author or ISBN…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </div>
        <div className="relative">
          <select value={catFilter} onChange={(e) => { setCat(e.target.value); setPage(1); }} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => { setStatus(e.target.value as "all" | BookStatus); setPage(1); }} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        {hasFilter && (
          <button onClick={clearFilters} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {hasFilter && (
        <div className="flex items-center justify-end">
          <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">Filters active</span>
        </div>
      )}

      <Table
        footer={totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
              <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> titles
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"><ChevronLeft className="h-3.5 w-3.5" /></button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setPage(n)} className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${page === n ? "bg-primary-500 text-white" : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"}`}>{n}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"><ChevronRight className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        )}
      >
        <TableHead>
          <Th position="first">
            <button onClick={() => toggleSort("title")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Book <SortIcon active={sortField === "title"} dir={sortDir} /></button>
          </Th>
          <Th>
            <button onClick={() => toggleSort("category")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Category <SortIcon active={sortField === "category"} dir={sortDir} /></button>
          </Th>
          <Th>Copies</Th>
          <Th>
            <button onClick={() => toggleSort("available")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Available <SortIcon active={sortField === "available"} dir={sortDir} /></button>
          </Th>
          <Th>
            <button onClick={() => toggleSort("issued")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Issued <SortIcon active={sortField === "issued"} dir={sortDir} /></button>
          </Th>
          <Th>
            <button onClick={() => toggleSort("overdue")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Overdue <SortIcon active={sortField === "overdue"} dir={sortDir} /></button>
          </Th>
          <Th>Status</Th>
          <Th position="last" align="right">Actions</Th>
        </TableHead>
        <TableBody>
          {pageData.length === 0 ? (
            <TableEmptyRow colSpan={8} icon={BookX} message="No books found" />
          ) : pageData.map((book) => {
            const status = bookStatus(book);
            const available = availableCopies(book);
            const badge = STATUS_BADGE[status];
            return (
              <Tr key={book.id}>
                <Td position="first">
                  <button onClick={() => setViewingBookId(book.id)} className="flex items-center gap-3 text-left">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white ${avatarColor(book.id)}`}>{initials(book.title)}</div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate max-w-[220px] hover:underline">{book.title}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500 truncate max-w-[220px]">{book.author}</p>
                    </div>
                  </button>
                </Td>
                <Td><span className="inline-flex items-center rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">{book.category}</span></Td>
                <Td><span className="text-sm font-medium text-gray-700 dark:text-zinc-300 tabular-nums">{book.totalCopies}</span></Td>
                <Td>
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
                      <div className={`h-1.5 rounded-full transition-all ${available === 0 ? "bg-red-500" : available <= 2 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${book.totalCopies ? Math.round((available / book.totalCopies) * 100) : 0}%` }} />
                    </div>
                    <span className={`text-xs font-semibold tabular-nums ${available === 0 ? "text-red-600 dark:text-red-400" : available <= 2 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>{available}</span>
                  </div>
                </Td>
                <Td><span className="text-sm text-gray-700 dark:text-zinc-300 tabular-nums">{book.issued}</span></Td>
                <Td>
                  {book.overdue > 0 ? (
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 dark:text-red-400 tabular-nums"><AlertTriangle className="h-3 w-3" />{book.overdue}</span>
                  ) : (
                    <span className="text-sm text-gray-400 dark:text-zinc-500 tabular-nums">—</span>
                  )}
                </Td>
                <Td><span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span></Td>
                <Td position="last">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setViewingBookId(book.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors" title="View"><Eye className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setEditingBookId(book.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors" title="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeletingBookId(book.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </Td>
              </Tr>
            );
          })}
        </TableBody>
      </Table>

      {addOpen && (
        <BookModal book={null} categories={categories} onClose={() => setAddOpen(false)} onSaved={refresh} />
      )}
      {editingBook && (
        <BookModal book={editingBook} categories={categories} onClose={() => setEditingBookId(null)} onSaved={refresh} />
      )}
      {deletingBook && (
        <DeleteConfirmModal book={deletingBook} onClose={() => setDeletingBookId(null)} onDeleted={refresh} />
      )}
      {viewingBook && (
        <ViewModal book={viewingBook} issues={issues} borrowerOptions={borrowerOptions} onClose={() => setViewingBookId(null)} onChanged={refresh} />
      )}
    </div>
  );
}
