import { redirect, notFound } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { getInstitution } from "@/lib/supabase/admin";
import { supabaseAdmin } from "@/lib/supabase/service";
import SubscriptionDetailClient from "./_components/SubscriptionDetailClient";
import type { Invoice, SubscriptionStatus } from "@/app/dashboard/billing/_data/billing";

export const dynamic = "force-dynamic";

export default async function SubscriptionDetailPage({
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

  const [result, { data: invoiceRows }, { data: schoolRows }] = await Promise.all([
    getInstitution(id),
    supabaseAdmin
      .from("subscription_invoices")
      .select(
        "id, invoice_no, period_label, plan_id, plan_name, amount, status, issued_date, payment_method, offline_reference, offline_note, offline_receipt_url"
      )
      .eq("institution_id", id)
      .order("issued_date", { ascending: false }),
    supabaseAdmin.from("schools").select("id").eq("institution_id", id),
  ]);

  if (!result) notFound();
  const { institution, subscription } = result;

  const schoolIds = (schoolRows ?? []).map((s) => s.id);
  const { count: studentsUsed } = schoolIds.length
    ? await supabaseAdmin.from("students").select("id", { count: "exact", head: true }).in("school_id", schoolIds)
    : { count: 0 };

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
  }));

  return (
    <SubscriptionDetailClient
      institutionId={institution.id}
      institutionName={institution.name ?? "—"}
      institutionStatus={institution.status}
      city={institution.city}
      state={institution.state}
      ownerName={institution.owner_full_name}
      ownerEmail={institution.owner_email}
      subscription={
        subscription
          ? {
              planId: subscription.plan_id ?? "starter",
              planName: subscription.plan_name ?? "—",
              status: (subscription.status as SubscriptionStatus) ?? "active",
              schoolsUsed: subscription.schools_used ?? 0,
              maxSchools: subscription.max_schools ?? 0,
              studentsUsed: studentsUsed ?? 0,
              monthlyFee: subscription.monthly_fee ?? 0,
              renewsOn: subscription.renews_on ?? "",
              paymentMethodSummary: subscription.payment_method_summary,
            }
          : null
      }
      invoices={invoices}
    />
  );
}
