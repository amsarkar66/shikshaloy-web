create type subscription_status as enum ('active', 'past_due', 'cancelled');
create type invoice_status as enum ('paid', 'pending', 'failed');

create table school_subscriptions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null unique references schools(id),
  plan_id text not null,
  plan_name text not null,
  status subscription_status not null default 'active',
  schools_used integer not null default 1,
  max_schools integer not null,
  monthly_fee numeric not null,
  renews_on date not null,
  payment_method_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table subscription_invoices (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id),
  invoice_no text not null,
  period_label text not null,
  plan_name text not null,
  amount numeric not null,
  status invoice_status not null default 'paid',
  issued_date date not null,
  created_at timestamptz not null default now()
);

create index subscription_invoices_school_idx on subscription_invoices(school_id, issued_date desc);
