-- ============================================================
-- Public site v2 — grievances, photo gallery, and a well-defined
-- key for the public "check my result" lookup.
-- ============================================================

create table grievances (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid        not null references schools(id) on delete cascade,
  name             text        not null,
  email            text,
  phone            text,
  category         text        not null default 'other',
  subject          text        not null,
  message          text        not null,
  status           text        not null default 'open',
  resolution_notes text,
  resolved_by      uuid        references profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index grievances_school_id_idx on grievances(school_id);

alter table grievances enable row level security;

create policy "grievances: school access"
  on grievances for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create table school_gallery (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid        not null references schools(id) on delete cascade,
  image_url      text        not null,
  caption        text,
  display_order  integer     not null default 0,
  created_at     timestamptz not null default now()
);

create index school_gallery_school_id_idx on school_gallery(school_id);

alter table school_gallery enable row level security;

create policy "school_gallery: school access"
  on school_gallery for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('school-gallery', 'school-gallery', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "school-gallery: public read"
  on storage.objects for select
  using (bucket_id = 'school-gallery');

-- Makes the public admission-no + DOB result lookup well-defined
-- (verified no existing duplicate school_id/admission_no pairs).
alter table students add constraint students_school_admission_no_key unique (school_id, admission_no);
