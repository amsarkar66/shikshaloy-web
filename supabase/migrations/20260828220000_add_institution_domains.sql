-- ============================================================
-- Custom domains — lets an institution owner (super_admin) point their
-- own domain (bought elsewhere, DNS not under our control) at their
-- Shikshaloy public site instead of hosting/building one themselves.
-- Verification + per-domain SSL is handled by Cloudflare for SaaS
-- (Custom Hostnames); this table just tracks the mapping and the
-- Cloudflare-side state so the dashboard can show setup progress.
-- ============================================================

create table institution_domains (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid        not null references profiles(id) on delete cascade,
  domain                text        not null unique,
  status                text        not null default 'pending' check (status in ('pending', 'verifying', 'active', 'failed')),
  cloudflare_hostname_id text,
  ssl_status            text,
  error_message         text,
  verified_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index institution_domains_owner_id_idx on institution_domains(owner_id);

alter table institution_domains enable row level security;

create policy "institution_domains: owner access"
  on institution_domains for all
  using (owner_id = auth.uid() or auth_role() = 'kernel');

-- Anonymous visitors hitting a connected custom domain need to resolve
-- host -> owner before we've authenticated anyone, so active domains are
-- readable by anyone (domain name + owner id are not sensitive — that's
-- the whole point of a public site).
create policy "institution_domains: public read active"
  on institution_domains for select
  using (status = 'active');
