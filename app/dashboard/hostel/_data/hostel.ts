export type RoomType   = "single" | "double" | "triple" | "dormitory";
export type RoomStatus = "available" | "occupied" | "maintenance";
export type FeeStatus  = "paid" | "partial" | "overdue";

export interface HostelRoom {
  id: string;
  roomNo: string;
  block: string;
  floor: number;
  type: RoomType;
  capacity: number;
  occupied: number;
  warden: string;
  amenities: string[];
  status: RoomStatus;
}

export interface HostelStudent {
  id: string;
  studentName: string;
  rollNo: string;
  class: string;
  section: string;
  roomNo: string;
  block: string;
  joinDate: string;
  monthlyFee: number;
  feeStatus: FeeStatus;
  phone: string;
  parentName: string;
}

export const ALL_ROOMS: HostelRoom[] = [
  { id: "r1",  roomNo: "A-101", block: "A", floor: 1, type: "double",    capacity: 2, occupied: 2, warden: "Mr. Suresh Kumar",   amenities: ["AC", "Attached Bath"], status: "occupied"    },
  { id: "r2",  roomNo: "A-102", block: "A", floor: 1, type: "double",    capacity: 2, occupied: 1, warden: "Mr. Suresh Kumar",   amenities: ["AC", "Attached Bath"], status: "available"   },
  { id: "r3",  roomNo: "A-103", block: "A", floor: 1, type: "single",    capacity: 1, occupied: 1, warden: "Mr. Suresh Kumar",   amenities: ["AC", "Attached Bath", "Balcony"], status: "occupied" },
  { id: "r4",  roomNo: "A-201", block: "A", floor: 2, type: "double",    capacity: 2, occupied: 2, warden: "Mr. Suresh Kumar",   amenities: ["Fan", "Common Bath"],  status: "occupied"    },
  { id: "r5",  roomNo: "A-202", block: "A", floor: 2, type: "double",    capacity: 2, occupied: 0, warden: "Mr. Suresh Kumar",   amenities: ["Fan", "Common Bath"],  status: "maintenance" },
  { id: "r6",  roomNo: "A-203", block: "A", floor: 2, type: "triple",    capacity: 3, occupied: 3, warden: "Mr. Suresh Kumar",   amenities: ["Fan", "Common Bath"],  status: "occupied"    },
  { id: "r7",  roomNo: "B-101", block: "B", floor: 1, type: "dormitory", capacity: 8, occupied: 6, warden: "Ms. Priya Sharma",   amenities: ["Fan", "Common Bath", "Study Hall"], status: "available" },
  { id: "r8",  roomNo: "B-102", block: "B", floor: 1, type: "dormitory", capacity: 8, occupied: 8, warden: "Ms. Priya Sharma",   amenities: ["Fan", "Common Bath", "Study Hall"], status: "occupied"  },
  { id: "r9",  roomNo: "B-201", block: "B", floor: 2, type: "double",    capacity: 2, occupied: 2, warden: "Ms. Priya Sharma",   amenities: ["AC", "Attached Bath"], status: "occupied"    },
  { id: "r10", roomNo: "B-202", block: "B", floor: 2, type: "double",    capacity: 2, occupied: 1, warden: "Ms. Priya Sharma",   amenities: ["AC", "Attached Bath"], status: "available"   },
  { id: "r11", roomNo: "B-203", block: "B", floor: 2, type: "single",    capacity: 1, occupied: 0, warden: "Ms. Priya Sharma",   amenities: ["AC", "Attached Bath", "Balcony"], status: "available" },
  { id: "r12", roomNo: "C-101", block: "C", floor: 1, type: "triple",    capacity: 3, occupied: 3, warden: "Mr. Ramesh Gupta",   amenities: ["Fan", "Common Bath"],  status: "occupied"    },
  { id: "r13", roomNo: "C-102", block: "C", floor: 1, type: "triple",    capacity: 3, occupied: 2, warden: "Mr. Ramesh Gupta",   amenities: ["Fan", "Common Bath"],  status: "available"   },
  { id: "r14", roomNo: "C-103", block: "C", floor: 1, type: "double",    capacity: 2, occupied: 2, warden: "Mr. Ramesh Gupta",   amenities: ["AC", "Attached Bath"], status: "occupied"    },
  { id: "r15", roomNo: "C-201", block: "C", floor: 2, type: "dormitory", capacity: 6, occupied: 5, warden: "Mr. Ramesh Gupta",   amenities: ["Fan", "Common Bath", "Study Hall"], status: "available" },
  { id: "r16", roomNo: "C-202", block: "C", floor: 2, type: "double",    capacity: 2, occupied: 0, warden: "Mr. Ramesh Gupta",   amenities: ["Fan", "Common Bath"],  status: "maintenance" },
  { id: "r17", roomNo: "D-101", block: "D", floor: 1, type: "single",    capacity: 1, occupied: 1, warden: "Ms. Anita Verma",    amenities: ["AC", "Attached Bath", "Balcony"], status: "occupied" },
  { id: "r18", roomNo: "D-102", block: "D", floor: 1, type: "double",    capacity: 2, occupied: 2, warden: "Ms. Anita Verma",    amenities: ["AC", "Attached Bath"], status: "occupied"    },
  { id: "r19", roomNo: "D-103", block: "D", floor: 1, type: "triple",    capacity: 3, occupied: 1, warden: "Ms. Anita Verma",    amenities: ["Fan", "Common Bath"],  status: "available"   },
  { id: "r20", roomNo: "D-201", block: "D", floor: 2, type: "dormitory", capacity: 8, occupied: 4, warden: "Ms. Anita Verma",    amenities: ["Fan", "Common Bath", "Study Hall"], status: "available" },
];

