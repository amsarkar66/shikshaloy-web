-- ============================================================
-- Multi-method attendance: manual, QR, RFID, biometric
-- ============================================================

create type attendance_source as enum ('manual', 'qr', 'rfid', 'biometric');

-- Devices (RFID/biometric readers) registered by a school. A device
-- authenticates to the check-in webhook with a hashed API key, the same
-- shape as public_site_keys.
create table attendance_devices (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid        not null references schools(id) on delete cascade,
  name         text        not null,
  type         text        not null check (type in ('rfid', 'biometric')),
  location     text,
  key_hash     text        not null unique,
  key_prefix   text        not null,
  is_active    boolean     not null default true,
  last_seen_at timestamptz,
  created_at   timestamptz not null default now()
);

create index attendance_devices_school_id_idx on attendance_devices(school_id);

alter table attendance_devices enable row level security;

create policy "attendance_devices: school access"
  on attendance_devices for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

-- Links a student/staff member to the external ID a physical device
-- knows them by (an RFID card UID, or a biometric device's internal
-- user/template ID).
create table attendance_credentials (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid        not null references schools(id) on delete cascade,
  student_id  uuid        references students(id) on delete cascade,
  staff_id    uuid        references staff_members(id) on delete cascade,
  method      text        not null check (method in ('rfid', 'biometric')),
  external_id text        not null,
  device_id   uuid        references attendance_devices(id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint attendance_credentials_one_owner check (
    (student_id is not null)::int + (staff_id is not null)::int = 1
  ),
  unique (school_id, method, external_id)
);

create index attendance_credentials_student_id_idx on attendance_credentials(student_id);
create index attendance_credentials_staff_id_idx on attendance_credentials(staff_id);

alter table attendance_credentials enable row level security;

create policy "attendance_credentials: school access"
  on attendance_credentials for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

-- Extend attendance rows with how they were captured and, for
-- device-driven check-ins, when the person entered/left.
alter table student_attendance add column source       attendance_source not null default 'manual';
alter table student_attendance add column checked_in_at  timestamptz;
alter table student_attendance add column checked_out_at timestamptz;
alter table student_attendance add column device_id      uuid references attendance_devices(id) on delete set null;

alter table staff_attendance add column source       attendance_source not null default 'manual';
alter table staff_attendance add column checked_in_at  timestamptz;
alter table staff_attendance add column checked_out_at timestamptz;
alter table staff_attendance add column device_id      uuid references attendance_devices(id) on delete set null;

-- Stable per-person token used to render an attendance QR. Generated
-- lazily in application code (see lib/attendance/crypto.ts), not here.
alter table students       add column qr_token text unique;
alter table staff_members  add column qr_token text unique;
