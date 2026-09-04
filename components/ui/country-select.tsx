"use client";

import { DropdownWithOther } from "./dropdown-with-other";
import { COUNTRY_OPTIONS } from "@/lib/constants/countries";

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  selectClassName: string;
  wrapperClassName?: string;
  disabled?: boolean;
}

export function CountrySelect(props: CountrySelectProps) {
  return <DropdownWithOther {...props} options={COUNTRY_OPTIONS} />;
}
