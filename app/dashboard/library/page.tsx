import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import LibraryClient from "./_components/LibraryClient";
import type { Book } from "./_data/library";

export default async function LibraryPage() {
  const [{ data: bookRows }, { data: issueRows }] = await Promise.all([
    supabaseAdmin
      .from("library_books")
      .select("id, title, author, isbn, category, total_copies, added_year")
      .eq("school_id", DEMO_SCHOOL_ID)
      .order("title"),

    supabaseAdmin
      .from("book_issues")
      .select("book_id, due_date, returned_date")
      .eq("school_id", DEMO_SCHOOL_ID)
      .is("returned_date", null),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const issuedByBook: Record<string, number> = {};
  const overdueByBook: Record<string, number> = {};
  for (const r of (issueRows ?? []) as any[]) {
    issuedByBook[r.book_id] = (issuedByBook[r.book_id] ?? 0) + 1;
    if (r.due_date && r.due_date < today) {
      overdueByBook[r.book_id] = (overdueByBook[r.book_id] ?? 0) + 1;
    }
  }

  const books: Book[] = (bookRows ?? []).map((b: any) => ({
    id: b.id,
    title: b.title ?? "",
    author: b.author ?? "",
    isbn: b.isbn ?? "",
    category: b.category ?? "Uncategorized",
    totalCopies: b.total_copies ?? 0,
    issued: issuedByBook[b.id] ?? 0,
    overdue: overdueByBook[b.id] ?? 0,
    addedYear: b.added_year ?? new Date().getFullYear(),
  }));

  return <LibraryClient books={books} />;
}
