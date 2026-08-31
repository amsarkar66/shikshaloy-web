"use client";

import { useState } from "react";
import { saveDraftSection } from "@/lib/site-settings/actions";
import type { SiteSettings } from "@/lib/site-settings/types";
import { FieldLabel, SaveRow, SectionCard, useDraftSave } from "../_field-kit";

const DEFAULT_PRIMARY = "#246150";

export function ThemeSection({ value }: { value: SiteSettings["theme"] }) {
  const [color, setColor] = useState(value.primaryColor ?? DEFAULT_PRIMARY);
  const [useDefault, setUseDefault] = useState(value.primaryColor === null);
  const { run, pending, error, saved } = useDraftSave((v: SiteSettings["theme"]) => saveDraftSection("theme", v));

  return (
    <SectionCard title="Theme" description="Your site's accent color — used for buttons, links, and highlights.">
      <div>
        <FieldLabel hint="Applied across your public site once published.">Primary color</FieldLabel>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={useDefault ? DEFAULT_PRIMARY : color}
            disabled={useDefault}
            onChange={(e) => setColor(e.target.value)}
            className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-gray-200 dark:border-zinc-800 bg-transparent p-1 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <input
            type="text"
            value={useDefault ? DEFAULT_PRIMARY : color}
            disabled={useDefault}
            onChange={(e) => setColor(e.target.value)}
            className="w-32 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-mono text-gray-900 dark:text-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
          />
          <button
            type="button"
            onClick={() => setUseDefault((v) => !v)}
            className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            {useDefault ? "Customize" : "Use default"}
          </button>
        </div>
      </div>
      <SaveRow
        pending={pending}
        error={error}
        saved={saved}
        onSave={() => run({ primaryColor: useDefault ? null : color })}
      />
    </SectionCard>
  );
}
