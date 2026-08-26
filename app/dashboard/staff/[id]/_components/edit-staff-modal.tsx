"use client";

import { useEffect, useState } from "react";
import { X, Loader2, ChevronDown } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { getStaffForEdit, updateStaff, type StaffEditData } from "../../actions";

interface EditStaffModalProps {
  staffId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

type FormState = Omit<StaffEditData, "id" | "email">;

export function EditStaffModal({ staffId, onClose, onSaved }: EditStaffModalProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [form, setForm] = useState<FormState>({ fullName: "", phone: "", designation: "", department: "", status: "active" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!staffId) return;
    setLoading(true);
    setError(null);
    getStaffForEdit(staffId)
      .then((data) => {
        setForm({
          fullName: data.fullName,
          phone: data.phone,
          designation: data.designation,
          department: data.department,
          status: data.status,
        });
        setEmail(data.email);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load staff member"))
      .finally(() => setLoading(false));
  }, [staffId]);

  if (!staffId) return null;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setError("Staff name is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateStaff({
        staffId: staffId!,
        fullName: form.fullName,
        phone: form.phone || null,
        designation: form.designation || null,
        department: form.department || null,
        status: form.status,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update staff member");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Edit Staff Profile</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Full Name *</label>
                <input className={inputClass} value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required autoFocus />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Phone</label>
                <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Email</label>
                <input type="email" className={`${inputClass} opacity-60 cursor-not-allowed`} value={email} disabled />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Designation</label>
                <input className={inputClass} value={form.designation} onChange={(e) => update("designation", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Department</label>
                <input className={inputClass} value={form.department} onChange={(e) => update("department", e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Status</label>
                <div className="relative">
                  <select
                    className={selectClass}
                    value={form.status}
                    onChange={(e) => update("status", e.target.value as FormState["status"])}
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 dark:text-zinc-500 -mt-2">
              Email can&apos;t be changed here since it&apos;s tied to the staff member&apos;s login.
            </p>

            {error && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
                Cancel
              </button>
              <FancyButton type="submit" disabled={busy} size="sm">
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Changes
              </FancyButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
