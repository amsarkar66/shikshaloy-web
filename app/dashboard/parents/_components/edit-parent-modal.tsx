"use client";

import { useEffect, useRef, useState } from "react";
import { X, Loader2, ChevronDown, Search, UserPlus } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { QualificationSelect } from "@/components/ui/qualification-select";
import { OccupationSelect } from "@/components/ui/occupation-select";
import {
  getParentForEdit,
  updateParent,
  searchStudentsForParentLink,
  type ParentRelationship,
} from "../actions";

interface EditParentModalProps {
  parentId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

const selectClass =
  "h-8 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2.5 pr-7 text-xs text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

const fieldSelectClass =
  "h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

interface StudentOption { id: string; label: string; sublabel: string }
interface LinkedChild extends StudentOption { relationship: ParentRelationship }

export function EditParentModal({ parentId, onClose, onSaved }: EditParentModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", qualification: "", occupation: "", active: true });
  const [childQuery, setChildQuery] = useState("");
  const [suggestions, setSuggestions] = useState<StudentOption[]>([]);
  const [linkedChildren, setLinkedChildren] = useState<LinkedChild[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!parentId) return;
    setLoading(true);
    setError(null);
    getParentForEdit(parentId)
      .then((data) => {
        setForm({
          fullName: data.fullName,
          phone: data.phone,
          email: data.email,
          qualification: data.qualification,
          occupation: data.occupation,
          active: data.active,
        });
        setLinkedChildren(data.children.map((c) => ({ id: c.id, label: c.label, sublabel: c.sublabel, relationship: c.relationship })));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load parent"))
      .finally(() => setLoading(false));
  }, [parentId]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (childQuery.trim().length < 2) { setSuggestions([]); return; }
    searchTimer.current = setTimeout(async () => {
      const results = await searchStudentsForParentLink(childQuery);
      setSuggestions(results.filter((r) => !linkedChildren.some((c) => c.id === r.id)));
    }, 250);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [childQuery, linkedChildren]);

  if (!parentId) return null;

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addChild(s: StudentOption) {
    setLinkedChildren((c) => [...c, { ...s, relationship: "guardian" }]);
    setChildQuery("");
    setSuggestions([]);
  }

  function removeChild(id: string) {
    setLinkedChildren((c) => c.filter((x) => x.id !== id));
  }

  function updateChildRelationship(id: string, relationship: ParentRelationship) {
    setLinkedChildren((c) => c.map((x) => (x.id === id ? { ...x, relationship } : x)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setError("Parent name is required.");
      return;
    }
    if (!form.phone.trim()) {
      setError("Phone is required — the parent needs this to receive updates from the school.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateParent({
        parentId: parentId!,
        fullName: form.fullName,
        phone: form.phone || null,
        occupation: form.occupation || null,
        qualification: form.qualification || null,
        active: form.active,
        children: linkedChildren.map((c) => ({ studentId: c.id, relationship: c.relationship })),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update parent");
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
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Edit Parent</p>
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
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Phone *</label>
                <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Email</label>
                <input type="email" className={`${inputClass} opacity-60 cursor-not-allowed`} value={form.email} disabled />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Qualification</label>
                <QualificationSelect
                  value={form.qualification}
                  onChange={(v) => update("qualification", v)}
                  selectClassName={fieldSelectClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Occupation</label>
                <OccupationSelect
                  value={form.occupation}
                  onChange={(v) => update("occupation", v)}
                  selectClassName={fieldSelectClass}
                />
              </div>
              <div className="col-span-2 flex items-center gap-2 pt-1">
                <input
                  id="edit-parent-active"
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => update("active", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 dark:border-zinc-600 text-primary-500 focus:ring-primary-500/30"
                />
                <label htmlFor="edit-parent-active" className="text-xs font-medium text-gray-600 dark:text-zinc-300">Active</label>
              </div>
            </div>

            <p className="text-[11px] text-gray-400 dark:text-zinc-500 -mt-2">
              Email can&apos;t be changed here since it&apos;s tied to the parent&apos;s login.
            </p>

            <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Linked Children</p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                <input
                  className={`${inputClass} pl-8`}
                  value={childQuery}
                  onChange={(e) => setChildQuery(e.target.value)}
                  placeholder="Search students by name…"
                />
                {suggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg overflow-hidden">
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => addChild(s)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <UserPlus className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-zinc-500" />
                        <span className="min-w-0">
                          <span className="block truncate text-gray-900 dark:text-zinc-100">{s.label}</span>
                          <span className="block truncate text-xs text-gray-400 dark:text-zinc-500">{s.sublabel}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {linkedChildren.length > 0 && (
                <div className="mt-3 space-y-2">
                  {linkedChildren.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-gray-900 dark:text-zinc-100">{c.label}</p>
                        <p className="truncate text-xs text-gray-400 dark:text-zinc-500">{c.sublabel}</p>
                      </div>
                      <div className="relative shrink-0">
                        <select
                          className={selectClass}
                          value={c.relationship}
                          onChange={(e) => updateChildRelationship(c.id, e.target.value as ParentRelationship)}
                        >
                          <option value="father">Father</option>
                          <option value="mother">Mother</option>
                          <option value="guardian">Guardian</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 dark:text-zinc-500" />
                      </div>
                      <button type="button" onClick={() => removeChild(c.id)} className="shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
