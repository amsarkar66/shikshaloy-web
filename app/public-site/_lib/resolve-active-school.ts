import type { PublicSchool } from "@/lib/domains/public-site-data";

// Pure helper, safe to import from client components — unlike
// lib/domains/public-site-data.ts, this has no supabaseAdmin/service-role
// dependency that must never end up in a client bundle.
export function resolveActiveSchool(schools: PublicSchool[], requestedId: string | undefined): PublicSchool {
  const requested = requestedId ? schools.find((s) => s.id === requestedId) : undefined;
  return requested ?? schools[0];
}
