"use client";

import type { ChangeEvent, ReactNode } from "react";
import { UploadCloud } from "lucide-react";

export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Wrapper({ label, required, full, children }: { label: string; required?: boolean; full?: boolean; children: ReactNode }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-xs font-semibold text-gray-600">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

const fieldClass =
  "h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  required,
  full,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  full?: boolean;
  placeholder?: string;
}) {
  return (
    <Wrapper label={label} required={required} full={full}>
      <input
        type={type}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={fieldClass}
      />
    </Wrapper>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  full,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  full?: boolean;
  rows?: number;
}) {
  return (
    <Wrapper label={label} full={full}>
      <textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
      />
    </Wrapper>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  full,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  full?: boolean;
}) {
  return (
    <Wrapper label={label} required={required} full={full}>
      <select value={value} required={required} onChange={(e) => onChange(e.target.value)} className={fieldClass}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}

export function CheckboxField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 sm:col-span-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300 accent-primary-500"
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

export function FileField({
  label,
  file,
  onChange,
  hint,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
  hint?: string;
}) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(e.target.files?.[0] ?? null);
  }

  return (
    <label className="block cursor-pointer">
      <span className="mb-1.5 block text-xs font-semibold text-gray-600">{label}</span>
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 transition-colors hover:border-primary-300">
        <UploadCloud className="h-4 w-4 shrink-0 text-primary-400" />
        <span className="truncate">{file ? file.name : "Choose a file (PDF, JPG, PNG — max 5MB)"}</span>
        <input type="file" accept=".pdf,image/jpeg,image/png,image/webp" onChange={handleChange} className="hidden" />
      </div>
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </label>
  );
}
