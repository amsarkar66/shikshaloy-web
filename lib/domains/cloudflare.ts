// Thin wrapper around Cloudflare's Custom Hostnames API (part of
// "Cloudflare for SaaS"). This is what lets a school point their own
// domain at us via a single CNAME and get SSL + routing without us
// running our own reverse proxy — see the domains feature plan.
//
// Requires, on the Cloudflare zone for shikshaloy.com:
//   - Cloudflare for SaaS enabled, with a fallback origin configured
//     (the hostname schools are told to CNAME to).
//   - CLOUDFLARE_API_TOKEN: a token scoped to that zone's
//     "SSL and Certificates: Edit" + "Zone: Edit" permissions.
//   - CLOUDFLARE_ZONE_ID: the zone id for shikshaloy.com.

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

interface CloudflareApiResponse<T> {
  success: boolean;
  errors: { code: number; message: string }[];
  result: T | null;
}

export interface CustomHostnameSslStatus {
  status: string; // e.g. "pending_validation" | "pending_issuance" | "active" | "active_redeploying"
  validation_errors?: { message: string }[];
}

export interface OwnershipVerification {
  type: string; // "txt"
  name: string; // e.g. "_cf-custom-hostname.example.com"
  value: string;
}

export interface CustomHostname {
  id: string;
  hostname: string;
  status: string; // "pending" | "active" | "moved" | ...
  ssl: CustomHostnameSslStatus;
  ownership_verification?: OwnershipVerification;
}

function requireConfig() {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  if (!apiToken || !zoneId) {
    throw new Error("Cloudflare is not configured — set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID.");
  }
  return { apiToken, zoneId };
}

async function cloudflareFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const { apiToken, zoneId } = requireConfig();

  const res = await fetch(`${CLOUDFLARE_API_BASE}/zones/${zoneId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  const body = (await res.json()) as CloudflareApiResponse<T>;
  if (!body.success || !body.result) {
    const message = body.errors?.map((e) => e.message).join("; ") || `Cloudflare request failed (${res.status})`;
    throw new Error(message);
  }
  return body.result;
}

export async function createCustomHostname(domain: string): Promise<CustomHostname> {
  return cloudflareFetch<CustomHostname>("/custom_hostnames", {
    method: "POST",
    body: JSON.stringify({
      hostname: domain,
      ssl: { method: "http", type: "dv", bundle_method: "ubiquitous" },
    }),
  });
}

export async function getCustomHostname(cloudflareHostnameId: string): Promise<CustomHostname> {
  return cloudflareFetch<CustomHostname>(`/custom_hostnames/${cloudflareHostnameId}`);
}

export async function deleteCustomHostname(cloudflareHostnameId: string): Promise<void> {
  await cloudflareFetch<{ id: string }>(`/custom_hostnames/${cloudflareHostnameId}`, { method: "DELETE" });
}
