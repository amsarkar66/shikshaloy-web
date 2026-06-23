export type FeeStatus = "paid" | "partial" | "overdue";

export interface Student {
  id: number;
  name: string;
  rollNo: string;
  class: string;
  section: string;
  parent: string;
  phone: string;
  attendance: number;
  feeStatus: FeeStatus;
  active: boolean;
}

export const ALL_STUDENTS: Student[] = [
  { id:  1, name: "Aarav Sharma",   rollNo:"2024001", class:"10", section:"A", parent:"Rajesh Sharma",   phone:"+91 98765 43210", attendance:96, feeStatus:"paid",    active:true  },
  { id:  2, name: "Priya Patel",    rollNo:"2024002", class:"10", section:"B", parent:"Suresh Patel",    phone:"+91 87654 32109", attendance:91, feeStatus:"paid",    active:true  },
  { id:  3, name: "Arjun Mehta",    rollNo:"2024003", class:"5",  section:"B", parent:"Vikram Mehta",    phone:"+91 76543 21098", attendance:88, feeStatus:"partial", active:true  },
  { id:  4, name: "Anjali Singh",   rollNo:"2024004", class:"8",  section:"A", parent:"Mohan Singh",     phone:"+91 65432 10987", attendance:94, feeStatus:"paid",    active:true  },
  { id:  5, name: "Rohan Kumar",    rollNo:"2024005", class:"6",  section:"A", parent:"Anil Kumar",      phone:"+91 54321 09876", attendance:72, feeStatus:"overdue", active:true  },
  { id:  6, name: "Sneha Gupta",    rollNo:"2024006", class:"9",  section:"B", parent:"Dinesh Gupta",    phone:"+91 43210 98765", attendance:98, feeStatus:"paid",    active:true  },
  { id:  7, name: "Karan Joshi",    rollNo:"2024007", class:"7",  section:"A", parent:"Ramesh Joshi",    phone:"+91 32109 87654", attendance:85, feeStatus:"partial", active:true  },
  { id:  8, name: "Meera Nair",     rollNo:"2024008", class:"9",  section:"A", parent:"Krishnan Nair",   phone:"+91 21098 76543", attendance:93, feeStatus:"paid",    active:true  },
  { id:  9, name: "Ravi Tiwari",    rollNo:"2024009", class:"5",  section:"A", parent:"Sunil Tiwari",    phone:"+91 10987 65432", attendance:79, feeStatus:"overdue", active:true  },
  { id: 10, name: "Pooja Yadav",    rollNo:"2024010", class:"6",  section:"B", parent:"Manoj Yadav",     phone:"+91 90876 54321", attendance:95, feeStatus:"paid",    active:true  },
  { id: 11, name: "Aditya Reddy",   rollNo:"2024011", class:"10", section:"A", parent:"Venkat Reddy",    phone:"+91 80765 43210", attendance:90, feeStatus:"paid",    active:true  },
  { id: 12, name: "Kavya Iyer",     rollNo:"2024012", class:"8",  section:"B", parent:"Srinivas Iyer",   phone:"+91 70654 32109", attendance:97, feeStatus:"paid",    active:true  },
  { id: 13, name: "Rahul Verma",    rollNo:"2024013", class:"7",  section:"B", parent:"Suresh Verma",    phone:"+91 60543 21098", attendance:68, feeStatus:"overdue", active:false },
  { id: 14, name: "Divya Chopra",   rollNo:"2024014", class:"6",  section:"A", parent:"Rakesh Chopra",   phone:"+91 50432 10987", attendance:92, feeStatus:"partial", active:true  },
  { id: 15, name: "Manish Agarwal", rollNo:"2024015", class:"9",  section:"A", parent:"Ashok Agarwal",   phone:"+91 40321 09876", attendance:87, feeStatus:"paid",    active:true  },
  { id: 16, name: "Simran Kaur",    rollNo:"2024016", class:"10", section:"B", parent:"Gurpreet Kaur",   phone:"+91 30210 98765", attendance:94, feeStatus:"paid",    active:true  },
  { id: 17, name: "Varun Bhatt",    rollNo:"2024017", class:"5",  section:"A", parent:"Deepak Bhatt",    phone:"+91 20109 87654", attendance:83, feeStatus:"partial", active:true  },
  { id: 18, name: "Nisha Pillai",   rollNo:"2024018", class:"8",  section:"A", parent:"Rajesh Pillai",   phone:"+91 11098 76543", attendance:96, feeStatus:"paid",    active:true  },
  { id: 19, name: "Sanjay Mishra",  rollNo:"2024019", class:"7",  section:"A", parent:"Rakesh Mishra",   phone:"+91 99887 66554", attendance:74, feeStatus:"overdue", active:true  },
  { id: 20, name: "Tanvi Desai",    rollNo:"2024020", class:"6",  section:"B", parent:"Hemant Desai",    phone:"+91 88776 55443", attendance:99, feeStatus:"paid",    active:true  },
  { id: 21, name: "Yash Bose",      rollNo:"2024021", class:"9",  section:"B", parent:"Subhash Bose",    phone:"+91 77665 44332", attendance:89, feeStatus:"partial", active:true  },
  { id: 22, name: "Ritika Sen",     rollNo:"2024022", class:"10", section:"A", parent:"Amitabh Sen",     phone:"+91 66554 33221", attendance:93, feeStatus:"paid",    active:true  },
];

export const AVATAR_COLORS = [
  "bg-blue-500",   "bg-violet-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500",  "bg-teal-500",   "bg-indigo-500",  "bg-pink-500",
  "bg-cyan-500",   "bg-orange-500",
];

export function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

export function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}
