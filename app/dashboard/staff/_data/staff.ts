export type StaffType   = "teaching" | "non_teaching";
export type StaffStatus = "active" | "on_leave" | "inactive";

export interface StaffMember {
  id: number;
  name: string;
  employeeId: string;
  type: StaffType;
  designation: string;
  department: string;
  phone: string;
  email: string;
  joinedDate: string;          // "YYYY-MM-DD"
  status: StaffStatus;
  subjects?: string[];
  classTeacherOf?: string;     // e.g. "10-A"
  permissionTemplateId?: string;   // e.g. "librarian"
  permissionTemplateName?: string; // e.g. "Librarian"
}

export const ALL_STAFF: StaffMember[] = [
  { id:  1, name: "Sunita Sharma",    employeeId:"EMP001", type:"teaching",     designation:"Mathematics Teacher",    department:"Mathematics",           phone:"+91 98765 11001", email:"sunita.sharma@shikshaloy.in",    joinedDate:"2018-07-01", status:"active",   subjects:["Mathematics"],                   classTeacherOf:"10-A" },
  { id:  2, name: "Priya Verma",      employeeId:"EMP002", type:"teaching",     designation:"English Teacher",        department:"English",               phone:"+91 98765 11002", email:"priya.verma@shikshaloy.in",      joinedDate:"2016-08-01", status:"active",   subjects:["English", "Literature"],         classTeacherOf:"9-A"  },
  { id:  3, name: "Amit Singh",       employeeId:"EMP003", type:"teaching",     designation:"Hindi Teacher",          department:"Hindi",                 phone:"+91 98765 11003", email:"amit.singh@shikshaloy.in",       joinedDate:"2015-06-01", status:"active",   subjects:["Hindi"],                         classTeacherOf:"8-A"  },
  { id:  4, name: "Anita Gupta",      employeeId:"EMP004", type:"teaching",     designation:"Science Teacher",        department:"Science",               phone:"+91 98765 11004", email:"anita.gupta@shikshaloy.in",      joinedDate:"2019-04-01", status:"active",   subjects:["General Science", "Biology"],    classTeacherOf:"7-A"  },
  { id:  5, name: "Suresh Reddy",     employeeId:"EMP005", type:"teaching",     designation:"Physics Teacher",        department:"Science",               phone:"+91 98765 11005", email:"suresh.reddy@shikshaloy.in",     joinedDate:"2021-07-15", status:"active",   subjects:["Physics"]                                        },
  { id:  6, name: "Meenakshi Iyer",   employeeId:"EMP006", type:"teaching",     designation:"Chemistry Teacher",      department:"Science",               phone:"+91 98765 11006", email:"meenakshi.iyer@shikshaloy.in",   joinedDate:"2017-08-01", status:"active",   subjects:["Chemistry"],                     classTeacherOf:"6-B"  },
  { id:  7, name: "Deepak Joshi",     employeeId:"EMP007", type:"teaching",     designation:"Mathematics Teacher",    department:"Mathematics",           phone:"+91 98765 11007", email:"deepak.joshi@shikshaloy.in",     joinedDate:"2020-06-15", status:"active",   subjects:["Mathematics", "Statistics"]                      },
  { id:  8, name: "Kavitha Nair",     employeeId:"EMP008", type:"teaching",     designation:"Social Studies Teacher", department:"Humanities",            phone:"+91 98765 11008", email:"kavitha.nair@shikshaloy.in",     joinedDate:"2022-07-01", status:"active",   subjects:["Social Studies", "Civics"],      classTeacherOf:"9-B"  },
  { id:  9, name: "Vijay Sharma",     employeeId:"EMP009", type:"teaching",     designation:"Commerce Teacher",       department:"Commerce",              phone:"+91 98765 11009", email:"vijay.sharma@shikshaloy.in",     joinedDate:"2019-08-01", status:"active",   subjects:["Accountancy", "Business St."]                    },
  { id: 10, name: "Rekha Pillai",     employeeId:"EMP010", type:"teaching",     designation:"English Teacher",        department:"English",               phone:"+91 98765 11010", email:"rekha.pillai@shikshaloy.in",     joinedDate:"2020-07-01", status:"active",   subjects:["English"],                       classTeacherOf:"10-B" },
  { id: 11, name: "Pooja Agarwal",    employeeId:"EMP011", type:"teaching",     designation:"Computer Sc. Teacher",   department:"Computer Science",      phone:"+91 98765 11011", email:"pooja.agarwal@shikshaloy.in",    joinedDate:"2021-08-01", status:"on_leave", subjects:["Computer Science", "IT"],        classTeacherOf:"8-B"  },
  { id: 12, name: "Arjun Tiwari",     employeeId:"EMP012", type:"teaching",     designation:"P.E. Teacher",           department:"Sports & Physical Ed.", phone:"+91 98765 11012", email:"arjun.tiwari@shikshaloy.in",     joinedDate:"2026-03-01", status:"active",   subjects:["Physical Education"]                             },
  { id: 13, name: "Rajani Chopra",    employeeId:"EMP013", type:"non_teaching", designation:"Vice Principal",         department:"Administration",        phone:"+91 98765 11013", email:"rajani.chopra@shikshaloy.in",    joinedDate:"2012-06-01", status:"active"   },
  { id: 14, name: "Mohan Bhatt",      employeeId:"EMP014", type:"non_teaching", designation:"Office Manager",         department:"Administration",        phone:"+91 98765 11014", email:"mohan.bhatt@shikshaloy.in",      joinedDate:"2014-08-01", status:"active",   permissionTemplateId:"hr_manager",   permissionTemplateName:"HR Manager"   },
  { id: 15, name: "Lakshmi Devi",     employeeId:"EMP015", type:"non_teaching", designation:"Senior Accountant",      department:"Accounts",              phone:"+91 98765 11015", email:"lakshmi.devi@shikshaloy.in",     joinedDate:"2016-09-01", status:"active",   permissionTemplateId:"accountant",   permissionTemplateName:"Accountant"   },
  { id: 16, name: "Sanjay Rao",       employeeId:"EMP016", type:"non_teaching", designation:"Librarian",              department:"Library",               phone:"+91 98765 11016", email:"sanjay.rao@shikshaloy.in",       joinedDate:"2018-06-01", status:"active",   permissionTemplateId:"librarian",    permissionTemplateName:"Librarian"    },
  { id: 17, name: "Preeti Mishra",    employeeId:"EMP017", type:"non_teaching", designation:"School Counselor",       department:"Counseling",            phone:"+91 98765 11017", email:"preeti.mishra@shikshaloy.in",    joinedDate:"2020-07-01", status:"active"   },
  { id: 18, name: "Nikhil Desai",     employeeId:"EMP018", type:"non_teaching", designation:"Lab Assistant",          department:"Science",               phone:"+91 98765 11018", email:"nikhil.desai@shikshaloy.in",     joinedDate:"2026-01-10", status:"active",   permissionTemplateId:"lab_assistant", permissionTemplateName:"Lab Assistant" },
  { id: 19, name: "Ramesh Bose",      employeeId:"EMP019", type:"non_teaching", designation:"IT Administrator",       department:"Administration",        phone:"+91 98765 11019", email:"ramesh.bose@shikshaloy.in",      joinedDate:"2023-01-15", status:"on_leave" },
  { id: 20, name: "Geeta Kaur",       employeeId:"EMP020", type:"non_teaching", designation:"Accounts Assistant",     department:"Accounts",              phone:"+91 98765 11020", email:"geeta.kaur@shikshaloy.in",       joinedDate:"2026-04-15", status:"active",   permissionTemplateId:"accountant",   permissionTemplateName:"Accountant"   },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-blue-500",   "bg-violet-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500",  "bg-teal-500",   "bg-indigo-500",  "bg-pink-500",
  "bg-cyan-500",   "bg-orange-500",
];

