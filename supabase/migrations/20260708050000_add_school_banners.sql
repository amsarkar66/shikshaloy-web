create table school_banners (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid        not null references schools(id) on delete cascade,
  image_url     text        not null,
  display_order integer     not null default 0,
  created_at    timestamptz not null default now()
);

create index school_banners_school_id_idx on school_banners(school_id);

alter table school_banners enable row level security;

create policy "school_banners: school access"
  on school_banners for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

-- Carry forward any existing single banner as the first row.
insert into school_banners (school_id, image_url, display_order)
select id, banner_url, 0 from schools where banner_url is not null;

alter table schools drop column banner_url;
