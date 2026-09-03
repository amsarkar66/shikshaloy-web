"use client";

import { useState } from "react";
import { X, Loader2, ChevronDown } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { createItem, updateItem } from "../actions";
import type { InventoryItem, ItemCondition } from "../_data/inventory";
import type { InstitutionSchool } from "@/lib/supabase/institution-context";

interface ItemFormModalProps {
  mode: "add" | "edit";
  item?: InventoryItem | null;
  categories: string[];
  onClose: () => void;
  onSaved: () => void;
  schools?: InstitutionSchool[];
}

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60 disabled:cursor-not-allowed";

const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

export function ItemFormModal({ mode, item, categories, onClose, onSaved, schools = [] }: ItemFormModalProps) {
  const multiSchool = mode === "add" && schools.length > 1;
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState(item?.category ?? categories[0] ?? "__new__");
  const [customCategory, setCustomCategory] = useState("");
  const [location, setLocation] = useState(item?.location ?? "");
  const [totalQty, setTotalQty] = useState(item ? String(item.totalQty) : "1");
  const [inUse, setInUse] = useState(item ? String(item.inUse) : "0");
  const [damaged, setDamaged] = useState(item ? String(item.damaged) : "0");
  const [condition, setCondition] = useState<ItemCondition>(item?.condition ?? "good");
  const [unitCost, setUnitCost] = useState(item ? String(item.unitCost) : "0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const usingCustomCategory = category === "__new__";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const resolvedCategory = usingCustomCategory ? customCategory.trim() : category;
    if (!name.trim()) {
      setError("Item name is required.");
      return;
    }
    if (!resolvedCategory) {
      setError("Category is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const input = {
        name: name.trim(),
        category: resolvedCategory,
        location: location || null,
        totalQty: totalQty ? Number(totalQty) : 0,
        inUse: inUse ? Number(inUse) : 0,
        damaged: damaged ? Number(damaged) : 0,
        condition,
        unitCost: unitCost ? Number(unitCost) : 0,
        schoolId: multiSchool ? schoolId : undefined,
      };
      if (mode === "add") {
        await createItem(input);
      } else if (item) {
        await updateItem({ id: item.id, ...input });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save item");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{mode === "add" ? "Add Item" : `Edit ${item?.name}`}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {multiSchool && (
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">School</label>
                <div className="relative">
                  <select className={selectClass} value={schoolId} onChange={(e) => setSchoolId(e.target.value)}>
                    {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                </div>
              </div>
            )}
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Item Name *</label>
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Whiteboard Marker" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Category *</label>
              <div className="relative">
                <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  <option value="__new__">+ New category…</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Location</label>
              <input className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Store Room" />
            </div>
            {usingCustomCategory && (
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">New Category Name *</label>
                <input className={inputClass} value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="e.g. Sports Equipment" required />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Total Qty *</label>
              <input type="number" min={0} className={inputClass} value={totalQty} onChange={(e) => setTotalQty(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Unit Cost (₹)</label>
              <input type="number" min={0} step="0.01" className={inputClass} value={unitCost} onChange={(e) => setUnitCost(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">In Use</label>
              <input type="number" min={0} className={inputClass} value={inUse} onChange={(e) => setInUse(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Damaged</label>
              <input type="number" min={0} className={inputClass} value={damaged} onChange={(e) => setDamaged(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Condition</label>
              <div className="flex gap-2">
                {(["good", "fair", "poor"] as ItemCondition[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCondition(c)}
                    className={`h-9 flex-1 rounded-lg text-xs font-medium capitalize transition-colors ${condition === c ? "bg-primary-500 text-white" : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
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
              {mode === "add" ? "Add Item" : "Save Changes"}
            </FancyButton>
          </div>
        </form>
      </div>
    </div>
  );
}
