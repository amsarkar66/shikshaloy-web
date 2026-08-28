-- ============================================================
-- Serial number for push-mode devices (ZKTeco ADMS/iClock protocol).
-- These devices authenticate themselves by SN in the query string of
-- their own POST/GET calls to /iclock/*, not via the x-device-key
-- header used by the existing checkin webhook, so key_hash/key_prefix
-- stay populated but unused for this device type.
-- ============================================================

alter table attendance_devices add column serial_number text unique;
