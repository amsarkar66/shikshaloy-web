"use client";

import { ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { CARD_SIZES, LAYOUT_OPTIONS, type IdCardSettings, type CardOrientation } from "@/lib/id-cards/templates";

const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

export function CardSettingsPanel({
  settings, onChange,
}: {
  settings: IdCardSettings;
  onChange: (settings: IdCardSettings) => void;
}) {
  function set<K extends keyof IdCardSettings>(key: K, value: IdCardSettings[K]) {
    onChange({ ...settings, [key]: value });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Layout</label>
        <div className="relative">
          <select className={selectClass} value={settings.layoutId} onChange={(e) => set("layoutId", e.target.value as IdCardSettings["layoutId"])}>
            {LAYOUT_OPTIONS.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Card Size</label>
        <div className="relative">
          <select className={selectClass} value={settings.cardSizeId} onChange={(e) => set("cardSizeId", e.target.value)}>
            {CARD_SIZES.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Orientation</label>
        <div className="flex h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-0.5">
          {(["vertical", "horizontal"] as CardOrientation[]).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => set("orientation", o)}
              className={`flex-1 rounded-md text-xs font-medium capitalize transition-colors ${
                settings.orientation === o
                  ? "bg-primary-500 text-white"
                  : "text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label htmlFor="show-barcode" className="text-sm text-gray-700 dark:text-zinc-300">Show Barcode</label>
        <Switch id="show-barcode" checked={settings.showBarcode} onCheckedChange={(v) => set("showBarcode", v)} />
      </div>
      <div className="flex items-center justify-between">
        <label htmlFor="show-qr" className="text-sm text-gray-700 dark:text-zinc-300">Show QR Code</label>
        <Switch id="show-qr" checked={settings.showQr} onCheckedChange={(v) => set("showQr", v)} />
      </div>
    </div>
  );
}