export function avatarColor(id: number) { return AVATAR_COLORS[id % AVATAR_COLORS.length]; }
export function initials(name: string)  { return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase(); }

const DEPT_COLORS: Record<string, string> = {
  "Mathematics":           "bg-blue-500/10   text-blue-700   dark:text-blue-300",
  "Science":               "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "English":               "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  "Hindi":                 "bg-orange-500/10 text-orange-700 dark:text-orange-300",
  "Humanities":            "bg-amber-500/10  text-amber-700  dark:text-amber-300",
  "Commerce":              "bg-teal-500/10   text-teal-700   dark:text-teal-300",
  "Administration":        "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  "Library":               "bg-purple-500/10 text-purple-700 dark:text-purple-300",
  "Counseling":            "bg-rose-500/10   text-rose-700   dark:text-rose-300",
  "Accounts":              "bg-sky-500/10    text-sky-700    dark:text-sky-300",
  "Sports & Physical Ed.": "bg-cyan-500/10   text-cyan-700   dark:text-cyan-300",
  "Computer Science":      "bg-pink-500/10   text-pink-700   dark:text-pink-300",
};

export function deptColor(dept: string) {
  return DEPT_COLORS[dept] ?? "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300";
}

export function formatJoinDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export function yearsOfService(dateStr: string): string {
  const joined = new Date(dateStr + "T00:00:00");
  const now    = new Date("2026-06-15");
  let years    = now.getFullYear() - joined.getFullYear();
  let months   = now.getMonth() - joined.getMonth();
  if (months < 0) { years--; months += 12; }
  if (years === 0) return `${months}m`;
  if (months === 0) return `${years} yr`;
  return `${years} yr ${months}m`;
}

