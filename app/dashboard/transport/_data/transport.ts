export type RouteStatus       = "active" | "inactive";
export type VehicleStatus     = "active" | "maintenance" | "inactive";
export type TransportFeeStatus = "paid" | "partial" | "overdue";

export interface Route {
  id:               number;
  routeNo:          string;
  routeName:        string;
  busNo:            string;
  driver:           string;
  driverPhone:      string;
  stops:            string[];
  studentCount:     number;
  capacity:         number;
  status:           RouteStatus;
  morningDeparture: string;
  eveningDeparture: string;
}

export interface Vehicle {
  id:          number;
  regNo:       string;
  model:       string;
  capacity:    number;
  year:        number;
  status:      VehicleStatus;
  driver:      string;
  fuelType:    "diesel" | "cng" | "electric";
  lastService: string;
  nextService: string;
}

export interface StudentTransport {
  id:          number;
  studentName: string;
  rollNo:      string;
  class:       string;
  section:     string;
  parent:      string;
  phone:       string;
  route:       string;
  routeNo:     string;
  stop:        string;
  feeStatus:   TransportFeeStatus;
  monthlyFee:  number;
}

export const ALL_ROUTES: Route[] = [
  {
    id: 1, routeNo: "RT-01", routeName: "North Zone",
    busNo: "BUS-001", driver: "Ramesh Das",     driverPhone: "+91 98100 11001",
    stops: ["Shyambazar", "Belgachia", "Sovabazar", "Park Street", "School"],
    studentCount: 32, capacity: 40, status: "active",
    morningDeparture: "07:00 AM", eveningDeparture: "03:30 PM",
  },
  {
    id: 2, routeNo: "RT-02", routeName: "South Zone",
    busNo: "BUS-002", driver: "Suresh Roy",     driverPhone: "+91 98100 11002",
    stops: ["Jadavpur", "Tollygunge", "Rashbehari", "Gariahat", "School"],
    studentCount: 28, capacity: 40, status: "active",
    morningDeparture: "07:15 AM", eveningDeparture: "03:30 PM",
  },
  {
    id: 3, routeNo: "RT-03", routeName: "East Zone",
    busNo: "BUS-003", driver: "Bikram Sen",     driverPhone: "+91 98100 11003",
    stops: ["Salt Lake Sec-V", "Ultadanga", "Phoolbagan", "Sealdah", "School"],
    studentCount: 35, capacity: 40, status: "active",
    morningDeparture: "06:45 AM", eveningDeparture: "03:30 PM",
  },
  {
    id: 4, routeNo: "RT-04", routeName: "West Zone",
    busNo: "BUS-004", driver: "Dilip Das",      driverPhone: "+91 98100 11004",
    stops: ["Howrah Stn", "Shibpur", "Liluah", "Bally", "School"],
    studentCount: 22, capacity: 40, status: "inactive",
    morningDeparture: "07:00 AM", eveningDeparture: "03:30 PM",
  },
  {
    id: 5, routeNo: "RT-05", routeName: "Central",
    busNo: "BUS-005", driver: "Manoj Roy",      driverPhone: "+91 98100 11005",
    stops: ["Burrabazar", "Posta", "MG Road", "School"],
    studentCount: 18, capacity: 35, status: "active",
    morningDeparture: "07:30 AM", eveningDeparture: "03:30 PM",
  },
];

export const ALL_VEHICLES: Vehicle[] = [
  { id: 1, regNo: "WB-01-AB-1234", model: "Tata Starbus Ultra",    capacity: 40, year: 2019, status: "active",      driver: "Ramesh Das",  fuelType: "diesel",   lastService: "2026-05-10", nextService: "2026-08-10" },
  { id: 2, regNo: "WB-01-CD-5678", model: "Ashok Leyland Lynx",   capacity: 40, year: 2020, status: "active",      driver: "Suresh Roy",  fuelType: "diesel",   lastService: "2026-04-22", nextService: "2026-07-22" },
  { id: 3, regNo: "WB-01-EF-9012", model: "Tata Starbus CNG",     capacity: 40, year: 2021, status: "active",      driver: "Bikram Sen",  fuelType: "cng",      lastService: "2026-06-01", nextService: "2026-09-01" },
  { id: 4, regNo: "WB-01-GH-3456", model: "Force Traveller",      capacity: 40, year: 2018, status: "maintenance", driver: "Dilip Das",   fuelType: "diesel",   lastService: "2026-06-15", nextService: "2026-09-15" },
  { id: 5, regNo: "WB-01-IJ-7890", model: "Mahindra Tourister",   capacity: 35, year: 2022, status: "active",      driver: "Manoj Roy",   fuelType: "cng",      lastService: "2026-05-28", nextService: "2026-08-28" },
  { id: 6, regNo: "WB-01-KL-2345", model: "Tata Winger",          capacity: 20, year: 2020, status: "inactive",    driver: "—",           fuelType: "diesel",   lastService: "2026-03-12", nextService: "2026-06-12" },
];

