-- ============================================================
-- One-time fee categories (admission fee, security deposit, etc).
-- These bill once, at enrollment, per student per grade — never through
-- the recurring generateMonthlyFees() batch, which only ever considers
-- monthly/quarterly/annual structures. Kept as an explicit flag rather
-- than reusing "annual" frequency so a year-rollover copy of last year's
-- fee_structures can't accidentally re-bill every re-enrolling student.
-- ============================================================

alter table fee_structures add column is_one_time boolean not null default false;
