-- Marketing attribution: first-touch UTM params, captured client-side into a
-- cookie on any marketing page landing and carried through to the two real
-- conversion events (a contact-form lead, and a school completing onboarding).
alter table public.contact_submissions
  add column if not exists utm_source   text,
  add column if not exists utm_medium   text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term     text,
  add column if not exists utm_content  text,
  add column if not exists landing_page text,
  add column if not exists referrer     text;

alter table public.institutions
  add column if not exists utm_source   text,
  add column if not exists utm_medium   text,
  add column if not exists utm_campaign text,
  add column if not exists utm_term     text,
  add column if not exists utm_content  text,
  add column if not exists landing_page text,
  add column if not exists referrer     text;
