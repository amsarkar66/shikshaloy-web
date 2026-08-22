-- Front Desk: visitor log, walk-in enquiries, call log, gate pass, and
-- postal register — day-to-day reception logs that don't belong to any
-- existing module (Admissions only starts once someone formally applies).

create type enquiry_status as enum ('new', 'contacted', 'converted', 'closed');
create type call_direction as enum ('incoming', 'outgoing');
create type postal_direction as enum ('dispatch', 'receive');

create table visitor_logs (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid        not null references schools(id) on delete cascade,
  visitor_name   text        not null,
  phone          text,
  purpose        text        not null,
  meeting_with   text,
  in_time        timestamptz not null default now(),
  out_time       timestamptz,
  created_by     uuid        references profiles(id) on delete set null,
  created_at     timestamptz not null default now()
);

create index visitor_logs_school_id_idx on visitor_logs(school_id);

create table front_desk_enquiries (
  id               uuid           primary key default gen_random_uuid(),
  school_id        uuid           not null references schools(id) on delete cascade,
  name             text           not null,
  phone            text,
  email            text,
  interested_grade text,
  source           text,
  notes            text,
  status           enquiry_status not null default 'new',
  created_by       uuid           references profiles(id) on delete set null,
  created_at       timestamptz    not null default now()
);

create index front_desk_enquiries_school_id_idx on front_desk_enquiries(school_id);

create table call_logs (
  id           uuid           primary key default gen_random_uuid(),
  school_id    uuid           not null references schools(id) on delete cascade,
  caller_name  text           not null,
  phone        text,
  direction    call_direction not null default 'incoming',
  purpose      text,
  notes        text,
  handled_by   uuid           references profiles(id) on delete set null,
  created_at   timestamptz    not null default now()
);

create index call_logs_school_id_idx on call_logs(school_id);

create table gate_passes (
  id                    uuid        primary key default gen_random_uuid(),
  school_id             uuid        not null references schools(id) on delete cascade,
  student_id            uuid        not null references students(id) on delete cascade,
  reason                text        not null,
  pickup_person_name    text        not null,
  pickup_person_relation text,
  pass_time             timestamptz not null default now(),
  approved_by           uuid        references profiles(id) on delete set null,
  created_at            timestamptz not null default now()
);

create index gate_passes_school_id_idx on gate_passes(school_id);
create index gate_passes_student_id_idx on gate_passes(student_id);

create table postal_records (
  id            uuid             primary key default gen_random_uuid(),
  school_id     uuid             not null references schools(id) on delete cascade,
  direction     postal_direction not null,
  reference_no  text,
  subject       text             not null,
  contact_name  text,
  record_date   date             not null default current_date,
  notes         text,
  created_by    uuid             references profiles(id) on delete set null,
  created_at    timestamptz      not null default now()
);

create index postal_records_school_id_idx on postal_records(school_id);

alter table visitor_logs         enable row level security;
alter table front_desk_enquiries enable row level security;
alter table call_logs            enable row level security;
alter table gate_passes          enable row level security;
alter table postal_records       enable row level security;

create policy "visitor_logs: school access"
  on visitor_logs for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "front_desk_enquiries: school access"
  on front_desk_enquiries for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "call_logs: school access"
  on call_logs for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "gate_passes: school access"
  on gate_passes for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "postal_records: school access"
  on postal_records for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');
