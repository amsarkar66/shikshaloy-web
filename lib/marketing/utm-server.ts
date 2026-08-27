import { cookies } from "next/headers";
import { UTM_COOKIE, type UtmData } from "./utm";

// Server Actions read the cookie the browser set on first landing (see
// components/marketing/utm-capture.tsx) so leads and new institutions can be
// attributed back to the campaign that brought the visitor in.
export async function getStoredUtm(): Promise<UtmData> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(UTM_COOKIE)?.value;
  if (!raw) return {};
  try {
    return JSON.parse(decodeURIComponent(raw)) as UtmData;
  } catch {
    return {};
  }
}
