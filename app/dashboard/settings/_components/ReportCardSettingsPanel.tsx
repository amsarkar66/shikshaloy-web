"use client";

import { useEffect, useState } from "react";
import { X, Check, Loader2, FileText } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { getReportCardSettings, saveReportCardSettings } from "../actions";
import {
  REPORT_CARD_TEMPLATES, REPORT_CARD_FIELD_OPTIONS, DEFAULT_REPORT_CARD_SETTINGS,
  type ReportCardSettings,
} from "@/lib/report-cards/templates";

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

export function ReportCardSettingsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [settings, setSettings] = useState<ReportCardSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSaved(false);
    getReportCardSettings().then(setSettings).catch(() => setSettings(DEFAULT_REPORT_CARD_SETTINGS));
  }, [open]);

  if (!open) return null;

  function toggleField(key: keyof ReportCardSettings["visibleFields"]) {
    setSettings((prev) => prev && { ...prev, visibleFields: { ...prev.visibleFields, [key]: !prev.visibleFields[key] } });
    setSaved(false);
  }

  async function handleSave() {
    if (!settings) return;
    setBusy(true);
    setError(null);
    try {
      await saveReportCardSettings(settings);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save report card template");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Report Card Template</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">Color theme, optional fields, and footer note for the printable Grade Card.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {settings === null ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-medium text-gray-600 dark:text-zinc-400">Color Theme</p>
              <div className="flex gap-2 flex-wrap">
                {REPORT_CARD_TEMPLATES.map((t) => {
                  const active = settings.templateId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setSettings({ ...settings, templateId: t.id }); setSaved(false); }}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-1.5 transition-colors ${active ? "border-primary-500" : "border-transparent hover:border-gray-200 dark:hover:border-zinc-700"}`}
                    >
                      <div className={`relative h-10 w-16 rounded-lg ${t.swatch}`}>
                        {active && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-white">
                            <Check className="h-2.5 w-2.5" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-zinc-400">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-gray-600 dark:text-zinc-400">Optional Fields</p>
              <div className="flex gap-2 flex-wrap">
                {REPORT_CARD_FIELD_OPTIONS.map((f) => {
                  const active = settings.visibleFields[f.key];
                  return (
                    <button
                      key={f.key}
                      onClick={() => toggleField(f.key)}
                      aria-pressed={active}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? "border-primary-500 bg-primary-500/10 text-primary-700 dark:text-primary-300"
                          : "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-gray-600 dark:text-zinc-400">Footer Note</p>
              <input
                className={inputClass}
                value={settings.footerNote}
                onChange={(e) => { setSettings({ ...settings, footerNote: e.target.value }); setSaved(false); }}
                placeholder="This is a computer-generated grade card."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              {saved && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3.5 w-3.5" /> Saved
                </span>
              )}
              <FancyButton onClick={handleSave} disabled={busy} size="sm">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Save Template
              </FancyButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
