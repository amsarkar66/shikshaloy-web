alter table admission_applications
  add column if not exists status_reason text;
