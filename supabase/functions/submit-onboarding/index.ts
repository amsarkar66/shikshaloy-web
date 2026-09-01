import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Mobile-app counterpart to app/onboarding/actions.ts's `submitOnboarding`
// server action. Next.js Server Actions aren't reachable as a plain HTTP
// endpoint from outside the Next.js runtime, and the insert below needs the
// service-role key (institutions/schools have no client-facing INSERT RLS
// policy — only "kernel full access" — same reason the web action itself
// goes through `supabaseAdmin` instead of the user's own session client).
// Keep this in sync with actions.ts if that ever changes.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InstitutionFormData {
  name: string;
  institutionType: string;
  board: string;
  establishedYear: string;
  city: string;
  state: string;
  country: string;
  address: string;
  pinCode: string;
  studentRange: string;
  staffRange: string;
  gradesFrom: string;
  gradesTo: string;
  tagline: string;
  phone: string;
  email: string;
  website: string;
  udiseCode: string;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS_HEADERS });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ error: "Missing authorization" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SECRET_KEY")!;

  // Scoped to the caller — used only to identify who's asking, same as the
  // web action's getUser().
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
  } = await callerClient.auth.getUser();

  if (!user) {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  // Privileged client for the actual writes, mirroring web's supabaseAdmin.
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Resolve role from `profiles`, not the JWT's user_metadata — that's
  // editable by the signed-in user themselves via
  // supabase.auth.updateUser({ data: {...} }), so it can't be trusted for
  // authorization. Same fix as lib/auth/verified-role.ts on the web side;
  // this function can't import that Next.js module directly, so the
  // equivalent check is inlined here against the same `profiles` table.
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "super_admin") {
    return jsonResponse({ error: "Unauthorized." }, 401);
  }

  let input: InstitutionFormData;
  try {
    input = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  const { data: existingInstitution } = await adminClient
    .from("institutions")
    .select("id, status")
    .eq("owner_id", user.id)
    .maybeSingle();

  // Only a rejected application can be resubmitted in place — anything else
  // (pending/active) already went through onboarding once.
  if (existingInstitution && existingInstitution.status !== "rejected") {
    return jsonResponse({ error: "You've already completed onboarding." });
  }

  const institutionFields = {
    name: input.name,
    type: input.institutionType,
    city: input.city,
    state: input.state,
    country: input.country || "India",
    address: input.address || null,
    phone: input.phone,
    email: input.email || null,
    website: input.website || null,
    status: "pending" as const,
  };

  const schoolFields = {
    name: input.name,
    institution_type: input.institutionType,
    board: input.board || null,
    established_year: input.establishedYear ? Number(input.establishedYear) : null,
    city: input.city,
    state: input.state,
    country: input.country || "India",
    address: input.address || null,
    pin_code: input.pinCode || null,
    student_range: input.studentRange || null,
    staff_range: input.staffRange || null,
    grades_from: input.gradesFrom || null,
    grades_to: input.gradesTo || null,
    tagline: input.tagline || null,
    phone: input.phone,
    email: input.email || null,
    website: input.website || null,
    udise_code: input.udiseCode || null,
    status: "pending" as const,
  };

  if (existingInstitution) {
    const { error: institutionError } = await adminClient
      .from("institutions")
      .update(institutionFields)
      .eq("id", existingInstitution.id);
    if (institutionError) {
      return jsonResponse({ error: "Could not resubmit your institution. Please try again." });
    }

    const { data: existingSchool } = await adminClient
      .from("schools")
      .select("id")
      .eq("institution_id", existingInstitution.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingSchool) {
      await adminClient.from("schools").update(schoolFields).eq("id", existingSchool.id);
    }
  } else {
    const { data: institution, error: institutionError } = await adminClient
      .from("institutions")
      .insert({ ...institutionFields, owner_id: user.id })
      .select("id")
      .single();
    if (institutionError || !institution) {
      return jsonResponse({ error: "Could not create your institution. Please try again." });
    }

    const { data: school, error: schoolError } = await adminClient
      .from("schools")
      .insert({ institution_id: institution.id, ...schoolFields })
      .select("id")
      .single();
    if (schoolError || !school) {
      return jsonResponse({ error: "Could not create your institution. Please try again." });
    }

    // Free plan — kept in sync with app/dashboard/billing/_data/billing.ts's
    // "free" entry (price 0, 1 school) since this Deno function can't
    // import that Next.js module directly.
    const renewsOn = new Date();
    renewsOn.setDate(renewsOn.getDate() + 30);

    await adminClient.from("school_subscriptions").insert({
      institution_id: institution.id,
      plan_id: "free",
      plan_name: "Free",
      status: "active",
      schools_used: 1,
      max_schools: 1,
      monthly_fee: 0,
      renews_on: renewsOn.toISOString().slice(0, 10),
    });

    // Indian academic year runs Apr–Mar; before April we're still in the
    // previous cycle's year, e.g. Feb 2027 is inside the "2026-27" year.
    const today = new Date();
    const startYear = today.getMonth() >= 3 ? today.getFullYear() : today.getFullYear() - 1;
    await adminClient.from("academic_years").insert({
      school_id: school.id,
      name: `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`,
      start_date: `${startYear}-04-01`,
      end_date: `${startYear + 1}-03-31`,
      is_current: true,
    });
  }

  return jsonResponse({});
});
