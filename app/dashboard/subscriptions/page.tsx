import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import SubscriptionsClient, { type PlatformSubscription } from "./_components/SubscriptionsClient";

export const dynamic = "force-dynamic";

export default async function SubscriptionsPage() {
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const role = user.user_metadata?.role as string | undefined;
  if (role !== "kernel") redirect("/dashboard");

  const [{ data: subs }, { data: institutions }, { data: pendingInvoices }] = await Promise.all([
    supabaseAdmin
      .from("school_subscriptions")
      .select(
        "id, institution_id, plan_id, plan_name, status, schools_used, max_schools, monthly_fee, renews_on, payment_method_summary"
      )
      .order("renews_on", { ascending: true }),
    supabaseAdmin.from("institutions").select("id, name, status"),
    supabaseAdmin
      .from("subscription_invoices")
      .select("institution_id")
      .eq("status", "pending")
      .eq("payment_method", "offline"),
  ]);

  const institutionsById = new Map((institutions ?? []).map((i) => [i.id, i]));
  const pendingByInstitution = new Set((pendingInvoices ?? []).map((inv) => inv.institution_id));

  const subscriptions: PlatformSubscription[] = (subs ?? []).map((s) => {
    const institution = institutionsById.get(s.institution_id);
    return {
      id: s.id,
      schoolId: s.institution_id,
      schoolName: institution?.name ?? "—",
      institutionStatus: (institution?.status as PlatformSubscription["institutionStatus"]) ?? "active",
      planId: s.plan_id,
      planName: s.plan_name,
      status: s.status,
      schoolsUsed: s.schools_used,
      maxSchools: s.max_schools,
      monthlyFee: Number(s.monthly_fee),
      renewsOn: s.renews_on,
      paymentMethodSummary: s.payment_method_summary,
      pendingVerification: pendingByInstitution.has(s.institution_id),
    };
  });

  return <SubscriptionsClient subscriptions={subscriptions} />;
}
