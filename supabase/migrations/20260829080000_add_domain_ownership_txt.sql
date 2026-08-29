-- Surface Cloudflare's TXT ownership-verification record up front, alongside
-- the CNAME instructions, instead of only the CNAME. Skipping this is what
-- caused a real connect failure ("custom hostname does not CNAME to this
-- zone") that had to be debugged after the fact — showing both records from
-- the start avoids that for every institution going forward.

alter table institution_domains
  add column ownership_txt_name text,
  add column ownership_txt_value text;
