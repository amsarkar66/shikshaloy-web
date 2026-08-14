-- Academic configuration, one row per school
create table if not exists public.school_academic_settings (
  school_id            uuid primary key references public.schools(id) on delete cascade,
  working_days         text[]      not null default array['Mon','Tue','Wed','Thu','Fri','Sat'],
  periods_per_day      integer     not null default 8,
  period_duration_mins integer     not null default 45,
  attendance_threshold integer     not null default 75,
  grading_scale        text        not null default 'percentage',
  pass_marks           integer     not null default 35,
  updated_at           timestamptz not null default now()
);

-- Custom/built-in staff role permission templates, per school
create table if not exists public.role_templates (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid        not null references public.schools(id) on delete cascade,
  slug        text        not null,
  name        text        not null,
  description text        default '',
  is_builtin  boolean     not null default false,
  permissions jsonb       not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (school_id, slug)
);

-- Per-user notification channel preferences
create table if not exists public.notification_preferences (
  profile_id  uuid primary key references public.profiles(id) on delete cascade,
  prefs       jsonb       not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
