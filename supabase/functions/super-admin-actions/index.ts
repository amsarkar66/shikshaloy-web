import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Mobile-app counterpart to three Next.js Server Actions that can't be
// reached as plain HTTP from outside the Next.js runtime, and that need
// privileged (service-role) access because `schools`/`staff_members` RLS
// only grants a single-school scope — there's no institution-wide policy —
// same reason these web actions go through `supabaseAdmin` instead of the
// user's own session client (see `submit-onboarding` for the identical
// auth pattern this function reuses). Keep each action in sync with its
// web counterpart if that ever changes:
//   - create_school          → app/dashboard/schools/actions.ts's createAdditionalSchool
//   - list_institution_staff → app/dashboard/people/page.tsx's staff query
//   - create_razorpay_order  → app/dashboard/billing/actions.ts's createRazorpayOrder

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Kept in sync with app/dashboard/billing/_data/billing.ts's PLANS — this
// Deno function can't import that Next.js module directly. `null` price
// means "contact sales", matching web's own guard in createRazorpayOrder.
const PLAN_PRICES: Record<string, number | null> = {
  free: 0,
  standard: 999,
  premium: 1999,
  enterprise: null,
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

async function createSchool(adminClient: SupabaseClient, institutionId: string, body: Record<string, unknown>) {
  const [{ data: subscription }, { count: schoolCount }] = await Promise.all([
    adminClient.from("school_subscriptions").select("max_schools").eq("institution_id", institutionId).maybeSingle(),
    adminClient.from("schools").select("id", { count: "exact", head: true }).eq("institution_id", institutionId),
  ]);
  const maxSchools = (subscription?.max_schools as number | undefined) ?? 1;
  const schoolsUsed = schoolCount ?? 0;
  if (schoolsUsed >= maxSchools) {
    return jsonResponse(
      { error: `Your plan allows up to ${maxSchools} school${maxSchools === 1 ? "" : "s"}. Upgrade your plan to add another.` },
      400
    );
  }

  const { data: school, error } = await adminClient
    .from("schools")
    .insert({
      institution_id: institutionId,
      name: body.name,
      institution_type: body.institutionType ?? null,
      established_year: body.establishedYear ?? null,
      city: body.city ?? null,
      state: body.state ?? null,
      country: body.country ?? "India",
      address: body.address ?? null,
      phone: body.phone ?? null,
      website: body.website ?? null,
      principal_name: body.principalName ?? null,
      principal_email: body.principalEmail ?? null,
      status: "active",
    })
    .select("id")
    .single();
  if (error || !school) return jsonResponse({ error: "Could not add the new school. Please try again." }, 400);

  await adminClient
    .from("school_subscriptions")
    .update({ schools_used: schoolsUsed + 1 })
    .eq("institution_id", institutionId);

  // Indian academic year runs Apr–Mar — same convention as submit-onboarding.
  const today = new Date();
  const startYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
  await adminClient.from("academic_years").insert({
    school_id: school.id,
    name: `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`,
    start_date: `${startYear}-04-01`,
    end_date: `${startYear + 1}-03-31`,
    is_current: true,
  });

  return jsonResponse({ id: school.id });
}

async function listInstitutionStaff(adminClient: SupabaseClient, institutionId: string) {
  const { data: schoolRows } = await adminClient.from("schools").select("id, name").eq("institution_id", institutionId).order("name");
  const schoolIds = (schoolRows ?? []).map((s) => s.id as string);
  if (schoolIds.length === 0) return jsonResponse({ staff: [] });

  const { data: staffRows } = await adminClient
    .from("staff_members")
    .select("id, full_name, phone, email, type, designation, department, status, school_id")
    .in("school_id", schoolIds)
    .order("full_name");

  const schoolNameById = new Map((schoolRows ?? []).map((s) => [s.id as string, s.name as string]));
  const staff = (staffRows ?? []).map((s) => ({ ...s, school_name: schoolNameById.get(s.school_id as string) ?? "" }));
  return jsonResponse({ staff });
}

async function createRazorpayOrder(institutionId: string, body: Record<string, unknown>) {
  const planId = body.planId as string;
  const price = PLAN_PRICES[planId];
  if (price === undefined) return jsonResponse({ error: "Unknown plan." }, 400);
  if (price === null) return jsonResponse({ error: "Contact sales for this plan." }, 400);

  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keyId || !keySecret) return jsonResponse({ error: "Razorpay is not configured. Contact support." }, 500);

  const receipt = `plan-${planId}-${institutionId.slice(0, 8)}-${Date.now()}`;
  const auth = btoa(`${keyId}:${keySecret}`);
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: price * 100, currency: "INR", receipt, notes: { institutionId, planId } }),
  });
  if (!res.ok) {
    const text = await res.text();
    return jsonResponse({ error: `Razorpay order creation failed: ${text}` }, 502);
  }
  const order = await res.json();
  return jsonResponse({
    orderId: order.id,
    amount: price,
    currency: "INR",
    keyId: Deno.env.get("NEXT_PUBLIC_RAZORPAY_KEY_ID") ?? keyId,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ error: "Missing authorization" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SECRET_KEY")!;

  const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const {
    data: { user },
  } = await callerClient.auth.getUser();
  if (!user) return jsonResponse({ error: "Unauthorized." }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Resolve role from `profiles`, not the JWT's user_metadata — same fix as
  // lib/auth/verified-role.ts on the web side (see submit-onboarding).
  const { data: profile } = await adminClient.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "super_admin") return jsonResponse({ error: "Unauthorized." }, 401);

  const { data: institution } = await adminClient.from("institutions").select("id").eq("owner_id", user.id).maybeSingle();
  if (!institution) return jsonResponse({ error: "No institution found for this account." }, 400);
  const institutionId = institution.id as string;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  switch (body.action) {
    case "create_school":
      return await createSchool(adminClient, institutionId, body);
    case "list_institution_staff":
      return await listInstitutionStaff(adminClient, institutionId);
    case "create_razorpay_order":
      return await createRazorpayOrder(institutionId, body);
    default:
      return jsonResponse({ error: "Unknown action." }, 400);
  }
});
