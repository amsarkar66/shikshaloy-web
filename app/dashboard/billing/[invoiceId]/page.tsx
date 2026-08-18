import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import InvoiceDetailClient, { type InvoiceDetail } from "../_components/InvoiceDetailClient";

export const dynamic = "force-dynamic";

export default async function BillingInvoiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ invoiceId: string }>;
  searchParams: Promise<{ download?: string }>;
}) {
  const { invoiceId } = await params;
  const { download } = await searchParams;
  const institutionId = await getCurrentInstitutionIdOrThrow();

  const { data: inv } = await supabaseAdmin
    .from("subscription_invoices")
    .select(
      "id, institution_id, invoice_no, period_label, plan_name, amount, status, issued_date, created_at, payment_method, payment_method_summary, razorpay_method, razorpay_method_detail, offline_reference, offline_receipt_url, verified_at"
    )
    .eq("id", invoiceId)
    .maybeSingle();

  if (!inv || inv.institution_id !== institutionId) notFound();

  const { data: institution } = await supabaseAdmin
    .from("institutions")
    .select("id, name, address, city, state, country, phone, email, website")
    .eq("id", institutionId)
    .maybeSingle();

  const { data: subscription } = await supabaseAdmin
    .from("school_subscriptions")
    .select("payment_method_summary, razorpay_method_detail")
    .eq("institution_id", institutionId)
    .maybeSingle();

  const invoice: InvoiceDetail = {
    id: inv.id,
    invoiceNo: inv.invoice_no,
    period: inv.period_label,
    plan: inv.plan_name,
    amount: Number(inv.amount),
    status: inv.status,
    issuedDate: inv.issued_date,
    createdAt: inv.created_at,
    billTo: {
      name: institution?.name ?? "—",
      address: institution?.address ?? null,
      city: institution?.city ?? null,
      state: institution?.state ?? null,
      country: institution?.country ?? null,
      phone: institution?.phone ?? null,
      email: institution?.email ?? null,
      website: institution?.website ?? null,
    },
    paymentMethodSummary:
      inv.payment_method_summary ?? (inv.payment_method === "razorpay" ? subscription?.payment_method_summary : null) ?? null,
    paymentMethod: inv.payment_method,
    razorpayMethod: inv.razorpay_method,
    razorpayMethodDetail:
      inv.razorpay_method_detail ?? (inv.payment_method === "razorpay" ? subscription?.razorpay_method_detail : null) ?? null,
    offlineReference: inv.offline_reference,
    offlineReceiptUrl: inv.offline_receipt_url,
    verifiedAt: inv.verified_at,
  };

  return (
    <InvoiceDetailClient
      invoice={invoice}
      backHref="/dashboard/billing"
      backLabel="Back to Billing"
      autoDownload={download === "1"}
    />
  );
}
