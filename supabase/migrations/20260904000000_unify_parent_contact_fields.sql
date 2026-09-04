-- Unifies the parent/guardian fields collected across the Parents page, the
-- admission form, and the Add Student flow — all three now capture the same
-- set (full name, phone, email, qualification, occupation). Address is no
-- longer collected separately for a parent; it's assumed to match the
-- student's own address.

alter table parents
  add column if not exists qualification text;

alter table admission_applications
  add column if not exists father_qualification  text,
  add column if not exists mother_qualification  text,
  add column if not exists guardian_email         text,
  add column if not exists guardian_occupation    text,
  add column if not exists guardian_qualification text,
  add column if not exists parent_occupation      text,
  add column if not exists parent_qualification   text;
