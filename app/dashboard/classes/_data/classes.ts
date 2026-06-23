export interface ClassSection {
  id:           string;  // "5-A"
  classNum:     string;  // "5"
  section:      string;  // "A"
  teacher:      string;
  room:         string;
  capacity:     number;
  enrolled:     number;
  avgAttendance: number; // percentage
  subjectCount: number;
  status:       "active" | "inactive";
}

export const ALL_SECTIONS: ClassSection[] = [
  // Class 5
  { id: "5-A",  classNum: "5",  section: "A", teacher: "Seema Joshi",     room: "R-101", capacity: 40, enrolled: 38, avgAttendance: 87, subjectCount: 10, status: "active" },
  { id: "5-B",  classNum: "5",  section: "B", teacher: "Pooja Tiwari",    room: "R-102", capacity: 40, enrolled: 36, avgAttendance: 83, subjectCount: 10, status: "active" },
  // Class 6
  { id: "6-A",  classNum: "6",  section: "A", teacher: "Anil Verma",      room: "R-103", capacity: 40, enrolled: 40, avgAttendance: 91, subjectCount:  9, status: "active" },
  { id: "6-B",  classNum: "6",  section: "B", teacher: "Deepak Singh",    room: "R-104", capacity: 40, enrolled: 37, avgAttendance: 88, subjectCount:  9, status: "active" },
  // Class 7
  { id: "7-A",  classNum: "7",  section: "A", teacher: "Meena Das",       room: "R-105", capacity: 40, enrolled: 39, avgAttendance: 79, subjectCount:  8, status: "active" },
  { id: "7-B",  classNum: "7",  section: "B", teacher: "Ravi Shankar",    room: "R-106", capacity: 40, enrolled: 34, avgAttendance: 85, subjectCount:  8, status: "active" },
  // Class 8
  { id: "8-A",  classNum: "8",  section: "A", teacher: "Rajiv Bose",      room: "R-201", capacity: 42, enrolled: 41, avgAttendance: 93, subjectCount:  9, status: "active" },
  { id: "8-B",  classNum: "8",  section: "B", teacher: "Arjun Patil",     room: "R-202", capacity: 42, enrolled: 38, avgAttendance: 90, subjectCount:  9, status: "active" },
  // Class 9
  { id: "9-A",  classNum: "9",  section: "A", teacher: "Sunita Rao",      room: "R-203", capacity: 42, enrolled: 42, avgAttendance: 95, subjectCount: 11, status: "active" },
  { id: "9-B",  classNum: "9",  section: "B", teacher: "Mohan Iyer",      room: "R-204", capacity: 42, enrolled: 39, avgAttendance: 92, subjectCount: 11, status: "active" },
  // Class 10
  { id: "10-A", classNum: "10", section: "A", teacher: "Kavita Nair",     room: "R-205", capacity: 45, enrolled: 44, avgAttendance: 96, subjectCount: 12, status: "active" },
  { id: "10-B", classNum: "10", section: "B", teacher: "Neha Gupta",      room: "R-206", capacity: 45, enrolled: 43, avgAttendance: 94, subjectCount: 12, status: "active" },
];

export const CLASS_NUMBERS = ["5", "6", "7", "8", "9", "10"];

export function attendanceColor(pct: number): string {
  if (pct >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 80) return "text-amber-600   dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function attendanceBar(pct: number): string {
  if (pct >= 90) return "bg-emerald-500";
  if (pct >= 80) return "bg-amber-500";
  return "bg-red-500";
}

export function capacityColor(enrolled: number, capacity: number): string {
  const pct = enrolled / capacity;
  if (pct >= 1)   return "bg-red-500";
  if (pct >= 0.9) return "bg-amber-500";
  return "bg-indigo-500";
}