export const ALL_STUDENT_TRANSPORT: StudentTransport[] = [
  { id:  1, studentName: "Aarav Sharma",   rollNo: "2024001", class: "10", section: "A", parent: "Rajesh Sharma",   phone: "+91 98765 43210", route: "North Zone", routeNo: "RT-01", stop: "Shyambazar",      feeStatus: "paid",    monthlyFee: 1500 },
  { id:  2, studentName: "Priya Patel",    rollNo: "2024002", class: "10", section: "B", parent: "Suresh Patel",    phone: "+91 87654 32109", route: "South Zone", routeNo: "RT-02", stop: "Jadavpur",        feeStatus: "paid",    monthlyFee: 1500 },
  { id:  3, studentName: "Arjun Mehta",    rollNo: "2024003", class: "5",  section: "B", parent: "Vikram Mehta",    phone: "+91 76543 21098", route: "East Zone",  routeNo: "RT-03", stop: "Salt Lake Sec-V", feeStatus: "partial", monthlyFee: 1500 },
  { id:  4, studentName: "Anjali Singh",   rollNo: "2024004", class: "8",  section: "A", parent: "Mohan Singh",     phone: "+91 65432 10987", route: "North Zone", routeNo: "RT-01", stop: "Belgachia",       feeStatus: "paid",    monthlyFee: 1500 },
  { id:  5, studentName: "Rohan Kumar",    rollNo: "2024005", class: "6",  section: "A", parent: "Anil Kumar",      phone: "+91 54321 09876", route: "Central",    routeNo: "RT-05", stop: "Burrabazar",      feeStatus: "overdue", monthlyFee: 1500 },
  { id:  6, studentName: "Sneha Gupta",    rollNo: "2024006", class: "9",  section: "B", parent: "Dinesh Gupta",    phone: "+91 43210 98765", route: "South Zone", routeNo: "RT-02", stop: "Tollygunge",      feeStatus: "paid",    monthlyFee: 1500 },
  { id:  7, studentName: "Karan Joshi",    rollNo: "2024007", class: "7",  section: "A", parent: "Ramesh Joshi",    phone: "+91 32109 87654", route: "East Zone",  routeNo: "RT-03", stop: "Phoolbagan",      feeStatus: "paid",    monthlyFee: 1500 },
  { id:  8, studentName: "Meera Nair",     rollNo: "2024008", class: "9",  section: "A", parent: "Krishnan Nair",   phone: "+91 21098 76543", route: "West Zone",  routeNo: "RT-04", stop: "Howrah Stn",      feeStatus: "paid",    monthlyFee: 1500 },
  { id:  9, studentName: "Ravi Tiwari",    rollNo: "2024009", class: "5",  section: "A", parent: "Sunil Tiwari",    phone: "+91 10987 65432", route: "Central",    routeNo: "RT-05", stop: "Posta",           feeStatus: "overdue", monthlyFee: 1500 },
  { id: 10, studentName: "Pooja Yadav",    rollNo: "2024010", class: "6",  section: "B", parent: "Manoj Yadav",     phone: "+91 90876 54321", route: "North Zone", routeNo: "RT-01", stop: "Sovabazar",       feeStatus: "paid",    monthlyFee: 1500 },
  { id: 11, studentName: "Aditya Reddy",   rollNo: "2024011", class: "10", section: "A", parent: "Venkat Reddy",    phone: "+91 80765 43210", route: "South Zone", routeNo: "RT-02", stop: "Gariahat",        feeStatus: "partial", monthlyFee: 1500 },
  { id: 12, studentName: "Kavya Iyer",     rollNo: "2024012", class: "8",  section: "B", parent: "Srinivas Iyer",   phone: "+91 70654 32109", route: "East Zone",  routeNo: "RT-03", stop: "Ultadanga",       feeStatus: "paid",    monthlyFee: 1500 },
  { id: 13, studentName: "Divya Chopra",   rollNo: "2024014", class: "6",  section: "A", parent: "Rakesh Chopra",   phone: "+91 50432 10987", route: "North Zone", routeNo: "RT-01", stop: "Shyambazar",      feeStatus: "paid",    monthlyFee: 1500 },
  { id: 14, studentName: "Manish Agarwal", rollNo: "2024015", class: "9",  section: "A", parent: "Ashok Agarwal",   phone: "+91 40321 09876", route: "South Zone", routeNo: "RT-02", stop: "Rashbehari",      feeStatus: "paid",    monthlyFee: 1500 },
  { id: 15, studentName: "Simran Kaur",    rollNo: "2024016", class: "10", section: "B", parent: "Gurpreet Kaur",   phone: "+91 30210 98765", route: "East Zone",  routeNo: "RT-03", stop: "Sealdah",         feeStatus: "overdue", monthlyFee: 1500 },
  { id: 16, studentName: "Varun Bhatt",    rollNo: "2024017", class: "5",  section: "A", parent: "Deepak Bhatt",    phone: "+91 20109 87654", route: "West Zone",  routeNo: "RT-04", stop: "Liluah",          feeStatus: "paid",    monthlyFee: 1500 },
  { id: 17, studentName: "Nisha Pillai",   rollNo: "2024018", class: "8",  section: "A", parent: "Rajesh Pillai",   phone: "+91 11098 76543", route: "East Zone",  routeNo: "RT-03", stop: "Salt Lake Sec-V", feeStatus: "paid",    monthlyFee: 1500 },
  { id: 18, studentName: "Sanjay Mishra",  rollNo: "2024019", class: "7",  section: "A", parent: "Rakesh Mishra",   phone: "+91 99887 66554", route: "Central",    routeNo: "RT-05", stop: "MG Road",         feeStatus: "overdue", monthlyFee: 1500 },
  { id: 19, studentName: "Tanvi Desai",    rollNo: "2024020", class: "6",  section: "B", parent: "Hemant Desai",    phone: "+91 88776 55443", route: "South Zone", routeNo: "RT-02", stop: "Rashbehari",      feeStatus: "paid",    monthlyFee: 1500 },
  { id: 20, studentName: "Yash Bose",      rollNo: "2024021", class: "9",  section: "B", parent: "Subhash Bose",    phone: "+91 77665 44332", route: "North Zone", routeNo: "RT-01", stop: "Park Street",     feeStatus: "partial", monthlyFee: 1500 },
  { id: 21, studentName: "Ritika Sen",     rollNo: "2024022", class: "10", section: "A", parent: "Amitabh Sen",     phone: "+91 66554 33221", route: "East Zone",  routeNo: "RT-03", stop: "Phoolbagan",      feeStatus: "paid",    monthlyFee: 1500 },
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

export const FEE_BADGE: Record<TransportFeeStatus, string> = {
  paid:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  partial: "bg-amber-500/10  text-amber-600   dark:text-amber-400   border-amber-500/20",
  overdue: "bg-red-500/10    text-red-600     dark:text-red-400     border-red-500/20",
};

export const VEHICLE_STATUS_BADGE: Record<VehicleStatus, string> = {
  active:      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  maintenance: "bg-amber-500/10  text-amber-600   dark:text-amber-400   border-amber-500/20",
  inactive:    "bg-gray-100      text-gray-500    dark:text-zinc-400    border-gray-200 dark:border-zinc-700",
};

export const ROUTE_STATUS_BADGE: Record<RouteStatus, string> = {
  active:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  inactive: "bg-gray-100      text-gray-500    dark:text-zinc-400    border-gray-200 dark:border-zinc-700",
};
