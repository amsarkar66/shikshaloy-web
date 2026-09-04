"use client";

import { DropdownWithOther } from "./dropdown-with-other";
import { RELIGION_OPTIONS } from "@/lib/constants/religions";

interface ReligionSelectProps {
  value: string;
  onChange: (value: string) => void;
  selectClassName: string;
  wrapperClassName?: string;
  disabled?: boolean;
}

export function ReligionSelect(props: ReligionSelectProps) {
  return <DropdownWithOther {...props} options={RELIGION_OPTIONS} />;
}
