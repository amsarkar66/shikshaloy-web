import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import ExpensesClient from "./_components/ExpensesClient";
import type { Expense, BudgetLine } from "./_data/expenses";

export default async function ExpensesPage() {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const [{ data: expenseRows }, { data: budgetRows }] = await Promise.all([
    supabaseAdmin
      .from("expenses")
      .select("id, date, month_str, category, description, vendor, amount, status, receipt_ref")
      .eq("school_id", schoolId)
      .order("date", { ascending: false }),

    supabaseAdmin
      .from("expense_budgets")
      .select("category, monthly_amount")
      .eq("school_id", schoolId),
  ]);

  const expenses: Expense[] = (expenseRows ?? []).map((e) => ({
    id: e.id,
    monthStr: e.month_str,
    date: e.date,
    category: e.category,
    description: e.description ?? "",
    vendor: e.vendor ?? "",
    amount: Number(e.amount ?? 0),
    status: e.status ?? "pending",
    receiptRef: e.receipt_ref,
  }));

  const budgets: BudgetLine[] = (budgetRows ?? []).map((b) => ({
    category: b.category,
    budget: Number(b.monthly_amount ?? 0),
  }));

  return <ExpensesClient expenses={expenses} budgets={budgets} />;
}
