alter table public.staff_members add column if not exists license_number text;
alter table public.staff_members add column if not exists license_expiry date;
alter table public.staff_members add column if not exists address text;
alter table public.staff_members add column if not exists emergency_contact_name text;
alter table public.staff_members add column if not exists emergency_contact_phone text;
