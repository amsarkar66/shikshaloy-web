-- Fuel logs, incident reports, and inspection checklists for the driver
-- mobile app — no web feature or schema existed for these before (verified
-- against every migration and every app/dashboard/transport|drivers page
-- this session); this is a green-field addition, not a port of an
-- existing web action. `driver_id` follows `vehicles.driver_id`'s own
-- convention of referencing `profiles(id)` directly (not `staff_members`),
-- so `auth.uid()` matches it with no subquery.

create table vehicle_fuel_logs (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid          not null references schools(id) on delete cascade,
  vehicle_id       uuid          not null references vehicles(id) on delete cascade,
  driver_id        uuid          not null references profiles(id) on delete cascade,
  date             date          not null,
  liters           numeric(10,2) not null,
  cost             numeric(10,2) not null,
  odometer_reading integer,
  notes            text,
  created_at       timestamptz   default now()
);
create index on vehicle_fuel_logs (school_id, date);
create index on vehicle_fuel_logs (vehicle_id, date);

create table vehicle_incidents (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid        not null references schools(id) on delete cascade,
  vehicle_id  uuid        not null references vehicles(id) on delete cascade,
  driver_id   uuid        not null references profiles(id) on delete cascade,
  date        date        not null,
  description text        not null,
  severity    text        not null default 'minor',   -- 'minor', 'major', 'critical'
  status      text        not null default 'reported', -- 'reported', 'reviewed', 'resolved'
  created_at  timestamptz default now()
);
create index on vehicle_incidents (school_id, date);

create table vehicle_inspections (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid        not null references schools(id) on delete cascade,
  vehicle_id uuid        not null references vehicles(id) on delete cascade,
  driver_id  uuid        not null references profiles(id) on delete cascade,
  date       date        not null,
  checklist  jsonb       not null default '{}',  -- {"brakes": true, "tires": true, ...}
  passed     boolean     not null default true,
  notes      text,
  created_at timestamptz default now()
);
create index on vehicle_inspections (school_id, date);

alter table vehicle_fuel_logs   enable row level security;
alter table vehicle_incidents   enable row level security;
alter table vehicle_inspections enable row level security;

-- Read: whole-school visibility, matching `vehicles`/`transport_routes`'s
-- own "school access" policy pattern exactly.
create policy "vehicle_fuel_logs: school read" on vehicle_fuel_logs for select
  using (school_id = auth_school_id() or auth_role() = 'kernel');
create policy "vehicle_incidents: school read" on vehicle_incidents for select
  using (school_id = auth_school_id() or auth_role() = 'kernel');
create policy "vehicle_inspections: school read" on vehicle_inspections for select
  using (school_id = auth_school_id() or auth_role() = 'kernel');

-- Write: only the vehicle's own assigned driver may log against it — no
-- existing table in this schema has a driver-scoped (vs. school-scoped)
-- write policy to mirror, so this is this migration's own design.
create policy "vehicle_fuel_logs: driver insert" on vehicle_fuel_logs for insert
  with check (driver_id = auth.uid() and vehicle_id in (select id from vehicles where driver_id = auth.uid()));
create policy "vehicle_incidents: driver insert" on vehicle_incidents for insert
  with check (driver_id = auth.uid() and vehicle_id in (select id from vehicles where driver_id = auth.uid()));
create policy "vehicle_inspections: driver insert" on vehicle_inspections for insert
  with check (driver_id = auth.uid() and vehicle_id in (select id from vehicles where driver_id = auth.uid()));

-- Kernel/school-admin write access, matching every other "school access"
-- table's `for all` reach (so web's admin console can manage these rows
-- too, not just the mobile driver who created them).
create policy "vehicle_fuel_logs: admin write" on vehicle_fuel_logs for update
  using (school_id = auth_school_id() or auth_role() = 'kernel');
create policy "vehicle_fuel_logs: admin delete" on vehicle_fuel_logs for delete
  using (school_id = auth_school_id() or auth_role() = 'kernel');
create policy "vehicle_incidents: admin write" on vehicle_incidents for update
  using (school_id = auth_school_id() or auth_role() = 'kernel');
create policy "vehicle_incidents: admin delete" on vehicle_incidents for delete
  using (school_id = auth_school_id() or auth_role() = 'kernel');
create policy "vehicle_inspections: admin write" on vehicle_inspections for update
  using (school_id = auth_school_id() or auth_role() = 'kernel');
create policy "vehicle_inspections: admin delete" on vehicle_inspections for delete
  using (school_id = auth_school_id() or auth_role() = 'kernel');
