create table if not exists public.contact_submissions (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  topic      text not null default 'other',
  message    text not null,
  created_at timestamptz not null default now()
);

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions(created_at desc);

alter table public.contact_submissions enable row level security;

-- Public marketing-site form has no session, so inserts go through the
-- server action's service-role client (like audit_log in dashboard/actions.ts)
-- rather than a client-facing insert policy. Only kernel can read the leads.
create policy "contact_submissions: kernel only"
  on public.contact_submissions for select
  using (auth_role() = 'kernel');
