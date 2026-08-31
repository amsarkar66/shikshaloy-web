-- ============================================================
-- Institution "Website" editor — theme, header, footer, homepage
-- section layout, and carousel/gallery selection for an institution's
-- public site, staged as a draft and only applied to the live public
-- site (app/public-site/[ownerId]) when explicitly published.
--
-- One row per institution (branding is institution-wide, shared across
-- all of an institution's schools; carousel/gallery selection is still
-- per-school, tracked inside the JSON via a schoolId key). `published`
-- starts null — an institution that hasn't published yet renders the
-- public site exactly as it does today (implicit "unpublished" state),
-- so nothing changes for existing institutions until they opt in.
-- ============================================================

create table institution_site_settings (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid        not null unique references institutions(id) on delete cascade,
  draft          jsonb       not null default '{}'::jsonb,
  published      jsonb,
  published_at   timestamptz,
  published_by   uuid references profiles(id) on delete set null,
  updated_at     timestamptz not null default now(),
  updated_by     uuid references profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);

create index institution_site_settings_institution_id_idx on institution_site_settings(institution_id);

alter table institution_site_settings enable row level security;

-- Reuses the security-definer helpers from 20260822072124_fix_institutions_rls_recursion.sql
-- so this doesn't re-trigger institutions'/schools' own RLS policies.
create policy "institution_site_settings: institution access"
  on institution_site_settings for all
  using (
    institution_id = auth_institution_id()
    or institution_id = auth_owned_institution_id()
    or auth_role() = 'kernel'
  );

-- Draft mode preview (app/api/website/preview) needs to read the draft
-- JSON for an institution whose public site is being previewed. That
-- flow re-authenticates the requester as an admin of the institution in
-- application code (lib/domains/public-site-data.ts), then reads via
-- supabaseAdmin — same pattern as every other admin-only write in this
-- codebase (RLS above is defense-in-depth, not the enforcement path).
