"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Plus, Copy, Check, ShieldAlert, Loader2,
  Radio, Fingerprint, Power, PowerOff,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { createAttendanceDevice, setAttendanceDeviceActive, type AttendanceDeviceRow, type DeviceType } from "@/lib/attendance/devices";

function formatDateTime(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const TYPE_META: Record<DeviceType, { label: string; icon: React.ElementType }> = {
  rfid: { label: "RFID reader", icon: Radio },
  biometric: { label: "Biometric device", icon: Fingerprint },
};

function NewKeyReveal({ plaintextKey, onDismiss }: { plaintextKey: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(plaintextKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable — the key is still visible to select manually
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-500/10 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <p className="text-xs text-amber-800 dark:text-amber-300">
          Copy this key now and enter it into the device or gate controller&apos;s configuration — for security it
          won&apos;t be shown again.
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

export default function DevicesClient({ initialDevices }: { initialDevices: AttendanceDeviceRow[] }) {
  const [devices, setDevices] = useState(initialDevices);
  const [name, setName] = useState("");
  const [type, setType] = useState<DeviceType>("rfid");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealKey, setRevealKey] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) { setError("Give the device a name first"); return; }
    setBusy(true);
    setError(null);
    try {
      const { plaintextKey } = await createAttendanceDevice(name, type, location);
      setRevealKey(plaintextKey);
      setDevices((prev) => [
        {
          id: crypto.randomUUID(),
          name: name.trim(),
          type,
          location: location.trim() || null,
          keyPrefix: plaintextKey.slice(0, 14),
          isActive: true,
          lastSeenAt: null,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setName("");
      setLocation("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register device");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle(id: string, isActive: boolean) {
    setTogglingId(id);
    setError(null);
    try {
      await setAttendanceDeviceActive(id, !isActive);
      setDevices((prev) => prev.map((d) => (d.id === id ? { ...d, isActive: !isActive } : d)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update device");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div>
        <Link href="/dashboard/attendance" className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors w-fit">
          <ArrowLeft className="h-4 w-4" /> Attendance
        </Link>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50 mt-2">Attendance Devices</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
          Register an RFID reader or biometric device to feed check-ins into attendance automatically.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {revealKey && <NewKeyReveal plaintextKey={revealKey} onDismiss={() => setRevealKey(null)} />}

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px_1fr_auto] gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name — e.g. Main Gate Reader"
            className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as DeviceType)}
            className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="rfid">RFID reader</option>
            <option value="biometric">Biometric device</option>
          </select>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (optional)"
            className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
          <FancyButton onClick={handleCreate} disabled={busy} size="sm" className="shrink-0">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Register
          </FancyButton>
        </div>

        {devices.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-200 dark:border-zinc-700 py-8">
            <Radio className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
            <p className="text-xs text-gray-400 dark:text-zinc-500">No devices registered yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {devices.map((d) => {
              const meta = TYPE_META[d.type];
              return (
                <div key={d.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${d.isActive ? "bg-primary-500/10 text-primary-600 dark:text-primary-400" : "bg-gray-100 dark:bg-zinc-700 text-gray-400 dark:text-zinc-500"}`}>
                      <meta.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{d.name}</p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
                        {meta.label}{d.location ? ` · ${d.location}` : ""} · <span className="font-mono">{d.keyPrefix}…</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-gray-400 dark:text-zinc-500">Last seen {formatDateTime(d.lastSeenAt)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(d.id, d.isActive)}
                    disabled={togglingId === d.id}
                    className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors disabled:opacity-50 ${
                      d.isActive
                        ? "border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40"
                        : "border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                    }`}
                  >
                    {togglingId === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : d.isActive ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                    {d.isActive ? "Deactivate" : "Reactivate"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
