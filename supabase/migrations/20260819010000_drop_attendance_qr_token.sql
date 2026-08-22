-- Attendance QR now reuses the student ID card's existing public
-- safety-page link (/s/{studentId}) instead of a separate opaque token,
-- so the per-person qr_token columns are no longer used.
alter table students      drop column if exists qr_token;
alter table staff_members drop column if exists qr_token;
