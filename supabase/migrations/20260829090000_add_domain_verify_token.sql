-- First-party ownership verification step: before we ever create a
-- Cloudflare Custom Hostname (which forces the "_cf-custom-hostname" TXT
-- record name on us), we ask the institution to prove ownership with our
-- own branded TXT record. Only once that resolves do we proceed to
-- Cloudflare, which still adds its own TXT record after that point for its
-- own SSL issuance — this first step is purely ours.

alter table institution_domains
  add column verify_token text;
