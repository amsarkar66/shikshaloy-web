"use client";

import { useState } from "react";
import { Globe, Trash2, Loader2, RefreshCw, CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { addDomain, refreshDomainStatus, removeDomain, type DomainRow } from "@/lib/domains/actions";

// Cloudflare returns fully-qualified names (e.g. "_cf-custom-hostname.www.example.com"),
// but DNS zone editors are rooted at the registrable domain (e.g. "example.com"), not
// at the connected "www" hostname — so the record's Name field must stay relative to
// THAT root ("_cf-custom-hostname.www"), not have the whole connected domain stripped.
function relativeToZoneRoot(fqdn: string, connectedDomain: string): string {
  const zoneRoot = connectedDomain.replace(/^www\./, "");
  return fqdn.endsWith(`.${zoneRoot}`) ? fqdn.slice(0, -(zoneRoot.length + 1)) : fqdn;
}

function StatusBadge({ status }: { status: DomainRow["status"] }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" /> Connected
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:text-red-400">
        <AlertCircle className="h-3 w-3" /> Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
      <Loader2 className="h-3 w-3 animate-spin" /> Verifying
    </span>
  );
}

function DnsRow({ type, host, value, verified }: { type: string; host: string; value: string; verified: boolean }) {
  return (
    <tr className="border-b border-gray-100 dark:border-zinc-700/50 last:border-0">
      <td className="py-2.5 pr-4 pl-4 align-top">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-zinc-300">
          {type}
          {verified ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          )}
        </span>
      </td>
      <td className="py-2.5 pr-4 align-top font-mono text-xs text-gray-700 dark:text-zinc-300 break-all">{host}</td>
      <td className="py-2.5 pr-4 align-top font-mono text-xs text-gray-700 dark:text-zinc-300 break-all">{value}</td>
    </tr>
  );
}

function DomainCard({
  domain,
  cnameTarget,
  onRefresh,
  onRemove,
  refreshing,
  removing,
}: {
  domain: DomainRow;
  cnameTarget: string;
  onRefresh: () => void;
  onRemove: () => void;
  refreshing: boolean;
  removing: boolean;
}) {
  const verified = domain.status === "active";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">{domain.domain}</p>
          <StatusBadge status={domain.status} />
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            title="Check status"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700/60 disabled:opacity-50 transition-colors"
          >
            {refreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onRemove}
            disabled={removing}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-900/20 px-3 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 transition-colors"
          >
            {removing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            Remove
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-zinc-700 pt-4 pb-1.5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-zinc-700/50 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                <th className="pb-1.5 pr-4 pl-4 font-semibold">Type</th>
                <th className="pb-1.5 pr-4 font-semibold">Host</th>
                <th className="pb-1.5 pr-4 font-semibold">Value</th>
              </tr>
            </thead>
            <tbody>
              <DnsRow type="CNAME" host={domain.domain.split(".")[0]} value={cnameTarget} verified={verified} />
              {domain.ownershipTxtName && domain.ownershipTxtValue && (
                <DnsRow
                  type="TXT"
                  host={relativeToZoneRoot(domain.ownershipTxtName, domain.domain)}
                  value={domain.ownershipTxtValue}
                  verified={verified}
                />
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!verified && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            DNS records not verified yet. Add the records above at your domain&apos;s DNS provider, then click the refresh
            icon — this can take a few minutes.
            {domain.errorMessage && <span className="block mt-1 text-red-600 dark:text-red-400">{domain.errorMessage}</span>}
          </span>
        </div>
      )}
    </div>
  );
}

export function CustomDomainPanel({ initialDomains, cnameTarget }: { initialDomains: DomainRow[]; cnameTarget: string }) {
  const [domains, setDomains] = useState(initialDomains);
  const [adding, setAdding] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleAdd() {
    if (!input.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const row = await addDomain(input);
      setDomains((prev) => [row, ...prev]);
      setInput("");
      setAdding(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect domain");
    } finally {
      setBusy(false);
    }
  }

  async function handleRefresh(id: string) {
    setRefreshingId(id);
    setError(null);
    try {
      const row = await refreshDomainStatus(id);
      setDomains((prev) => prev.map((d) => (d.id === id ? row : d)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check status");
    } finally {
      setRefreshingId(null);
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    setError(null);
    try {
      await removeDomain(id);
      setDomains((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove domain");
    } finally {
      setRemovingId(null);
    }
  }

  const canAddMore = domains.length === 0;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700/50">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Connected Domain</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
          Connect a domain you own so visitors can reach your public website on it.
        </p>
      </div>

      <div className="p-5 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {domains.map((d) => (
          <DomainCard
            key={d.id}
            domain={d}
            cnameTarget={cnameTarget}
            onRefresh={() => handleRefresh(d.id)}
            onRemove={() => handleRemove(d.id)}
            refreshing={refreshingId === d.id}
            removing={removingId === d.id}
          />
        ))}

        {canAddMore && !adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 dark:border-zinc-700 py-6 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:border-primary-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            <Globe className="h-4 w-4" />
            Connect Domain
          </button>
        )}

        {canAddMore && adding && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="www.yourschool.edu.in"
                className="h-9 flex-1 min-w-0 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
              <button
                onClick={() => {
                  setAdding(false);
                  setInput("");
                  setError(null);
                }}
                disabled={busy}
                className="h-9 shrink-0 rounded-lg border border-gray-200 dark:border-zinc-700 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700/60 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <FancyButton onClick={handleAdd} disabled={busy} size="sm" className="shrink-0">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Connect
              </FancyButton>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500">
              Use the <span className="font-mono">www</span> form of your domain (e.g. www.yourschool.com) — root domains
              don&apos;t support CNAME records.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
