// Edge-safe (no service-role key, no supabase-js client) lookup used by
// middleware to turn an incoming Host header into the owner whose public
// site should be served. Runs on every request to an unrecognized host, so
// it's a single lightweight REST call guarded by the RLS policy that only
// exposes domains with status = 'active'.

function knownAppHosts(): string[] {
  const hosts = new Set(["localhost"]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      const hostname = new URL(siteUrl).hostname;
      hosts.add(hostname);
      hosts.add(hostname.replace(/^www\./, ""));
      hosts.add(`www.${hostname.replace(/^www\./, "")}`);
    } catch {
      // ignore malformed env value
    }
  }
  return [...hosts];
}

export function isAppHost(host: string): boolean {
  const bareHost = host.split(":")[0];
  return bareHost.endsWith(".vercel.app") || knownAppHosts().includes(bareHost);
}

export async function resolveDomainOwner(host: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !publishableKey) return null;

  const bareHost = host.split(":")[0].toLowerCase();

  const res = await fetch(
    `${supabaseUrl}/rest/v1/institution_domains?domain=eq.${encodeURIComponent(bareHost)}&status=eq.active&select=owner_id`,
    { headers: { apikey: publishableKey, Authorization: `Bearer ${publishableKey}` }, cache: "no-store" }
  );
  if (!res.ok) return null;

  const rows = (await res.json()) as { owner_id: string }[];
  return rows[0]?.owner_id ?? null;
}
