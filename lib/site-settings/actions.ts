"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import { logAuditEvent } from "@/lib/audit/log";
import {
  DEFAULT_SITE_SETTINGS,
  normalizeSiteSettings,
  type CarouselSlide,
  type SiteSettings,
} from "./types";

// Website branding is edited by the institution owner (`super_admin`) —
// an owner has exactly one institution (institutions.owner_id = user.id),
// so there's no cross-admin sharing to reason about here.
async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as string | undefined;
  if (!user || role !== "super_admin") throw new Error("Unauthorized");
  return user;
}

async function requireInstitutionId(): Promise<string> {
  await requireSuperAdmin();
  return getCurrentInstitutionIdOrThrow();
}

interface SettingsRow {
  draft: unknown;
  published: unknown;
  published_at: string | null;
}

async function getOrCreateRow(institutionId: string): Promise<SettingsRow> {
  const { data, error } = await supabaseAdmin
    .from("institution_site_settings")
    .select("draft, published, published_at")
    .eq("institution_id", institutionId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load site settings: ${error.message}`);
  if (data) return data;

  const { data: created, error: insertError } = await supabaseAdmin
    .from("institution_site_settings")
    .upsert({ institution_id: institutionId, draft: DEFAULT_SITE_SETTINGS }, { onConflict: "institution_id" })
    .select("draft, published, published_at")
    .single();

  if (insertError || !created) throw new Error(insertError?.message ?? "Failed to initialize site settings");
  return created;
}

export async function getSiteSettings(): Promise<{
  draft: SiteSettings;
  published: SiteSettings | null;
  publishedAt: string | null;
}> {
  const institutionId = await requireInstitutionId();
  const row = await getOrCreateRow(institutionId);

  return {
    draft: normalizeSiteSettings(row.draft),
    published: row.published ? normalizeSiteSettings(row.published) : null,
    publishedAt: row.published_at,
  };
}

export async function saveDraftSection<K extends keyof SiteSettings>(
  section: K,
  data: SiteSettings[K]
): Promise<void> {
  const user = await requireSuperAdmin();
  const institutionId = await requireInstitutionId();
  const row = await getOrCreateRow(institutionId);

  const draft = normalizeSiteSettings(row.draft);
  draft[section] = data;

  const { error } = await supabaseAdmin
    .from("institution_site_settings")
    .update({ draft, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq("institution_id", institutionId);

  if (error) throw new Error(`Failed to save changes: ${error.message}`);
  revalidatePath("/dashboard/website");
}

export async function publishSite(): Promise<void> {
  const user = await requireSuperAdmin();
  const institutionId = await requireInstitutionId();
  const row = await getOrCreateRow(institutionId);

  const draft = normalizeSiteSettings(row.draft);

  const { error } = await supabaseAdmin
    .from("institution_site_settings")
    .update({
      published: draft,
      published_at: new Date().toISOString(),
      published_by: user.id,
    })
    .eq("institution_id", institutionId);

  if (error) throw new Error(`Failed to publish: ${error.message}`);

  const schoolId = await getCurrentSchoolIdOrThrow();
  await logAuditEvent({
    schoolId,
    action: "update",
    module: "website",
    description: "Published website changes",
  });

  revalidatePath("/dashboard/website");
  revalidatePath("/public-site", "layout");
}

export async function discardDraft(): Promise<void> {
  const user = await requireSuperAdmin();
  const institutionId = await requireInstitutionId();
  const row = await getOrCreateRow(institutionId);

  const resetTo = row.published ? normalizeSiteSettings(row.published) : DEFAULT_SITE_SETTINGS;

  const { error } = await supabaseAdmin
    .from("institution_site_settings")
    .update({ draft: resetTo, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq("institution_id", institutionId);

  if (error) throw new Error(`Failed to discard draft: ${error.message}`);

  const schoolId = await getCurrentSchoolIdOrThrow();
  await logAuditEvent({
    schoolId,
    action: "update",
    module: "website",
    description: "Discarded draft website changes",
  });

  revalidatePath("/dashboard/website");
}

export async function updateCarouselSlides(schoolId: string, slides: CarouselSlide[]): Promise<void> {
  const user = await requireSuperAdmin();
  const institutionId = await requireInstitutionId();
  const row = await getOrCreateRow(institutionId);

  const draft = normalizeSiteSettings(row.draft);
  const rest = draft.carousel.filter((c) => c.schoolId !== schoolId);
  draft.carousel = [...rest, { schoolId, slides }];

  const { error } = await supabaseAdmin
    .from("institution_site_settings")
    .update({ draft, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq("institution_id", institutionId);

  if (error) throw new Error(`Failed to save carousel: ${error.message}`);
  revalidatePath("/dashboard/website");
}

export interface DomainSummary {
  domain: string;
  status: "pending" | "verifying" | "active" | "failed";
  sslStatus: string | null;
  verifiedAt: string | null;
}

// Read-only view of the institution's connected domain for the Website
// page's Domain tab — actually adding/removing a domain still happens on
// the Settings page (lib/domains/actions.ts), which this just links out to.
export async function getInstitutionDomainSummary(): Promise<DomainSummary | null> {
  await requireSuperAdmin();
  const institutionId = await requireInstitutionId();

  const { data: institution } = await supabaseAdmin
    .from("institutions")
    .select("owner_id")
    .eq("id", institutionId)
    .maybeSingle();
  if (!institution?.owner_id) return null;

  const { data } = await supabaseAdmin
    .from("institution_domains")
    .select("domain, status, ssl_status, verified_at")
    .eq("owner_id", institution.owner_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;

  return {
    domain: data.domain,
    status: data.status as DomainSummary["status"],
    sslStatus: data.ssl_status,
    verifiedAt: data.verified_at,
  };
}

export interface WebsiteActivityEntry {
  id: string;
  actorName: string;
  actorRole: string;
  description: string;
  createdAt: string;
}

// Recent publish/discard events, logged against whichever school is
// active when the owner publishes (audit_log is school-scoped), so this
// looks across every school in the institution to find them all.
export async function getWebsiteActivity(limit = 10): Promise<WebsiteActivityEntry[]> {
  await requireSuperAdmin();
  const institutionId = await requireInstitutionId();

  const { data: schools } = await supabaseAdmin.from("schools").select("id").eq("institution_id", institutionId);
  const schoolIds = (schools ?? []).map((s) => s.id);
  if (schoolIds.length === 0) return [];

  const { data } = await supabaseAdmin
    .from("audit_log")
    .select("id, actor_name, actor_role, description, created_at")
    .in("school_id", schoolIds)
    .eq("module", "website")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((e) => ({
    id: e.id,
    actorName: e.actor_name,
    actorRole: e.actor_role,
    description: e.description,
    createdAt: e.created_at,
  }));
}

export async function updateGallerySelection(schoolId: string, imageIds: string[]): Promise<void> {
  const user = await requireSuperAdmin();
  const institutionId = await requireInstitutionId();
  const row = await getOrCreateRow(institutionId);

  const draft = normalizeSiteSettings(row.draft);
  const rest = draft.gallery.filter((g) => g.schoolId !== schoolId);
  draft.gallery = [...rest, { schoolId, imageIds }];

  const { error } = await supabaseAdmin
    .from("institution_site_settings")
    .update({ draft, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq("institution_id", institutionId);

  if (error) throw new Error(`Failed to save gallery selection: ${error.message}`);
  revalidatePath("/dashboard/website");
}
