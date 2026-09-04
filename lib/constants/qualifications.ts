// Deliberately generic (not tied to any one country's system, e.g. India's
// "10+2" or the UK's "GCSE") so the dropdown reads sensibly for a parent
// educated anywhere in the world.
export const QUALIFICATION_OPTIONS = [
  "None",
  "Primary Education",
  "Secondary Education",
  "Higher Secondary",
  "Vocational / Diploma",
  "Bachelor’s Degree",
  "Master’s Degree",
  "Professional Degree",
  "Doctorate",
] as const;
