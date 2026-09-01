import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import InvoicesClient, { type PlatformInvoice } from "./_components/InvoicesClient";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const vu = await getVerifiedUser();
  if (!vu) redirect("/login");
  if (vu.role !== "kernel") redirect("/dashboard");

  const [{ data: invoiceRows }, { data: institutions }] = await Promise.all([
    supabaseAdmin
      .from("subscription_invoices")
      .select("id, institution_id, invoice_no, period_label, plan_name, amount, status, issued_date")
      .order("issued_date", { ascending: false }),
    supabaseAdmin.from("institutions").select("id, name"),
  ]);

  const institutionsById = new Map((institutions ?? []).map((i) => [i.id, i.name]));

  const invoices: PlatformInvoice[] = (invoiceRows ?? []).map((inv) => ({
    id: inv.id,
    schoolName: institutionsById.get(inv.institution_id) ?? "—",
    invoiceNo: inv.invoice_no,
    period: inv.period_label,
    plan: inv.plan_name,
    amount: Number(inv.amount),
    status: inv.status,
    issuedDate: inv.issued_date,
  }));

  return <InvoicesClient invoices={invoices} />;
}