export const ALL_STUDENTS: HostelStudent[] = [
  { id: "hs1",  studentName: "Arjun Mehta",       rollNo: "STU-001", class: "9",  section: "A", roomNo: "A-101", block: "A", joinDate: "2025-06-10", monthlyFee: 4500, feeStatus: "paid",    phone: "9876543210", parentName: "Rajesh Mehta"       },
  { id: "hs2",  studentName: "Priya Sharma",       rollNo: "STU-002", class: "10", section: "B", roomNo: "A-101", block: "A", joinDate: "2025-06-10", monthlyFee: 4500, feeStatus: "paid",    phone: "9876543211", parentName: "Anil Sharma"        },
  { id: "hs3",  studentName: "Ravi Patel",         rollNo: "STU-003", class: "8",  section: "A", roomNo: "A-102", block: "A", joinDate: "2025-07-01", monthlyFee: 4500, feeStatus: "partial", phone: "9876543212", parentName: "Sunil Patel"        },
  { id: "hs4",  studentName: "Sneha Gupta",        rollNo: "STU-004", class: "9",  section: "C", roomNo: "A-103", block: "A", joinDate: "2025-06-15", monthlyFee: 5500, feeStatus: "paid",    phone: "9876543213", parentName: "Dinesh Gupta"       },
  { id: "hs5",  studentName: "Rohan Verma",        rollNo: "STU-005", class: "10", section: "A", roomNo: "A-201", block: "A", joinDate: "2025-06-10", monthlyFee: 3500, feeStatus: "overdue", phone: "9876543214", parentName: "Vikram Verma"       },
  { id: "hs6",  studentName: "Anjali Singh",       rollNo: "STU-006", class: "8",  section: "B", roomNo: "A-201", block: "A", joinDate: "2025-07-05", monthlyFee: 3500, feeStatus: "paid",    phone: "9876543215", parentName: "Harish Singh"       },
  { id: "hs7",  studentName: "Karan Mishra",       rollNo: "STU-007", class: "9",  section: "B", roomNo: "A-203", block: "A", joinDate: "2025-06-20", monthlyFee: 3500, feeStatus: "paid",    phone: "9876543216", parentName: "Mohan Mishra"       },
  { id: "hs8",  studentName: "Pooja Nair",         rollNo: "STU-008", class: "10", section: "C", roomNo: "A-203", block: "A", joinDate: "2025-06-10", monthlyFee: 3500, feeStatus: "partial", phone: "9876543217", parentName: "Shyam Nair"         },
  { id: "hs9",  studentName: "Vikram Joshi",       rollNo: "STU-009", class: "8",  section: "A", roomNo: "A-203", block: "A", joinDate: "2025-08-01", monthlyFee: 3500, feeStatus: "paid",    phone: "9876543218", parentName: "Dilip Joshi"        },
  { id: "hs10", studentName: "Neha Khanna",        rollNo: "STU-010", class: "9",  section: "A", roomNo: "B-101", block: "B", joinDate: "2025-06-10", monthlyFee: 2500, feeStatus: "paid",    phone: "9876543219", parentName: "Rakesh Khanna"      },
  { id: "hs11", studentName: "Amit Tiwari",        rollNo: "STU-011", class: "7",  section: "B", roomNo: "B-101", block: "B", joinDate: "2025-06-15", monthlyFee: 2500, feeStatus: "overdue", phone: "9876543220", parentName: "Sanjay Tiwari"      },
  { id: "hs12", studentName: "Divya Yadav",        rollNo: "STU-012", class: "8",  section: "C", roomNo: "B-101", block: "B", joinDate: "2025-07-01", monthlyFee: 2500, feeStatus: "paid",    phone: "9876543221", parentName: "Manoj Yadav"        },
  { id: "hs13", studentName: "Suresh Pillai",      rollNo: "STU-013", class: "10", section: "A", roomNo: "B-102", block: "B", joinDate: "2025-06-10", monthlyFee: 2500, feeStatus: "paid",    phone: "9876543222", parentName: "Rajan Pillai"       },
  { id: "hs14", studentName: "Meena Iyer",         rollNo: "STU-014", class: "9",  section: "B", roomNo: "B-102", block: "B", joinDate: "2025-06-10", monthlyFee: 2500, feeStatus: "partial", phone: "9876543223", parentName: "Venkat Iyer"        },
  { id: "hs15", studentName: "Rahul Bose",         rollNo: "STU-015", class: "7",  section: "A", roomNo: "B-102", block: "B", joinDate: "2025-08-10", monthlyFee: 2500, feeStatus: "paid",    phone: "9876543224", parentName: "Subir Bose"         },
  { id: "hs16", studentName: "Kavya Reddy",        rollNo: "STU-016", class: "10", section: "B", roomNo: "B-201", block: "B", joinDate: "2025-06-10", monthlyFee: 4500, feeStatus: "overdue", phone: "9876543225", parentName: "Naresh Reddy"       },
  { id: "hs17", studentName: "Gaurav Rao",         rollNo: "STU-017", class: "8",  section: "A", roomNo: "B-201", block: "B", joinDate: "2025-07-01", monthlyFee: 4500, feeStatus: "paid",    phone: "9876543226", parentName: "Prasad Rao"         },
  { id: "hs18", studentName: "Shivani Choudhary",  rollNo: "STU-018", class: "9",  section: "C", roomNo: "B-202", block: "B", joinDate: "2025-06-20", monthlyFee: 4500, feeStatus: "paid",    phone: "9876543227", parentName: "Bharat Choudhary"   },
  { id: "hs19", studentName: "Akash Pandey",       rollNo: "STU-019", class: "7",  section: "B", roomNo: "C-101", block: "C", joinDate: "2025-06-10", monthlyFee: 3500, feeStatus: "paid",    phone: "9876543228", parentName: "Deepak Pandey"      },
  { id: "hs20", studentName: "Rina Das",           rollNo: "STU-020", class: "8",  section: "A", roomNo: "C-101", block: "C", joinDate: "2025-06-15", monthlyFee: 3500, feeStatus: "partial", phone: "9876543229", parentName: "Tapan Das"          },
  { id: "hs21", studentName: "Manish Kapoor",      rollNo: "STU-021", class: "10", section: "A", roomNo: "C-101", block: "C", joinDate: "2025-07-05", monthlyFee: 3500, feeStatus: "paid",    phone: "9876543230", parentName: "Pankaj Kapoor"      },
  { id: "hs22", studentName: "Sunita Banerjee",    rollNo: "STU-022", class: "9",  section: "B", roomNo: "C-102", block: "C", joinDate: "2025-06-10", monthlyFee: 3500, feeStatus: "overdue", phone: "9876543231", parentName: "Asim Banerjee"      },
  { id: "hs23", studentName: "Deepak Saxena",      rollNo: "STU-023", class: "8",  section: "C", roomNo: "C-102", block: "C", joinDate: "2025-08-01", monthlyFee: 3500, feeStatus: "paid",    phone: "9876543232", parentName: "Mukesh Saxena"      },
  { id: "hs24", studentName: "Pallavi Menon",      rollNo: "STU-024", class: "10", section: "C", roomNo: "C-103", block: "C", joinDate: "2025-06-10", monthlyFee: 4500, feeStatus: "paid",    phone: "9876543233", parentName: "Gopinath Menon"     },
  { id: "hs25", studentName: "Siddharth Kulkarni", rollNo: "STU-025", class: "9",  section: "A", roomNo: "C-103", block: "C", joinDate: "2025-06-10", monthlyFee: 4500, feeStatus: "paid",    phone: "9876543234", parentName: "Anand Kulkarni"     },
  { id: "hs26", studentName: "Nandini Ghosh",      rollNo: "STU-026", class: "7",  section: "A", roomNo: "C-201", block: "C", joinDate: "2025-06-15", monthlyFee: 2500, feeStatus: "partial", phone: "9876543235", parentName: "Partha Ghosh"       },
  { id: "hs27", studentName: "Mohit Ahuja",        rollNo: "STU-027", class: "8",  section: "B", roomNo: "C-201", block: "C", joinDate: "2025-07-01", monthlyFee: 2500, feeStatus: "paid",    phone: "9876543236", parentName: "Rakesh Ahuja"       },
  { id: "hs28", studentName: "Aishwarya Bhat",     rollNo: "STU-028", class: "10", section: "B", roomNo: "C-201", block: "C", joinDate: "2025-06-20", monthlyFee: 2500, feeStatus: "paid",    phone: "9876543237", parentName: "Subraya Bhat"       },
  { id: "hs29", studentName: "Tarun Srivastava",   rollNo: "STU-029", class: "9",  section: "C", roomNo: "C-201", block: "C", joinDate: "2025-06-10", monthlyFee: 2500, feeStatus: "overdue", phone: "9876543238", parentName: "Alok Srivastava"    },
  { id: "hs30", studentName: "Preethi Venkat",     rollNo: "STU-030", class: "7",  section: "C", roomNo: "C-201", block: "C", joinDate: "2025-08-05", monthlyFee: 2500, feeStatus: "paid",    phone: "9876543239", parentName: "Subramanian Venkat"  },
  { id: "hs31", studentName: "Nikhil Malhotra",    rollNo: "STU-031", class: "8",  section: "A", roomNo: "D-101", block: "D", joinDate: "2025-06-10", monthlyFee: 5500, feeStatus: "paid",    phone: "9876543240", parentName: "Vivek Malhotra"     },
  { id: "hs32", studentName: "Ritika Desai",       rollNo: "STU-032", class: "10", section: "A", roomNo: "D-102", block: "D", joinDate: "2025-06-10", monthlyFee: 4500, feeStatus: "paid",    phone: "9876543241", parentName: "Hemant Desai"       },
  { id: "hs33", studentName: "Varun Mathur",       rollNo: "STU-033", class: "9",  section: "B", roomNo: "D-102", block: "D", joinDate: "2025-07-01", monthlyFee: 4500, feeStatus: "partial", phone: "9876543242", parentName: "Ashok Mathur"       },
  { id: "hs34", studentName: "Swati Jain",         rollNo: "STU-034", class: "8",  section: "C", roomNo: "D-103", block: "D", joinDate: "2025-06-15", monthlyFee: 3500, feeStatus: "paid",    phone: "9876543243", parentName: "Pravin Jain"        },
  { id: "hs35", studentName: "Ishaan Chopra",      rollNo: "STU-035", class: "7",  section: "A", roomNo: "D-201", block: "D", joinDate: "2025-06-10", monthlyFee: 2500, feeStatus: "paid",    phone: "9876543244", parentName: "Sunil Chopra"       },
  { id: "hs36", studentName: "Kriti Agarwal",      rollNo: "STU-036", class: "10", section: "C", roomNo: "D-201", block: "D", joinDate: "2025-07-05", monthlyFee: 2500, feeStatus: "paid",    phone: "9876543245", parentName: "Rajiv Agarwal"      },
  { id: "hs37", studentName: "Yash Trivedi",       rollNo: "STU-037", class: "9",  section: "A", roomNo: "D-201", block: "D", joinDate: "2025-06-20", monthlyFee: 2500, feeStatus: "overdue", phone: "9876543246", parentName: "Girish Trivedi"     },
  { id: "hs38", studentName: "Simran Sethi",       rollNo: "STU-038", class: "8",  section: "B", roomNo: "D-201", block: "D", joinDate: "2025-08-01", monthlyFee: 2500, feeStatus: "paid",    phone: "9876543247", parentName: "Ajay Sethi"         },
];

