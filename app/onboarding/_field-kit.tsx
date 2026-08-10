"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import {
  Select as SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectIcon,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry",
];

// Alphabetical — India sits at its natural spot; the Select is defaulted to
// it via `value`, and the dropdown opens aligned on the selected item, so it
// doesn't need special placement in the list.
export const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia",
  "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados",
  "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina",
  "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia",
  "Cameroon", "Canada", "Chad", "Chile", "China", "Colombia", "Comoros", "Costa Rica",
  "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland",
  "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Guatemala",
  "Guinea", "Guyana", "Haiti", "Honduras", "Hong Kong", "Hungary", "Iceland", "India",
  "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan",
  "Kenya", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia",
  "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia",
  "Maldives", "Mali", "Malta", "Mauritania", "Mauritius", "Mexico", "Moldova", "Monaco",
  "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nepal",
  "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea",
  "North Macedonia", "Norway", "Oman", "Pakistan", "Panama", "Papua New Guinea",
  "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia",
  "Rwanda", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore",
  "Slovakia", "Slovenia", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain",
  "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan",
  "Tanzania", "Thailand", "Togo", "Trinidad and Tobago", "Tunisia", "Turkey",
  "Turkmenistan", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Uzbekistan", "Venezuela", "Vietnam", "Yemen", "Zambia",
  "Zimbabwe",
];

export function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

export function Input({
  placeholder, value, onChange, type = "text", disabled, invalid,
}: {
  placeholder?: string; value: string; onChange: (v: string) => void;
  type?: string; disabled?: boolean; invalid?: boolean;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-lg border bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-50 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 disabled:opacity-50 transition-shadow ${
        invalid
          ? "border-red-300 dark:border-red-500/50 focus:ring-red-500/30"
          : "border-gray-200 dark:border-zinc-700 focus:ring-primary-500/40"
      }`}
    />
  );
}

export function Select({
  value, onChange, children, placeholder, invalid,
}: {
  value: string; onChange: (v: string) => void;
  children: React.ReactNode; placeholder?: string; invalid?: boolean;
}) {
  // Accepts plain <option value="x">x</option> children (same call-site API
  // as a native select) and renders them as styled Base UI select items.
  const items = React.Children.toArray(children) as React.ReactElement<{
    value: string;
    children: React.ReactNode;
  }>[];

  return (
    <SelectRoot
      value={value === "" ? null : value}
      onValueChange={(v) => onChange((v as string | null) ?? "")}
    >
      <SelectTrigger invalid={invalid}>
        <SelectValue>{(v: string | null) => v ?? placeholder ?? ""}</SelectValue>
        <SelectIcon />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.props.value} value={item.props.value}>
            {item.props.children}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
}

export function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {msg}
    </p>
  );
}
