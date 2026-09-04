"use client";

import { CountrySelect } from "./country-select";
import type { StructuredAddress } from "@/lib/students/address";

interface AddressFieldsProps {
  value: StructuredAddress;
  onChange: (value: StructuredAddress) => void;
  inputClassName: string;
  selectClassName: string;
  disabled?: boolean;
}

const labelClass = "mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400";

export function AddressFields({ value, onChange, inputClassName, selectClassName, disabled }: AddressFieldsProps) {
  function set<K extends keyof StructuredAddress>(key: K, v: string) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <label className={labelClass}>Address Line 1</label>
        <input className={inputClassName} value={value.line1} onChange={(e) => set("line1", e.target.value)} disabled={disabled} />
      </div>
      <div className="col-span-2">
        <label className={labelClass}>Address Line 2</label>
        <input className={inputClassName} value={value.line2} onChange={(e) => set("line2", e.target.value)} disabled={disabled} />
      </div>
      <div>
        <label className={labelClass}>City</label>
        <input className={inputClassName} value={value.city} onChange={(e) => set("city", e.target.value)} disabled={disabled} />
      </div>
      <div>
        <label className={labelClass}>State</label>
        <input className={inputClassName} value={value.state} onChange={(e) => set("state", e.target.value)} disabled={disabled} />
      </div>
      <div>
        <label className={labelClass}>Postal / ZIP Code</label>
        <input className={inputClassName} value={value.postalCode} onChange={(e) => set("postalCode", e.target.value)} disabled={disabled} />
      </div>
      <div>
        <label className={labelClass}>Country</label>
        <CountrySelect value={value.country} onChange={(v) => set("country", v)} selectClassName={selectClassName} disabled={disabled} />
      </div>
    </div>
  );
}
