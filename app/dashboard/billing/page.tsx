import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import BillingClient, { type BillTo } from "./_components/BillingClient";
import type { Subscription, Invoice } from "./_data/billing";

export default async function BillingPage() {
  const institutionId = await getCurrentInstitutionIdOrThrow();

  const [{ data: subRow }, { data: invoiceRows }, { data: schoolRows }, { data: institutionRow }] = await Promise.all([
    supabaseAdmin
      .from("school_subscriptions")
      .select("plan_id, plan_name, status, schools_used, max_schools, monthly_fee, renews_on, payment_method_summary")
      .eq("institution_id", institutionId)
      .single(),

    supabaseAdmin
      .from("subscription_invoices")
      .select(
        "id, invoice_no, period_label, plan_id, plan_name, amount, status, issued_date, payment_method, offline_reference, offline_note, offline_receipt_url, verified_at"
      )
      .eq("institution_id", institutionId)
      .order("issued_date", { ascending: false }),

    supabaseAdmin.from("schools").select("id").eq("institution_id", institutionId),

    supabaseAdmin.from("institutions").select("name, city, country, email").eq("id", institutionId).maybeSingle(),
  ]);

  const schoolIds = (schoolRows ?? []).map((s) => s.id);
  const { count: studentsUsed } = schoolIds.length
    ? await supabaseAdmin.from("students").select("id", { count: "exact", head: true }).in("school_id", schoolIds)
    : { count: 0 };

  const subscription: Subscription | null = subRow
    ? {
        planId: subRow.plan_id,
        planName: subRow.plan_name,
        status: subRow.status,
        schoolsUsed: subRow.schools_used,
        maxSchools: subRow.max_schools,
        studentsUsed: studentsUsed ?? 0,
        monthlyFee: Number(subRow.monthly_fee),
        renewsOn: subRow.renews_on,
        paymentMethodSummary: subRow.payment_method_summary,
      }
    : null;

  const invoices: Invoice[] = (invoiceRows ?? []).map((inv) => ({
    id: inv.id,
    invoiceNo: inv.invoice_no,
    period: inv.period_label,
    plan: inv.plan_name,
    planId: inv.plan_id,
    amount: Number(inv.amount),
    status: inv.status,
    issuedDate: inv.issued_date,
    paymentMethod: inv.payment_method,
    offlineReference: inv.offline_reference,
    offlineNote: inv.offline_note,
    offlineReceiptUrl: inv.offline_receipt_url,
    verifiedAt: inv.verified_at,
  }));

  const billTo: BillTo | null = institutionRow
    ? {
        orgName: institutionRow.name ?? "—",
        location: [institutionRow.city, institutionRow.country].filter(Boolean).join(", ") || null,
        email: institutionRow.email,
      }
    : null;

  return <BillingClient subscription={subscription} invoices={invoices} billTo={billTo} />;
}
