"use client";

import { useState } from "react";
import { KeyRound, Plus, Copy, Check, Trash2, Loader2, ShieldAlert } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { createPublishKey, revokePublishKey, type PublishKeyRow } from "@/lib/publish-keys/actions";

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function NewKeyReveal({ plaintextKey, onDismiss }: { plaintextKey: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(plaintextKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — user can still select the text manually
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-500/10 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <p className="text-xs text-amber-800 dark:text-amber-300">
          Copy this key now — for security it won&apos;t be shown again. Anyone with this key can read your
          institution&apos;s public profile, announcements, and events.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 min-w-0 truncate rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-mono text-gray-900 dark:text-zinc-100">
          {plaintextKey}
        </code>
        <button
          onClick={handleCopy}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 px-3 text-xs font-medium text-white transition-colors shrink-0"
        >
          {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
        </button>
      </div>
      <button onClick={onDismiss} className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline">
        Done, I&apos;ve saved it
      </button>
    </div>
  );
}

export function PublishKeyPanel({ initialKeys }: { initialKeys: PublishKeyRow[] }) {
  const [keys, setKeys] = useState(initialKeys);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealKey, setRevealKey] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  async function handleGenerate() {
    setBusy(true);
    setError(null);
    try {
      const { plaintextKey } = await createPublishKey(label);
      setRevealKey(plaintextKey);
      setLabel("");
      setKeys((prev) => [
        {
          id: crypto.randomUUID(),
          label: label.trim() || null,
          keyPrefix: plaintextKey.slice(0, 14),
          createdAt: new Date().toISOString(),
          lastUsedAt: null,
          revokedAt: null,
        },
        ...prev,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate key");
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(id: string) {
    setRevokingId(id);
    setError(null);
    try {
      await revokePublishKey(id);
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, revokedAt: new Date().toISOString() } : k)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke key");
    } finally {
      setRevokingId(null);
    }
  }

  const activeKeys = keys.filter((k) => !k.revokedAt);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700/50">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Public Website Key</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
          Use a publish key to fetch your institution&apos;s public profile, announcements, and events into an
          external website — no login required.
        </p>
      </div>

      <div className="p-5 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {revealKey && <NewKeyReveal plaintextKey={revealKey} onDismiss={() => setRevealKey(null)} />}

        <div className="flex items-center gap-2">
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (optional) — e.g. Main website"
            className="h-9 flex-1 min-w-0 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
          <FancyButton
            onClick={handleGenerate}
            disabled={busy}
            size="sm"
            className="shrink-0"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Generate Key
          </FancyButton>
        </div>

        {activeKeys.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-200 dark:border-zinc-700 py-8">
            <KeyRound className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
            <p className="text-xs text-gray-400 dark:text-zinc-500">No active publish keys yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {activeKeys.map((k) => (
              <div key={k.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">
                    {k.label ?? "Untitled key"}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400 font-mono">{k.keyPrefix}…</p>
                  <p className="mt-0.5 text-[11px] text-gray-400 dark:text-zinc-500">
                    Created {formatDate(k.createdAt)} · Last used {formatDate(k.lastUsedAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(k.id)}
                  disabled={revokingId === k.id}
                  className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-900/20 px-3 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 transition-colors"
                >
                  {revokingId === k.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
