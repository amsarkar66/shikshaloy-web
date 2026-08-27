"use client";

import { useEffect } from "react";
import { UTM_COOKIE, UTM_COOKIE_MAX_AGE_DAYS, readUtmFromSearch } from "@/lib/marketing/utm";

// Mounted once in the marketing layout. Writes first-touch attribution to a
// cookie so it survives navigation to /signup and /onboarding, which live
// outside the (marketing) route group. Never overwrites an existing cookie —
// the first campaign that brought someone in is the one that gets credit.
export function UtmCapture() {
  useEffect(() => {
    if (document.cookie.split("; ").some((c) => c.startsWith(`${UTM_COOKIE}=`))) return;

    const utm = readUtmFromSearch(window.location.search);
    if (!utm) return;

    const payload = {
      ...utm,
      landing_page: window.location.pathname,
      referrer: document.referrer || undefined,
    };

    const maxAge = UTM_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
    document.cookie = `${UTM_COOKIE}=${encodeURIComponent(JSON.stringify(payload))}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }, []);

  return null;
}
