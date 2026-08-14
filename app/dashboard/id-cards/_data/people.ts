export type PersonType = "student" | "staff";

export interface CardPerson {
  id: string;
  type: PersonType;
  name: string;
  idNumber: string;        // roll_no or employee_id
  admissionNo: string | null;
  gradeLevel: number | null;
  section: string | null;
  subtitle: string;        // "Class 9-A" or designation
  bloodGroup: string;
  phone: string | null;
  dob: string | null;      // formatted, e.g. "14 Aug 2011"
  photoUrl: string | null;
  validTill: string;       // formatted, e.g. "31 Mar 2026"
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500",
];

export function avatarColor(id: string): string {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

export function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}