export const BLOCKS   = ["A", "B", "C", "D"];
export const WARDENS  = ["Mr. Suresh Kumar", "Ms. Priya Sharma", "Mr. Ramesh Gupta", "Ms. Anita Verma"];

export const ROOM_STATUS_BADGE: Record<RoomStatus, string> = {
  available:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  occupied:    "bg-blue-500/10    text-blue-600     dark:text-blue-400    border-blue-500/20",
  maintenance: "bg-amber-500/10   text-amber-600    dark:text-amber-400   border-amber-500/20",
};

export const FEE_BADGE: Record<FeeStatus, string> = {
  paid:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  partial: "bg-amber-500/10  text-amber-600   dark:text-amber-400   border-amber-500/20",
  overdue: "bg-red-500/10    text-red-600     dark:text-red-400     border-red-500/20",
};

export const ROOM_TYPE_LABEL: Record<RoomType, string> = {
  single:    "Single",
  double:    "Double",
  triple:    "Triple",
  dormitory: "Dormitory",
};

export function avatarColor(id: string): string {
  const colors = [
    "bg-indigo-500", "bg-violet-500", "bg-blue-500",  "bg-sky-500",
    "bg-teal-500",   "bg-emerald-500","bg-rose-500",  "bg-orange-500",
    "bg-amber-500",  "bg-pink-500",   "bg-cyan-500",  "bg-lime-600",
  ];
  const n = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[n % colors.length];
}

export function initials(name: string): string {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
