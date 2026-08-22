"use client";

import { useEffect, useState } from "react";
import { Radio, Fingerprint, Plus, Trash2, Loader2, IdCard } from "lucide-react";
import {
  listAttendanceCredentials, addAttendanceCredential, removeAttendanceCredential,
  type AttendanceCredentialRow,
} from "@/lib/attendance/credentials";
import type { CredentialMethod } from "@/lib/attendance/resolve";

const METHOD_META: Record<CredentialMethod, { label: string; icon: React.ElementType; placeholder: string }> = {
  rfid:      { label: "RFID card",      icon: Radio,       placeholder: "Tap the card, or type its UID" },
  biometric: { label: "Biometric ID",   icon: Fingerprint, placeholder: "Enter the device's user/template ID" },
};

export default function AttendanceCredentialsCard({
  personType, personId,
}: {
  personType: "student" | "staff";
  personId: string;
}) {
  const [credentials, setCredentials] = useState<AttendanceCredentialRow[] | null>(null);
  const [method, setMethod] = useState<CredentialMethod>("rfid");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    listAttendanceCredentials(personType, personId).then(setCredentials).catch(() => setCredentials([]));
  }, [personType, personId]);

  async function handleAdd() {
    if (!value.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await addAttendanceCredential(personType, personId, method, value);
      setValue("");
      const fresh = await listAttendanceCredentials(personType, personId);
      setCredentials(fresh);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    setError(null);
    try {
      await removeAttendanceCredential(id, personType);
      setCredentials((prev) => (prev ?? []).filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <IdCard className="h-4 w-4 text-primary-500" />
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Attendance IDs</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {credentials === null ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {credentials.length > 0 && (
            <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {credentials.map((c) => {
                const meta = METHOD_META[c.method];
                return (
                  <div key={c.id} className="flex items-center justify-between gap-2 py-2 first:pt-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <meta.icon className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-zinc-500" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-zinc-100">{meta.label}</p>
                        <p className="text-xs font-mono text-gray-500 dark:text-zinc-400 truncate">{c.externalId}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(c.id)}
                      disabled={removingId === c.id}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                    >
                      {removingId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as CredentialMethod)}
              className="h-8 shrink-0 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-xs text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 dark:focus:border-primary-500"
            >
              <option value="rfid">RFID</option>
              <option value="biometric">Biometric</option>
            </select>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              placeholder={METHOD_META[method].placeholder}
              className="h-8 flex-1 min-w-0 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500"
            />
            <button
              onClick={handleAdd}
              disabled={busy || !value.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 transition-colors"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
