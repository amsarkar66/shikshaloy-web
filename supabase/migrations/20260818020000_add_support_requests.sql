create table if not exists public.support_requests (
  id             uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  created_by     uuid references auth.users(id) on delete set null,
  category       text not null default 'other',
  subject        text not null,
  status         text not null default 'open',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists support_requests_institution_id_idx on public.support_requests(institution_id);
create index if not exists support_requests_status_idx on public.support_requests(status);

create table if not exists public.support_request_messages (
  id                  uuid primary key default gen_random_uuid(),
  support_request_id  uuid not null references public.support_requests(id) on delete cascade,
  sender_role         text not null,
  sender_name         text not null,
  sender_email        text,
  body                text not null,
  created_at          timestamptz not null default now()
);

create index if not exists support_request_messages_request_id_idx
  on public.support_request_messages(support_request_id, created_at);

alter table public.support_requests enable row level security;
alter table public.support_request_messages enable row level security;

create policy "support_requests: owner institution or kernel"
  on public.support_requests for all
  using (
    institution_id in (select id from public.institutions where owner_id = auth.uid())
    or auth_role() = 'kernel'
  );

create policy "support_request_messages: owner institution or kernel"
  on public.support_request_messages for all
  using (
    exists (
      select 1 from public.support_requests r
      where r.id = support_request_messages.support_request_id
        and (
          r.institution_id in (select id from public.institutions where owner_id = auth.uid())
          or auth_role() = 'kernel'
        )
    )
  );
