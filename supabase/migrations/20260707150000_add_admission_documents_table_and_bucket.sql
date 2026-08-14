create table if not exists public.admission_documents (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid        not null references public.admission_applications(id) on delete cascade,
  category       text        not null,
  file_name      text        not null,
  file_url       text        not null,
  uploaded_at    timestamptz not null default now()
);

create index if not exists admission_documents_application_id_idx on public.admission_documents (application_id);

alter table public.admission_documents enable row level security;

create policy "admission_documents: school access"
  on public.admission_documents for all
  using (
    exists (
      select 1 from public.admission_applications a
      where a.id = admission_documents.application_id
        and (a.school_id = auth_school_id() or auth_role() = 'kernel')
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('admission-documents', 'admission-documents', true, 5242880, array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "admission-documents: public read"
  on storage.objects for select
  using (bucket_id = 'admission-documents');
