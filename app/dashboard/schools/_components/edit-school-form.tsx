"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, MapPin, UserCog,
  ChevronDown,
} from "lucide-react";
import { updateSchool } from "../actions";
import { LogoUpload } from "./logo-upload";
import type { SchoolStatus } from "../_data/schools";

export interface EditableSchool {
  id: string;
  name: string;
  institutionType: string;
  establishedYear: number | null;
  status: SchoolStatus;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  website: string;
  logoUrl: string | null;
  principalName: string;
  principalEmail: string;
}

const INSTITUTION_TYPES = ["School", "College", "University", "Training Institute", "Coaching Centre", "Other"];

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20";

const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20";

const labelClass = "mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400";

const cardClass = "rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5";

const cardTitleClass = "mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50 flex items-center gap-2";

export function EditSchoolForm({ school }: { school: EditableSchool }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...school });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("School name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateSchool({
        schoolId: form.id,
        name: form.name,
        institutionType: form.institutionType,
        establishedYear: form.establishedYear,
        status: form.status,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        country: form.country || null,
        phone: form.phone || null,
        website: form.website || null,
        logoUrl: form.logoUrl,
        principalName: form.principalName || null,
        principalEmail: form.principalEmail || null,
      });
      router.push("/dashboard/schools");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update school");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full px-6 py-6 space-y-6">

      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/schools"
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Schools
        </Link>
        <div className="flex gap-2">
          <Link
            href="/dashboard/schools"
            className="flex h-8 items-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </Link>
          <button type="submit" disabled={busy} className="flex h-8 items-center gap-1.5 rounded-lg bg-violet-500 hover:bg-violet-600 disabled:opacity-50 px-4 text-sm font-medium text-white transition-colors">
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Logo + identity */}
      <div className={cardClass}>
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <LogoUpload value={form.logoUrl} onChange={(url) => update("logoUrl", url)} />
          <div className="grid flex-1 grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <div className="sm:col-span-2">
              <label className={labelClass}>School name *</label>
              <input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} required />
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <div className="relative">
                <select
                  className={selectClass}
                  value={form.status}
                  onChange={(e) => update("status", e.target.value as SchoolStatus)}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Institution type</label>
              <div className="relative">
                <select className={selectClass} value={form.institutionType} onChange={(e) => update("institutionType", e.target.value)}>
                  <option value="" disabled>Select type</option>
                  {INSTITUTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Year established</label>
              <input
                type="number"
                className={inputClass}
                value={form.establishedYear ?? ""}
                onChange={(e) => update("establishedYear", e.target.value ? Number(e.target.value) : null)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Location & Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Location & Contact */}
        <div className={cardClass}>
          <p className={cardTitleClass}>
            <MapPin className="h-4 w-4 text-violet-500" /> Location & Contact
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>Address</label>
              <input className={inputClass} value={form.address} onChange={(e) => update("address", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>City</label>
              <input className={inputClass} value={form.city} onChange={(e) => update("city", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>State</label>
              <input className={inputClass} value={form.state} onChange={(e) => update("state", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Country</label>
              <input className={inputClass} value={form.country} onChange={(e) => update("country", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>Website</label>
              <input className={inputClass} value={form.website} onChange={(e) => update("website", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Principal */}
        <div className={cardClass}>
          <p className={cardTitleClass}>
            <UserCog className="h-4 w-4 text-violet-500" /> Principal
          </p>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className={labelClass}>Name</label>
              <input className={inputClass} value={form.principalName} onChange={(e) => update("principalName", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" className={inputClass} value={form.principalEmail} onChange={(e) => update("principalEmail", e.target.value)} />
            </div>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500">
              This updates the principal&rsquo;s display details only — their login account and role are managed separately.
            </p>
          </div>
        </div>

      </div>

    </form>
  );
}
