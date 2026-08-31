import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/service";
import { DEFAULT_SITE_SETTINGS, normalizeSiteSettings, type SiteSettings } from "./types";

// Read-only site-settings lookups for the public site (app/public-site/[ownerId])
// and its draft-mode preview. `ownerId` is institutions.owner_id, matching
// the param the public-site routes already key off (see
// lib/domains/public-site-data.ts). Institutions that haven't set up a
// Website config yet (no row, or no publish) fall back to
// DEFAULT_SITE_SETTINGS so nothing breaks for existing sites.

async function resolveInstitutionId(ownerId: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from("institutions").select("id").eq("owner_id", ownerId).maybeSingle();
  return data?.id ?? null;
}

export const getPublishedSiteSettings = cache(async (ownerId: string): Promise<SiteSettings> => {
  const institutionId = await resolveInstitutionId(ownerId);
  if (!institutionId) return DEFAULT_SITE_SETTINGS;

  const { data } = await supabaseAdmin
    .from("institution_site_settings")
    .select("published")
    .eq("institution_id", institutionId)
    .maybeSingle();

  return data?.published ? normalizeSiteSettings(data.published) : DEFAULT_SITE_SETTINGS;
});

// Only ever read when Next.js Draft Mode is enabled (gated at the point
// draft mode is turned on — see app/api/website/preview/route.ts, which
// requires an authenticated `admin`). The signed, httpOnly draft-mode
// cookie is the credential for every request after that, same as any
// other Next.js draft-mode preview link.
export const getDraftSiteSettings = cache(async (ownerId: string): Promise<SiteSettings> => {
  const institutionId = await resolveInstitutionId(ownerId);
  if (!institutionId) return DEFAULT_SITE_SETTINGS;

  const { data } = await supabaseAdmin
    .from("institution_site_settings")
    .select("draft")
    .eq("institution_id", institutionId)
    .maybeSingle();

  return data?.draft ? normalizeSiteSettings(data.draft) : DEFAULT_SITE_SETTINGS;
});
