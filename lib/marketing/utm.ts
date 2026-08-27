// First-touch marketing attribution shared between the client-side capture
// (utm-capture.tsx) and the server-side reader (utm-server.ts). Cookie is
// plain (non-httpOnly) since it holds no sensitive data and is written from
// the browser the moment a visitor lands with campaign params in the URL.
export const UTM_COOKIE = "sl_utm";
export const UTM_COOKIE_MAX_AGE_DAYS = 90;

export interface UtmData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  landing_page?: string;
  referrer?: string;
}

const UTM_PARAM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

export function readUtmFromSearch(search: string): UtmData | null {
  const params = new URLSearchParams(search);
  const data: UtmData = {};
  for (const key of UTM_PARAM_KEYS) {
    const value = params.get(key);
    if (value) data[key] = value.slice(0, 200);
  }
  return Object.keys(data).length > 0 ? data : null;
}
