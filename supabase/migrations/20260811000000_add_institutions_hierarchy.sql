-- Introduces a real "institution" entity above `schools`, so one owner can
-- run a group of schools/colleges under one named institution (e.g. a
-- university owning several colleges) instead of the previous flat model
-- where `schools.owner_id` was the only grouping mechanism and there was no
-- shared, named parent record.

-- ============================================================
-- INSTITUTIONS
-- ============================================================

create table institutions (
  id          uuid primary key default gen_random_uuid(),
  name        text           not null,
  type        text,                              -- university | school_group | trust | single_school
  owner_id    uuid           references profiles(id) on delete set null,
  address     text,
  city        text,
  state       text,
  country     text           default 'India',
  phone       text,
  email       text,
  website     text,
  logo_url    text,
  status      account_status default 'pending',  -- kernel approval gate, moved up from schools
  created_at  timestamptz    default now(),
  updated_at  timestamptz    default now()
);

create index institutions_owner_idx on institutions(owner_id);

alter table schools
  add column institution_id uuid references institutions(id) on delete set null;

-- ============================================================
-- BACKFILL — one institution per existing school, correlated 1:1 by school
-- id (not by owner_id, so this stays correct even if two schools ever
-- shared an owner_id — today every owner has at most one school, but this
-- doesn't rely on that).
-- ============================================================

create temporary table institution_backfill as
select gen_random_uuid() as new_institution_id, s.*
from schools s;

insert into institutions (id, name, type, owner_id, address, city, state, country, phone, email, website, logo_url, status, created_at, updated_at)
select new_institution_id, name, institution_type, owner_id, address, city, state, country, phone, email, website, logo_url, status, created_at, updated_at
from institution_backfill;

update schools s
set institution_id = b.new_institution_id
from institution_backfill b
where b.id = s.id;

drop table institution_backfill;

alter table schools
  alter column institution_id set not null;

-- ============================================================
-- SUBSCRIPTIONS / INVOICES — move from per-school to per-institution
-- ============================================================

alter table school_subscriptions
  add column institution_id uuid references institutions(id);

update school_subscriptions ss
set institution_id = s.institution_id
from schools s
where s.id = ss.school_id;

alter table school_subscriptions
  alter column institution_id set not null;

alter table school_subscriptions
  drop constraint school_subscriptions_school_id_key;

alter table school_subscriptions
  drop column school_id;

alter table school_subscriptions
  add constraint school_subscriptions_institution_id_key unique (institution_id);

alter table subscription_invoices
  add column institution_id uuid references institutions(id);

update subscription_invoices si
set institution_id = s.institution_id
from schools s
where s.id = si.school_id;

alter table subscription_invoices
  alter column institution_id set not null;

alter table subscription_invoices
  drop column school_id;

drop index if exists subscription_invoices_school_idx;
create index subscription_invoices_institution_idx on subscription_invoices(institution_id, issued_date desc);

-- ============================================================
-- RLS — rewrite the schools policy to stop depending on owner_id BEFORE
-- dropping that column below.
-- ============================================================

alter table institutions enable row level security;

create policy "institutions: kernel full access"
  on institutions for all
  using (auth_role() = 'kernel');

create policy "institutions: owner and members can read"
  on institutions for select
  using (owner_id = auth.uid() or id = (select institution_id from schools where id = auth_school_id()));

drop policy "schools: members read" on schools;

create policy "schools: members read"
  on schools for select
  using (
    institution_id in (select id from institutions where owner_id = auth.uid())
    or id = auth_school_id()
    or auth_role() = 'kernel'
  );

-- ============================================================
-- OWNERSHIP CUTOVER — owner_id now lives on institutions only
-- ============================================================

alter table schools
  drop column owner_id;
