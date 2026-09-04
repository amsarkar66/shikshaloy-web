"use client";

import { DropdownWithOther } from "./dropdown-with-other";
import { OCCUPATION_OPTIONS } from "@/lib/constants/occupations";

interface OccupationSelectProps {
  value: string;
  onChange: (value: string) => void;
  selectClassName: string;
  wrapperClassName?: string;
  disabled?: boolean;
}

// A plain <select> of common, country-agnostic occupation categories
// (parents.occupation / admission_applications.*_occupation).
export function OccupationSelect(props: OccupationSelectProps) {
  return <DropdownWithOther {...props} options={OCCUPATION_OPTIONS} />;
}
