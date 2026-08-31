-- Carousel slide content (caption + optional call-to-action) for the
-- Website editor's Carousel section. Which banners are actually shown,
-- and in what order, is controlled by institution_site_settings'
-- draft/published carousel.slides array, not display_order here —
-- these columns just carry the per-slide copy an admin attaches to an
-- uploaded banner image.
alter table school_banners add column caption text;
alter table school_banners add column cta_label text;
alter table school_banners add column cta_href text;
