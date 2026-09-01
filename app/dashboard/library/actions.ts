"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import type { BorrowerType } from "./_data/library";

export interface BookInput {
  title: string;
  author: string;
  isbn: string;
  category: string;
  totalCopies: number;
  addedYear: number;
}

export async function addBook(input: BookInput) {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data, error } = await supabaseAdmin
    .from("library_books")
    .insert({
      school_id: schoolId,
      title: input.title,
      author: input.author || null,
      isbn: input.isbn || null,
      category: input.category || null,
      total_copies: input.totalCopies,
      added_year: input.addedYear,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to add book");
  revalidatePath("/dashboard/library");
  return { id: data.id as string };
}

export async function updateBook(id: string, input: BookInput) {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { count } = await supabaseAdmin
    .from("book_issues")
    .select("id", { count: "exact", head: true })
    .eq("book_id", id)
    .is("returned_date", null);
  if ((count ?? 0) > input.totalCopies) {
    throw new Error(`Cannot set total copies below ${count} — that many are currently issued.`);
  }
  const { error } = await supabaseAdmin
    .from("library_books")
    .update({
      title: input.title,
      author: input.author || null,
      isbn: input.isbn || null,
      category: input.category || null,
      total_copies: input.totalCopies,
      added_year: input.addedYear,
    })
    .eq("id", id)
    .eq("school_id", schoolId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/library");
}

export async function deleteBook(id: string) {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { count } = await supabaseAdmin
    .from("book_issues")
    .select("id", { count: "exact", head: true })
    .eq("book_id", id)
    .is("returned_date", null);
  if ((count ?? 0) > 0) {
    throw new Error("Cannot delete a book that has copies currently issued.");
  }
  const { error } = await supabaseAdmin.from("library_books").delete().eq("id", id).eq("school_id", schoolId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/library");
}

export async function issueBook(input: {
  bookId: string;
  borrowerId: string;
  borrowerType: BorrowerType;
  dueDate: string;
}) {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const [{ data: book }, { count: issuedCount }] = await Promise.all([
    supabaseAdmin.from("library_books").select("total_copies").eq("id", input.bookId).single(),
    supabaseAdmin
      .from("book_issues")
      .select("id", { count: "exact", head: true })
      .eq("book_id", input.bookId)
      .is("returned_date", null),
  ]);
  if ((issuedCount ?? 0) >= (book?.total_copies ?? 0)) {
    throw new Error("No copies of this book are currently available.");
  }

  const { error } = await supabaseAdmin.from("book_issues").insert({
    school_id: schoolId,
    book_id: input.bookId,
    borrower_id: input.borrowerId,
    borrower_type: input.borrowerType,
    issued_date: new Date().toISOString().slice(0, 10),
    due_date: input.dueDate,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/library");
}

export async function returnBook(issueId: string) {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin
    .from("book_issues")
    .update({ returned_date: new Date().toISOString().slice(0, 10) })
    .eq("id", issueId)
    .eq("school_id", schoolId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/library");
}
