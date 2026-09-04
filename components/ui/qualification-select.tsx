"use client";

import { DropdownWithOther } from "./dropdown-with-other";
import { QUALIFICATION_OPTIONS } from "@/lib/constants/qualifications";

interface QualificationSelectProps {
  value: string;
  onChange: (value: string) => void;
  selectClassName: string;
  wrapperClassName?: string;
  disabled?: boolean;
}

// A plain <select> of common, country-agnostic qualification levels
// (parents.qualification / admission_applications.*_qualification).
export function QualificationSelect(props: QualificationSelectProps) {
  return <DropdownWithOther {...props} options={QUALIFICATION_OPTIONS} />;
}
