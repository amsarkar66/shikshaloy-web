import { redirect, notFound } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import InvoiceDetailClient, { type InvoiceDetail } from "@/app/dashboard/billing/_components/InvoiceDetailClient";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const role = user.user_metadata?.role as string | undefined;
  if (role !== "kernel") redirect("/dashboard");

  const { data: inv } = await supabaseAdmin
    .from("subscription_invoices")
    .select(
      "id, institution_id, invoice_no, period_label, plan_name, amount, status, issued_date, created_at, payment_method, offline_reference, offline_receipt_url, verified_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (!inv) notFound();

  const { data: institution } = await supabaseAdmin
    .from("institutions")
    .select("id, name, address, city, state, country, phone, email, website")
    .eq("id", inv.institution_id)
    .maybeSingle();

  const { data: subscription } = await supabaseAdmin
    .from("school_subscriptions")
    .select("payment_method_summary")
    .eq("institution_id", inv.institution_id)
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
    paymentMethodSummary: subscription?.payment_method_summary ?? null,
    paymentMethod: inv.payment_method,
    offlineReference: inv.offline_reference,
    offlineReceiptUrl: inv.offline_receipt_url,
    verifiedAt: inv.verified_at,
  };

  return <InvoiceDetailClient invoice={invoice} />;
}
