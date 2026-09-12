"use client";

import { useMemo, useState } from "react";
import { Loader2, Minus, Plus, X } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { adjustStock, type StockField } from "../actions";
import type { InventoryItem } from "../_data/inventory";

const FIELD_OPTIONS: { value: StockField; label: string }[] = [
  { value: "total", label: "Total" },
  { value: "inUse", label: "In Use" },
  { value: "damaged", label: "Damaged" },
];

function currentValue(item: InventoryItem, field: StockField): number {
  if (field === "total") return item.totalQty;
  if (field === "inUse") return item.inUse;
  return item.damaged;
}

export function AdjustStockModal({
  item, onClose, onAdjusted,
}: {
  item: InventoryItem;
  onClose: () => void;
  onAdjusted: () => void;
}) {
  const [field, setField] = useState<StockField>("total");
  const [direction, setDirection] = useState<1 | -1>(1);
  const [amount, setAmount] = useState("1");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = currentValue(item, field);
  const parsedAmount = Number(amount) || 0;
  const delta = direction * parsedAmount;
  const nextValue = base + delta;

  const canSubmit = useMemo(() => parsedAmount > 0 && reason.trim().length > 0 && nextValue >= 0, [parsedAmount, reason, nextValue]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await adjustStock(item.id, field, delta, reason);
      onAdjusted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to adjust stock");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Adjust Stock</p>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Which quantity?</label>
            <div className="flex gap-2">
              {FIELD_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setField(f.value)}
                  className={`h-9 flex-1 rounded-lg text-xs font-medium transition-colors ${
                    field === f.value ? "bg-primary-500 text-white" : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Change</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDirection(-1)}
                title="Decrease"
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                  direction === -1 ? "border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-500/10 dark:text-red-400" : "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400"
                }`}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-center text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              />
              <button
                type="button"
                onClick={() => setDirection(1)}
                title="Increase"
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                  direction === 1 ? "border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400" : "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400"
                }`}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="mt-1.5 text-xs text-gray-500 dark:text-zinc-400">
              {FIELD_OPTIONS.find((f) => f.value === field)?.label}: <span className="font-medium text-gray-700 dark:text-zinc-300">{base}</span>
              {" → "}
              <span className={`font-semibold ${nextValue < 0 ? "text-red-500" : "text-gray-900 dark:text-zinc-100"}`}>{nextValue}</span>
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. Purchased 10 more units, or 2 units damaged in lab"
              className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              required
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
            Cancel
          </button>
          <FancyButton type="submit" disabled={!canSubmit || busy} size="sm">
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save Adjustment
          </FancyButton>
        </div>
      </form>
    </div>
  );
}
