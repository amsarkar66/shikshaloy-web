"use client";

import { AddressFields } from "./address-fields";
import type { StructuredAddress } from "@/lib/students/address";

interface DualAddressFieldsProps {
  presentValue: StructuredAddress;
  permanentValue: StructuredAddress;
  sameAsPresent: boolean;
  onPresentChange: (value: StructuredAddress) => void;
  onPermanentChange: (value: StructuredAddress) => void;
  onSameAsPresentChange: (same: boolean) => void;
  inputClassName: string;
  selectClassName: string;
  disabled?: boolean;
}

const headingClass = "mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500";

// Present + Permanent address, with a "same as present" checkbox so the
// common case (they match) doesn't mean re-typing six fields twice.
export function DualAddressFields({
  presentValue, permanentValue, sameAsPresent,
  onPresentChange, onPermanentChange, onSameAsPresentChange,
  inputClassName, selectClassName, disabled,
}: DualAddressFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className={headingClass}>Present Address</p>
        <AddressFields
          value={presentValue}
          onChange={onPresentChange}
          inputClassName={inputClassName}
          selectClassName={selectClassName}
          disabled={disabled}
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={sameAsPresent}
          onChange={(e) => onSameAsPresentChange(e.target.checked)}
          disabled={disabled}
        />
        Permanent address same as present address
      </label>

      {!sameAsPresent && (
        <div>
          <p className={headingClass}>Permanent Address</p>
          <AddressFields
            value={permanentValue}
            onChange={onPermanentChange}
            inputClassName={inputClassName}
            selectClassName={selectClassName}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
}
