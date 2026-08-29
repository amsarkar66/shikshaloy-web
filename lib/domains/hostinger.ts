// Wrapper around Hostinger's Hosting API v1 — automates the "Parked Domain"
// step that otherwise has to be clicked through manually in hPanel for every
// institution's domain (Websites -> [site] -> Domains -> Parked Domains).
// Without this, Hostinger's own web server has no idea a given custom
// domain should route to this app, even though Cloudflare is already
// forwarding traffic correctly — see the domains feature notes.
//
// Requires:
//   HOSTINGER_API_TOKEN   — generated at hpanel.hostinger.com/api
//   HOSTINGER_USERNAME    — the hPanel account username (path param, not email)
//   HOSTINGER_WEBSITE_DOMAIN — the domain identifying the shikshaloy-web
//                              website in hPanel (e.g. "shikshaloy.com")

const HOSTINGER_API_BASE = "https://developers.hostinger.com/api/hosting/v1";

interface HostingerErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}

function requireConfig() {
  const apiToken = process.env.HOSTINGER_API_TOKEN;
  const username = process.env.HOSTINGER_USERNAME;
  const websiteDomain = process.env.HOSTINGER_WEBSITE_DOMAIN;
  if (!apiToken || !username || !websiteDomain) return null;
  return { apiToken, username, websiteDomain };
}

// Automation is optional — if not configured, callers fall back to telling
// the institution owner to park the domain manually (matches the pre-
// automation behavior instead of hard-failing domain connection).
export function isHostingerAutomationConfigured(): boolean {
  return requireConfig() !== null;
}

async function hostingerFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const config = requireConfig();
  if (!config) throw new Error("Hostinger automation is not configured");
  const { apiToken, username, websiteDomain } = config;

  const res = await fetch(
    `${HOSTINGER_API_BASE}/accounts/${username}/websites/${websiteDomain}${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    }
  );

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as HostingerErrorBody;
    const message = body.message || `Hostinger request failed (${res.status})`;
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// Bare apex domains can't be parked by Hostinger's own rules ("Domain
// cannot start with www" is the inverse case we hit — but apex domains
// with a subdomain prefix like "www.example.com" also aren't accepted by
// this endpoint; only the registrable root, e.g. "example.com"). Strip a
// leading "www." so callers can pass the domain the institution actually
// connected (which is usually the www form) and still park correctly.
function toParkableDomain(domain: string): string {
  return domain.replace(/^www\./, "");
}

export async function parkDomain(domain: string): Promise<void> {
  await hostingerFetch<unknown>("/parked-domains", {
    method: "POST",
    body: JSON.stringify({ parked_domain: toParkableDomain(domain) }),
  });
}

export async function unparkDomain(domain: string): Promise<void> {
  await hostingerFetch<unknown>(`/parked-domains/${encodeURIComponent(toParkableDomain(domain))}`, {
    method: "DELETE",
  });
}
