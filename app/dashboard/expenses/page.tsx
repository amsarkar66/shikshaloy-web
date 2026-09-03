import { ShieldAlert } from "lucide-react";
import { getVerifiedUser, requireRoleOrStaffTemplate } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentInstitutionIdOrThrow, getInstitutionSchools } from "@/lib/supabase/institution-context";
import ExpensesClient from "./_components/ExpensesClient";
import type { Expense, BudgetLine } from "./_data/expenses";
import type { SchoolOption } from "./_components/ExpensesClient";

function Unauthorized() {
  return (
    <div className="w-full px-6 py-8">
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <ShieldAlert className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Not authorized</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Only school admins and finance staff can view expenses.</p>
      </div>
    </div>
  );
}

export default async function ExpensesPage() {
  try {
    await requireRoleOrStaffTemplate(["admin", "super_admin"], ["accountant"]);
  } catch {
    return <Unauthorized />;
  }

  const verifiedUser = await getVerifiedUser();
  const isSuperAdmin = verifiedUser?.role === "super_admin";

  if (isSuperAdmin) {
    const institutionId = await getCurrentInstitutionIdOrThrow();
    const schools: SchoolOption[] = await getInstitutionSchools(institutionId);
    const schoolIds = schools.map((s) => s.id);
    const schoolNameById = new Map(schools.map((s) => [s.id, s.name]));

    if (schoolIds.length === 0) {
      return <ExpensesClient expenses={[]} budgets={[]} schools={[]} />;
    }

    const [{ data: expenseRows }, { data: budgetRows }] = await Promise.all([
      supabaseAdmin
        .from("expenses")
        .select("id, date, month_str, category, description, vendor, amount, status, receipt_ref, school_id")
        .in("school_id", schoolIds)
        .order("date", { ascending: false }),
      supabaseAdmin
        .from("expense_budgets")
        .select("category, monthly_amount")
        .in("school_id", schoolIds),
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
      schoolId: e.school_id,
      schoolName: schoolNameById.get(e.school_id) ?? "—",
    }));

    const budgets: BudgetLine[] = (budgetRows ?? []).map((b) => ({
      category: b.category,
      budget: Number(b.monthly_amount ?? 0),
    }));

    return <ExpensesClient expenses={expenses} budgets={budgets} schools={schools} />;
  }

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
