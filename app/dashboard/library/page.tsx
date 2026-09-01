import { ShieldAlert } from "lucide-react";
import { requireRoleOrStaffTemplate } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import LibraryClient from "./_components/LibraryClient";
import type { Book, BookIssue, BorrowerOption, BorrowerType } from "./_data/library";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins and librarians can manage the library.</p>
      </div>
    </div>
  );
}

interface StudentRow {
  id: string;
  profile_id: string | null;
  full_name: string;
  roll_no: string | null;
  sections: { name: string | null; grades: { level: number | null } | null } | null;
}

interface StaffRow {
  id: string;
  profile_id: string | null;
  full_name: string;
  designation: string | null;
}

interface IssueRow {
  id: string;
  book_id: string;
  borrower_id: string;
  borrower_type: string | null;
  issued_date: string;
  due_date: string;
}

export default async function LibraryPage() {
  try {
    await requireRoleOrStaffTemplate(["admin"], ["librarian"]);
  } catch {
    return <Unauthorized />;
  }

  const schoolId = await getCurrentSchoolIdOrThrow();
  const [{ data: bookRows }, { data: issueRows }, { data: studentRows }, { data: staffRows }] = await Promise.all([
    supabaseAdmin
      .from("library_books")
      .select("id, title, author, isbn, category, total_copies, added_year")
      .eq("school_id", schoolId)
      .order("title"),

    supabaseAdmin
      .from("book_issues")
      .select("id, book_id, borrower_id, borrower_type, issued_date, due_date")
      .eq("school_id", schoolId)
      .is("returned_date", null),

    supabaseAdmin
      .from("students")
      .select("id, profile_id, full_name, roll_no, sections ( name, grades ( level ) )")
      .eq("school_id", schoolId)
      .eq("status", "active")
      .not("profile_id", "is", null)
      .order("full_name"),

    supabaseAdmin
      .from("staff_members")
      .select("id, profile_id, full_name, designation")
      .eq("school_id", schoolId)
      .neq("status", "inactive")
      .not("profile_id", "is", null)
      .order("full_name"),
  ]);

  const students = ((studentRows ?? []) as unknown as StudentRow[]).filter((s) => s.profile_id);
  const staff = ((staffRows ?? []) as unknown as StaffRow[]).filter((s) => s.profile_id);

  const borrowerLookup = new Map<string, { name: string; subtitle: string; type: BorrowerType }>();
  for (const s of students) {
    const cls = s.sections?.grades?.level;
    const sec = s.sections?.name;
    borrowerLookup.set(s.profile_id as string, {
      name: s.full_name,
      subtitle: [cls ? `Class ${cls}${sec ?? ""}` : null, s.roll_no ? `Roll ${s.roll_no}` : null].filter(Boolean).join(" · ") || "Student",
      type: "student",
    });
  }
  for (const s of staff) {
    borrowerLookup.set(s.profile_id as string, {
      name: s.full_name,
      subtitle: s.designation ?? "Staff",
      type: "staff",
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  const issuedByBook: Record<string, number> = {};
  const overdueByBook: Record<string, number> = {};
  const issues: BookIssue[] = [];
  for (const r of (issueRows ?? []) as unknown as IssueRow[]) {
    issuedByBook[r.book_id] = (issuedByBook[r.book_id] ?? 0) + 1;
    const overdue = !!r.due_date && r.due_date < today;
    if (overdue) overdueByBook[r.book_id] = (overdueByBook[r.book_id] ?? 0) + 1;
    const borrower = borrowerLookup.get(r.borrower_id);
    issues.push({
      id: r.id,
      bookId: r.book_id,
      borrowerId: r.borrower_id,
      borrowerType: (r.borrower_type as BorrowerType) ?? "student",
      borrowerName: borrower?.name ?? "Unknown",
      borrowerSubtitle: borrower?.subtitle ?? "",
      issuedDate: r.issued_date,
      dueDate: r.due_date,
      overdue,
    });
  }

  const books: Book[] = (bookRows ?? []).map((b) => ({
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

  const borrowerOptions: BorrowerOption[] = [
    ...students.map((s) => ({
      profileId: s.profile_id as string,
      name: s.full_name,
      subtitle: borrowerLookup.get(s.profile_id as string)?.subtitle ?? "Student",
      type: "student" as const,
    })),
    ...staff.map((s) => ({
      profileId: s.profile_id as string,
      name: s.full_name,
      subtitle: s.designation ?? "Staff",
      type: "staff" as const,
    })),
  ];

  return <LibraryClient books={books} issues={issues} borrowerOptions={borrowerOptions} />;
}
