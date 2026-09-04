"use client";

import { ChevronDown } from "lucide-react";

interface DropdownWithOtherProps {
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  selectClassName: string;
  wrapperClassName?: string;
  disabled?: boolean;
}

// Plain <select> of a fixed option list plus a trailing "Other" — shared by
// QualificationSelect and OccupationSelect.
export function DropdownWithOther({
  value, onChange, options, selectClassName, wrapperClassName, disabled,
}: DropdownWithOtherProps) {
  return (
    <div className={`relative ${wrapperClassName ?? ""}`}>
      <select
        className={selectClassName}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
        <option value="Other">Other</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
    </div>
  );
}
