export type FeeStatus = "paid" | "partial" | "overdue";

export interface Parent {
  id: number;
  name: string;
  phone: string;
  email: string;
  childIds: number[];
  occupation: string;
  address: string;
  active: boolean;
  joinedDate: string;
}

export const ALL_PARENTS: Parent[] = [
  { id:  1, name: "Rajesh Sharma",   phone: "+91 98765 43210", email: "rajesh.sharma@gmail.com",   childIds: [1],     occupation: "Software Engineer",    address: "123, Sector 15, Gurugram, Haryana",           active: true,  joinedDate: "Apr 2024" },
  { id:  2, name: "Suresh Patel",    phone: "+91 87654 32109", email: "suresh.patel@gmail.com",    childIds: [2],     occupation: "Business Owner",       address: "45, MG Road, Ahmedabad, Gujarat",             active: true,  joinedDate: "Apr 2024" },
  { id:  3, name: "Vikram Mehta",    phone: "+91 76543 21098", email: "vikram.mehta@gmail.com",    childIds: [3, 17], occupation: "Doctor",               address: "78, Andheri West, Mumbai, Maharashtra",       active: true,  joinedDate: "Apr 2024" },
  { id:  4, name: "Mohan Singh",     phone: "+91 65432 10987", email: "mohan.singh@gmail.com",     childIds: [4],     occupation: "Government Employee",  address: "12, Civil Lines, Delhi",                      active: true,  joinedDate: "Apr 2024" },
  { id:  5, name: "Anil Kumar",      phone: "+91 54321 09876", email: "anil.kumar@gmail.com",      childIds: [5],     occupation: "Teacher",              address: "34, Rajaji Nagar, Bengaluru, Karnataka",      active: true,  joinedDate: "Apr 2024" },
  { id:  6, name: "Dinesh Gupta",    phone: "+91 43210 98765", email: "dinesh.gupta@gmail.com",    childIds: [6],     occupation: "Chartered Accountant", address: "56, Gomti Nagar, Lucknow, UP",                active: true,  joinedDate: "Jun 2024" },
  { id:  7, name: "Ramesh Joshi",    phone: "+91 32109 87654", email: "ramesh.joshi@gmail.com",    childIds: [7],     occupation: "Retired",              address: "89, Vaishali Nagar, Jaipur, Rajasthan",       active: true,  joinedDate: "Apr 2024" },
  { id:  8, name: "Krishnan Nair",   phone: "+91 21098 76543", email: "krishnan.nair@gmail.com",   childIds: [8],     occupation: "Engineer",             address: "23, Kakkanad, Kochi, Kerala",                 active: true,  joinedDate: "Apr 2024" },
  { id:  9, name: "Sunil Tiwari",    phone: "+91 10987 65432", email: "sunil.tiwari@gmail.com",    childIds: [9],     occupation: "Shop Owner",           address: "67, Shivaji Nagar, Pune, Maharashtra",        active: true,  joinedDate: "Jul 2024" },
  { id: 10, name: "Manoj Yadav",     phone: "+91 90876 54321", email: "manoj.yadav@gmail.com",     childIds: [10],    occupation: "Farmer",               address: "45, GT Road, Patna, Bihar",                   active: true,  joinedDate: "Apr 2024" },
  { id: 11, name: "Venkat Reddy",    phone: "+91 80765 43210", email: "venkat.reddy@gmail.com",    childIds: [11],    occupation: "IT Professional",      address: "12, Hitech City, Hyderabad, Telangana",       active: true,  joinedDate: "Apr 2024" },
  { id: 12, name: "Srinivas Iyer",   phone: "+91 70654 32109", email: "srinivas.iyer@gmail.com",   childIds: [12],    occupation: "Bank Manager",         address: "34, T Nagar, Chennai, Tamil Nadu",            active: true,  joinedDate: "Apr 2024" },
  { id: 13, name: "Suresh Verma",    phone: "+91 60543 21098", email: "suresh.verma@gmail.com",    childIds: [13],    occupation: "Driver",               address: "78, Indra Nagar, Kanpur, UP",                 active: false, joinedDate: "Aug 2024" },
  { id: 14, name: "Rakesh Chopra",   phone: "+91 50432 10987", email: "rakesh.chopra@gmail.com",   childIds: [14],    occupation: "Journalist",           address: "56, Model Town, Ludhiana, Punjab",            active: true,  joinedDate: "Apr 2024" },
  { id: 15, name: "Ashok Agarwal",   phone: "+91 40321 09876", email: "ashok.agarwal@gmail.com",   childIds: [15],    occupation: "Trader",               address: "23, Connaught Place, Delhi",                  active: true,  joinedDate: "Apr 2024" },
  { id: 16, name: "Gurpreet Kaur",   phone: "+91 30210 98765", email: "gurpreet.kaur@gmail.com",   childIds: [16],    occupation: "Nurse",                address: "67, Sector 22, Chandigarh",                   active: true,  joinedDate: "Apr 2024" },
  { id: 17, name: "Hemant Desai",    phone: "+91 88776 55443", email: "hemant.desai@gmail.com",    childIds: [20],    occupation: "Entrepreneur",         address: "89, Prahlad Nagar, Ahmedabad, Gujarat",       active: true,  joinedDate: "Jun 2024" },
  { id: 18, name: "Rajesh Pillai",   phone: "+91 11098 76543", email: "rajesh.pillai@gmail.com",   childIds: [18],    occupation: "Lawyer",               address: "12, Vyttila, Kochi, Kerala",                  active: true,  joinedDate: "Apr 2024" },
  { id: 19, name: "Rakesh Mishra",   phone: "+91 99887 66554", email: "rakesh.mishra@gmail.com",   childIds: [19],    occupation: "Professor",            address: "34, Aliganj, Lucknow, UP",                    active: true,  joinedDate: "Apr 2024" },
  { id: 20, name: "Subhash Bose",    phone: "+91 77665 44332", email: "subhash.bose@gmail.com",    childIds: [21, 22], occupation: "Entrepreneur",        address: "56, Salt Lake, Kolkata, West Bengal",         active: true,  joinedDate: "Apr 2024" },
  { id: 21, name: "Deepak Bhatt",    phone: "+91 20109 87654", email: "deepak.bhatt@gmail.com",    childIds: [17],    occupation: "Police Officer",       address: "89, Rajpur Road, Dehradun, Uttarakhand",      active: true,  joinedDate: "Jun 2024" },
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
