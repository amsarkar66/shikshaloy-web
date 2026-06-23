export type SubjectType   = "core" | "elective";
export type SubjectStatus = "active" | "inactive";

export interface Subject {
  id:          string;
  name:        string;
  code:        string;
  type:        SubjectType;
  status:      SubjectStatus;
  classes:     string[];   // e.g. ["5", "6", "7"]
  teacher:     string;
  teacherId:   string;
  weeklyPeriods: number;
}

export const ALL_SUBJECTS: Subject[] = [
  { id: "s1",  name: "Mathematics",          code: "MATH",  type: "core",     status: "active",   classes: ["5","6","7","8","9","10"], teacher: "Ramesh Kumar",    teacherId: "t1",  weeklyPeriods: 6 },
  { id: "s2",  name: "English Language",     code: "ENG",   type: "core",     status: "active",   classes: ["5","6","7","8","9","10"], teacher: "Priya Sharma",    teacherId: "t2",  weeklyPeriods: 5 },
  { id: "s3",  name: "Science",              code: "SCI",   type: "core",     status: "active",   classes: ["5","6","7","8"],          teacher: "Anil Verma",      teacherId: "t3",  weeklyPeriods: 5 },
  { id: "s4",  name: "Physics",              code: "PHY",   type: "core",     status: "active",   classes: ["9","10"],                 teacher: "Sunita Rao",      teacherId: "t4",  weeklyPeriods: 5 },
  { id: "s5",  name: "Chemistry",            code: "CHE",   type: "core",     status: "active",   classes: ["9","10"],                 teacher: "Mohan Iyer",      teacherId: "t5",  weeklyPeriods: 5 },
  { id: "s6",  name: "Biology",              code: "BIO",   type: "core",     status: "active",   classes: ["9","10"],                 teacher: "Kavita Nair",     teacherId: "t6",  weeklyPeriods: 4 },
  { id: "s7",  name: "Social Studies",       code: "SST",   type: "core",     status: "active",   classes: ["5","6","7","8"],          teacher: "Deepak Singh",    teacherId: "t7",  weeklyPeriods: 4 },
  { id: "s8",  name: "History & Civics",     code: "HIS",   type: "core",     status: "active",   classes: ["9","10"],                 teacher: "Neha Gupta",      teacherId: "t8",  weeklyPeriods: 4 },
  { id: "s9",  name: "Geography",            code: "GEO",   type: "core",     status: "active",   classes: ["9","10"],                 teacher: "Vijay Mehta",     teacherId: "t9",  weeklyPeriods: 3 },
  { id: "s10", name: "Hindi",                code: "HIN",   type: "core",     status: "active",   classes: ["5","6","7","8","9","10"], teacher: "Seema Joshi",     teacherId: "t10", weeklyPeriods: 4 },
  { id: "s11", name: "Computer Science",     code: "CS",    type: "core",     status: "active",   classes: ["8","9","10"],             teacher: "Rajiv Bose",      teacherId: "t11", weeklyPeriods: 3 },
  { id: "s12", name: "Physical Education",   code: "PE",    type: "core",     status: "active",   classes: ["5","6","7","8","9","10"], teacher: "Arjun Patil",     teacherId: "t12", weeklyPeriods: 2 },
  { id: "s13", name: "Art & Craft",          code: "ART",   type: "elective", status: "active",   classes: ["5","6","7"],              teacher: "Meena Das",       teacherId: "t13", weeklyPeriods: 2 },
  { id: "s14", name: "Music",                code: "MUS",   type: "elective", status: "active",   classes: ["5","6","7","8"],          teacher: "Ravi Shankar",    teacherId: "t14", weeklyPeriods: 2 },
  { id: "s15", name: "Dance",                code: "DAN",   type: "elective", status: "active",   classes: ["5","6"],                  teacher: "Ananya Pillai",   teacherId: "t15", weeklyPeriods: 2 },
  { id: "s16", name: "Environmental Science",code: "EVS",   type: "core",     status: "active",   classes: ["5","6"],                  teacher: "Pooja Tiwari",    teacherId: "t16", weeklyPeriods: 3 },
  { id: "s17", name: "Economics",            code: "ECO",   type: "elective", status: "active",   classes: ["9","10"],                 teacher: "Harish Reddy",    teacherId: "t17", weeklyPeriods: 4 },
  { id: "s18", name: "Sanskrit",             code: "SAN",   type: "elective", status: "inactive", classes: ["6","7","8"],              teacher: "Lakshmi Nambiar", teacherId: "t18", weeklyPeriods: 3 },
  { id: "s19", name: "French",               code: "FRE",   type: "elective", status: "active",   classes: ["8","9","10"],             teacher: "Sanjay Roy",      teacherId: "t19", weeklyPeriods: 3 },
  { id: "s20", name: "Information Technology",code: "IT",   type: "elective", status: "inactive", classes: ["9","10"],                 teacher: "Usha Menon",      teacherId: "t20", weeklyPeriods: 2 },
];

const COLORS = [
  "bg-indigo-500", "bg-violet-500", "bg-blue-500", "bg-emerald-500",
  "bg-rose-500",   "bg-amber-500",  "bg-teal-500", "bg-pink-500",
  "bg-cyan-500",   "bg-orange-500",
];

export function avatarColor(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return COLORS[n % COLORS.length];
}

export function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export function classRange(classes: string[]) {
  if (classes.length === 0) return "—";
  const nums = classes.map(Number).sort((a, b) => a - b);
  if (nums.length === 1) return `Class ${nums[0]}`;
  const isConsecutive = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
  if (isConsecutive) return `Class ${nums[0]}–${nums[nums.length - 1]}`;
  return nums.map((n) => `${n}`).join(", ");
}
