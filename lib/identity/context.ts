import { cache } from "react";
import { cookies } from "next/headers";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { getAvailableIdentities, type DashboardIdentity } from "./resolve";

export const ACTIVE_IDENTITY_COOKIE = "active_identity";

export interface ActiveIdentity {
  key: string;
  identities: DashboardIdentity[];
}

// Cached per request (same pattern as getVerifiedUser in verified-role.ts)
// so dashboard/layout.tsx's sidebar and dashboard/page.tsx's view routing
// resolve the exact same identity without a second round-trip — the two
// disagreeing was the actual bug found when this was still just an
// isAdmin() check duplicated in both places (role-and-identity-model.md §9).
export const getActiveIdentity = cache(async (): Promise<ActiveIdentity | null> => {
  const vu = await getVerifiedUser();
  if (!vu) return null;

  const identities = await getAvailableIdentities(vu);

  const cookieStore = await cookies();
  const requested = cookieStore.get(ACTIVE_IDENTITY_COOKIE)?.value;
  const key = requested && identities.some((i) => i.key === requested) ? requested : identities[0].key;

  return { key, identities };
});
