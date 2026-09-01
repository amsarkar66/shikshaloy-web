-- The admission-documents bucket was created `public: true` with a blanket
-- "select using (bucket_id = 'admission-documents')" storage policy, so any
-- unauthenticated visitor who can guess/enumerate an object path could list
-- and download every school's admission documents (birth certificates,
-- applicant photos) platform-wide. The app-layer admission_documents table
-- is correctly RLS-scoped by school — only the underlying file bytes were
-- exposed.
--
-- The dashboard only ever reads these files server-side (via
-- getAdmissionApplication, using the service-role client, which bypasses
-- storage RLS entirely), so closing public/anon access here doesn't need a
-- replacement policy — server code switches to short-lived signed URLs
-- (see app/dashboard/admissions/_lib/get-application.ts).
drop policy if exists "admission-documents: public read" on storage.objects;

update storage.buckets set public = false where id = 'admission-documents';
