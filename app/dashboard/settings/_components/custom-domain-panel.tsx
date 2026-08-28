"use client";

import { useState } from "react";
import { Globe, Plus, Trash2, Loader2, RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { addDomain, refreshDomainStatus, removeDomain, type DomainRow } from "@/lib/domains/actions";

function StatusBadge({ status }: { status: DomainRow["status"] }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" /> Live
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
      <Clock className="h-3 w-3" /> Verifying
    </span>
  );
}

export function CustomDomainPanel({ initialDomains, cnameTarget }: { initialDomains: DomainRow[]; cnameTarget: string }) {
  const [domains, setDomains] = useState(initialDomains);
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

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700/50">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Custom Domain</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
          Point a domain you own at Shikshaloy — we host and serve your public website directly, no separate hosting needed.
        </p>
      </div>

      <div className="p-5 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="www.yourschool.edu.in"
            className="h-9 flex-1 min-w-0 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
          <FancyButton onClick={handleAdd} disabled={busy} size="sm" className="shrink-0">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Connect
          </FancyButton>
        </div>

        {domains.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-200 dark:border-zinc-700 py-8">
            <Globe className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
            <p className="text-xs text-gray-400 dark:text-zinc-500">No domain connected yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {domains.map((d) => (
              <div key={d.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{d.domain}</p>
                    <StatusBadge status={d.status} />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleRefresh(d.id)}
                      disabled={refreshingId === d.id}
                      title="Check status"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700/60 disabled:opacity-50 transition-colors"
                    >
                      {refreshingId === d.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => handleRemove(d.id)}
                      disabled={removingId === d.id}
                      className="flex h-8 items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-900/20 px-3 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 transition-colors"
                    >
                      {removingId === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                      Remove
                    </button>
                  </div>
                </div>
                {d.status !== "active" && (
                  <div className="rounded-lg bg-gray-50 dark:bg-zinc-900/60 px-3 py-2 text-[11px] text-gray-500 dark:text-zinc-400">
                    Add a <span className="font-mono text-gray-700 dark:text-zinc-300">CNAME</span> record for{" "}
                    <span className="font-mono text-gray-700 dark:text-zinc-300">{d.domain}</span> pointing to{" "}
                    <span className="font-mono text-gray-700 dark:text-zinc-300">{cnameTarget}</span> in your domain&apos;s DNS
                    settings, then click check status. {d.errorMessage && <span className="text-red-600 dark:text-red-400">{d.errorMessage}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
