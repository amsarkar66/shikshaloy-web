// Structured, country-agnostic postal address — used for a student's present
// and permanent address (students.present_address / .permanent_address,
// admission_applications.present_address / .permanent_address, all jsonb).
export interface StructuredAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export const EMPTY_ADDRESS: StructuredAddress = {
  line1: "", line2: "", city: "", state: "", postalCode: "", country: "",
};

export function normalizeAddress(a: Partial<StructuredAddress> | null | undefined): StructuredAddress {
  return {
    line1: a?.line1 ?? "",
    line2: a?.line2 ?? "",
    city: a?.city ?? "",
    state: a?.state ?? "",
    postalCode: a?.postalCode ?? "",
    country: a?.country ?? "",
  };
}

export function isEmptyAddress(a: Partial<StructuredAddress> | null | undefined): boolean {
  const n = normalizeAddress(a);
  return !n.line1 && !n.line2 && !n.city && !n.state && !n.postalCode && !n.country;
}

export function addressesEqual(a: StructuredAddress, b: StructuredAddress): boolean {
  return a.line1 === b.line1 && a.line2 === b.line2 && a.city === b.city
    && a.state === b.state && a.postalCode === b.postalCode && a.country === b.country;
}

// Renders a structured address as a single display line, e.g.
// "12 MG Road, Near City Mall, Bengaluru, Karnataka 560001, India".
export function formatAddress(a: Partial<StructuredAddress> | null | undefined): string {
  const n = normalizeAddress(a);
  const street = [n.line1, n.line2].filter(Boolean).join(", ");
  const stateZip = [n.state, n.postalCode].filter(Boolean).join(" ");
  return [street, n.city, stateZip, n.country].filter((p) => p && p.trim()).join(", ");
}

// A value fresh off the wire (jsonb column) is `unknown` — this guards
// against null/malformed data before treating it as a StructuredAddress.
export function parseAddress(raw: unknown): StructuredAddress {
  if (!raw || typeof raw !== "object") return { ...EMPTY_ADDRESS };
  return normalizeAddress(raw as Partial<StructuredAddress>);
}

// Drops an address down to `null` when every field is blank, so we store
// jsonb null instead of an object of empty strings.
export function addressForStorage(a: Partial<StructuredAddress> | null | undefined): StructuredAddress | null {
  const n = normalizeAddress(a);
  return isEmptyAddress(n) ? null : n;
}
