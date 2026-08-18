create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid        not null references public.schools(id) on delete cascade,
  recipient_id uuid        not null references public.profiles(id) on delete cascade,
  title        text        not null,
  description  text        not null default '',
  link         text,
  read         boolean     not null default false,
  created_at   timestamptz not null default now()
);

create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;

-- Inserts are always made by the service role (from server actions), so no
-- insert policy is needed — recipients only ever read/update their own rows.
create policy "notifications: recipient can read own"
  on public.notifications for select
  using (recipient_id = auth.uid());

create policy "notifications: recipient can update own"
  on public.notifications for update
  using (recipient_id = auth.uid());
