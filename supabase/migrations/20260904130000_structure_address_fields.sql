-- Upgrades present_address/permanent_address from a single free-text line to
-- a structured, country-agnostic postal address (line1, line2, city, state,
-- postalCode, country) stored as jsonb. Any existing plain-text value is
-- preserved as line1 rather than discarded.

alter table students
  alter column present_address type jsonb using (
    case when present_address is null or present_address = '' then null
         else jsonb_build_object('line1', present_address, 'line2', '', 'city', '', 'state', '', 'postalCode', '', 'country', '')
    end
  ),
  alter column permanent_address type jsonb using (
    case when permanent_address is null or permanent_address = '' then null
         else jsonb_build_object('line1', permanent_address, 'line2', '', 'city', '', 'state', '', 'postalCode', '', 'country', '')
    end
  );

alter table admission_applications
  alter column present_address type jsonb using (
    case when present_address is null or present_address = '' then null
         else jsonb_build_object('line1', present_address, 'line2', '', 'city', '', 'state', '', 'postalCode', '', 'country', '')
    end
  ),
  alter column permanent_address type jsonb using (
    case when permanent_address is null or permanent_address = '' then null
         else jsonb_build_object('line1', permanent_address, 'line2', '', 'city', '', 'state', '', 'postalCode', '', 'country', '')
    end
  );
