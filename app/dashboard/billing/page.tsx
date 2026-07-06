import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import BillingClient from "./_components/BillingClient";
import type { Subscription, Invoice } from "./_data/billing";

export default async function BillingPage() {
  const [{ data: subRow }, { data: invoiceRows }] = await Promise.all([
    supabaseAdmin
      .from("school_subscriptions")
      .select("plan_id, plan_name, status, schools_used, max_schools, monthly_fee, renews_on, payment_method_summary")
      .eq("school_id", DEMO_SCHOOL_ID)
      .single(),

    supabaseAdmin
      .from("subscription_invoices")
      .select("id, invoice_no, period_label, plan_name, amount, status, issued_date")
      .eq("school_id", DEMO_SCHOOL_ID)
      .order("issued_date", { ascending: false }),
  ]);

  const subscription: Subscription | null = subRow
    ? {
        planId: subRow.plan_id,
        planName: subRow.plan_name,
        status: subRow.status,
        schoolsUsed: subRow.schools_used,
        maxSchools: subRow.max_schools,
        monthlyFee: Number(subRow.monthly_fee),
        renewsOn: subRow.renews_on,
        paymentMethodSummary: subRow.payment_method_summary,
      }
    : null;

  const invoices: Invoice[] = ((invoiceRows ?? []) as any[]).map((inv) => ({
    id: inv.id,
    invoiceNo: inv.invoice_no,
    period: inv.period_label,
    plan: inv.plan_name,
    amount: Number(inv.amount),
    status: inv.status,
    issuedDate: inv.issued_date,
  }));

  return <BillingClient subscription={subscription} invoices={invoices} />;
}