// ── Detail helpers ────────────────────────────────────────────────────────────

const MONTH_NAMES  = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];
const MONTH_TOTALS = [23, 21, 20, 24, 23, 20, 23, 22, 19, 23, 20, 6];

export function buildMonthlyAttendance(id: number, status: StaffStatus) {
  return MONTH_NAMES.map((month, i) => {
    const total = MONTH_TOTALS[i];
    const seed  = (id * 11 + i * 17) % 20;
    let absent  = seed < 12 ? 0 : (seed < 17 ? 1 : 2);
    // Staff on leave have heavy absences in Oct–Jan
    if (status === "on_leave" && i >= 6 && i <= 9) absent = Math.min(total, 10 + (seed % 5));
    return { month, present: Math.max(0, total - absent), total };
  });
}

const DESIGNATION_BASE: Record<string, number> = {
  "Vice Principal":    75000,
  "Office Manager":    50000,
  "Senior Accountant": 42000,
  "Librarian":         35000,
  "School Counselor":  38000,
  "Lab Assistant":     25000,
  "IT Administrator":  38000,
  "Accounts Assistant":22000,
};

const DEPT_QUALS: Record<string, string[]> = {
  "Mathematics":           ["M.Sc. Mathematics", "B.Ed."],
  "Science":               ["M.Sc. Life Sciences", "B.Ed."],
  "English":               ["M.A. English Literature", "B.Ed."],
  "Hindi":                 ["M.A. Hindi", "B.Ed."],
  "Humanities":            ["M.A. History & Civics", "B.Ed."],
  "Commerce":              ["M.Com.", "B.Ed."],
  "Computer Science":      ["M.Tech. Computer Science", "B.Ed."],
  "Sports & Physical Ed.": ["M.P.Ed.", "B.P.Ed."],
};

const DESIGNATION_QUALS: Record<string, string[]> = {
  "Vice Principal":    ["Ph.D. Education", "M.Ed.", "M.A."],
  "Office Manager":    ["MBA (HR & Admin)", "B.Com."],
  "Senior Accountant": ["M.Com.", "CA Intermediate (ICAI)"],
  "Accounts Assistant":["B.Com."],
  "Librarian":         ["M.Lib. & Information Science"],
  "School Counselor":  ["M.A. Psychology", "RCI Certified Counselor"],
  "Lab Assistant":     ["B.Sc. (Relevant Science)"],
  "IT Administrator":  ["MCA", "CompTIA A+"],
};

export function getQualifications(s: StaffMember): string[] {
  if (s.type === "teaching") return DEPT_QUALS[s.department] ?? ["Relevant Degree", "B.Ed."];
  return DESIGNATION_QUALS[s.designation] ?? ["Relevant Degree"];
}

export function getReportingTo(s: StaffMember): string {
  if (s.designation === "Vice Principal") return "Principal";
  if (s.type === "teaching" || s.designation === "Office Manager") return "Rajani Chopra (Vice Principal)";
  return "Mohan Bhatt (Office Manager)";
}

export function buildSalary(s: StaffMember) {
  let gross: number;
  if (s.type === "teaching") {
    const joined = new Date(s.joinedDate + "T00:00:00");
    const years  = Math.max(0, 2026 - joined.getFullYear());
    gross = 30000 + years * 2500;
  } else {
    gross = DESIGNATION_BASE[s.designation] ?? 35000;
  }

  const basic = Math.round(gross * 0.5);
  const hra   = Math.round(gross * 0.2);
  const da    = Math.round(gross * 0.1);
  const ta    = Math.round(gross * 0.05);
  const other = gross - basic - hra - da - ta;
  const pf    = Math.round(basic * 0.12);
  const tds   = gross > 50000 ? Math.round(gross * 0.1) : 0;
  const prof  = 200;

  const totalEarnings   = basic + hra + da + ta + other;
  const totalDeductions = pf + tds + prof;

  return {
    gross,
    net: totalEarnings - totalDeductions,
    earnings: [
      { label: "Basic Pay",     amount: basic },
      { label: "HRA",           amount: hra   },
      { label: "DA",            amount: da    },
      { label: "Travel Allow.", amount: ta    },
      { label: "Other Allow.",  amount: other },
    ],
    deductions: [
      { label: "Provident Fund", amount: pf   },
      ...(tds > 0 ? [{ label: "TDS", amount: tds }] : []),
      { label: "Prof. Tax",      amount: prof  },
    ],
    totalEarnings,
    totalDeductions,
  };
}
