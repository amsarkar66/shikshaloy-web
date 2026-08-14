-- ============================================================
-- Public publish-key system — an institution owner (super_admin)
-- generates a key that lets an external public website fetch
-- their schools' public profile, announcements, and events.
-- ============================================================

create table public_site_keys (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid        not null references profiles(id) on delete cascade,
  key_hash     text        not null unique,
  key_prefix   text        not null,
  label        text,
  revoked_at   timestamptz,
  last_used_at timestamptz,
  created_at   timestamptz not null default now()
);

create index public_site_keys_owner_id_idx on public_site_keys(owner_id);

alter table public_site_keys enable row level security;

create policy "public_site_keys: owner access"
  on public_site_keys for all
  using (owner_id = auth.uid() or auth_role() = 'kernel');

-- Publish flags — only rows explicitly marked public are ever
-- returned by the public API route.
alter table announcements add column is_public boolean not null default false;
alter table school_events add column is_public boolean not null default false;
