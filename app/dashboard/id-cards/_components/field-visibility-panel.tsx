"use client";

import { FileText, Calendar, Droplets, Phone } from "lucide-react";
import { ID_CARD_FIELD_OPTIONS, type IdCardSettings, type IdCardVisibleFields } from "@/lib/id-cards/templates";

const FIELD_ICONS: Record<keyof IdCardVisibleFields, React.ElementType> = {
  admissionNo: FileText,
  dob: Calendar,
  bloodGroup: Droplets,
  phone: Phone,
};

export function FieldVisibilityPanel({
  settings, onChange,
}: {
  settings: IdCardSettings;
  onChange: (settings: IdCardSettings) => void;
}) {
  function setField(key: keyof IdCardVisibleFields, value: boolean) {
    onChange({ ...settings, visibleFields: { ...settings.visibleFields, [key]: value } });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ID_CARD_FIELD_OPTIONS.map((f) => {
        const active = settings.visibleFields[f.key];
        const Icon = FIELD_ICONS[f.key];
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => setField(f.key, !active)}
            aria-pressed={active}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "border-primary-500 bg-primary-500 text-white"
                : "border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600"
            }`}
          >
            <Icon className="h-3 w-3" />
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
