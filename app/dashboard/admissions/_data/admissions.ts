export type AdmissionStatus =
  | "pending"
  | "under_review"
  | "approved"
  | "waitlisted"
  | "rejected"
  | "enrolled";

export interface Application {
  id:               number;
  applicationNo:    string;
  applicantName:    string;
  dob:              string;      // YYYY-MM-DD
  gender:           "Male" | "Female";
  applyingForClass: string;      // "5" – "10"
  parentName:       string;
  parentPhone:      string;
  parentEmail:      string;
  previousSchool?:  string;
  submittedDate:    string;      // YYYY-MM-DD
  status:           AdmissionStatus;
  academicYear:     string;      // "2026-27"
  notes?:           string;
}

export const ALL_APPLICATIONS: Application[] = [
  // ── 2026-27 ──────────────────────────────────────────────────────────────
  {
    id: 1, applicationNo: "ADM-2026-001",
    applicantName: "Aanya Sharma",      dob: "2015-04-12", gender: "Female",
    applyingForClass: "5", parentName: "Rajesh Sharma",
    parentPhone: "+91 98765 43210",     parentEmail: "rajesh.sharma@gmail.com",
    previousSchool: "Sunrise Public School",
    submittedDate: "2026-01-08", status: "enrolled", academicYear: "2026-27",
    notes: "Excellent academic record. Admission fee paid.",
  },
  {
    id: 2, applicationNo: "ADM-2026-002",
    applicantName: "Rohan Verma",       dob: "2015-07-22", gender: "Male",
    applyingForClass: "5", parentName: "Pradeep Verma",
    parentPhone: "+91 99887 12345",     parentEmail: "pradeep.verma@outlook.com",
    previousSchool: "Little Stars Academy",
    submittedDate: "2026-01-10", status: "enrolled", academicYear: "2026-27",
    notes: "Transfer from Little Stars. Documents verified.",
  },
  {
    id: 3, applicationNo: "ADM-2026-003",
    applicantName: "Ishaan Nair",       dob: "2015-11-05", gender: "Male",
    applyingForClass: "5", parentName: "Suresh Nair",
    parentPhone: "+91 91234 56789",     parentEmail: "suresh.nair@gmail.com",
    previousSchool: "Green Valley School",
    submittedDate: "2026-01-14", status: "approved", academicYear: "2026-27",
    notes: "Approved. Awaiting fee payment.",
  },
  {
    id: 4, applicationNo: "ADM-2026-004",
    applicantName: "Meera Iyer",        dob: "2014-02-18", gender: "Female",
    applyingForClass: "6", parentName: "Anand Iyer",
    parentPhone: "+91 90000 11223",     parentEmail: "anand.iyer@yahoo.com",
    previousSchool: "Vidya Mandir School",
    submittedDate: "2026-01-15", status: "approved", academicYear: "2026-27",
    notes: "Rank 2 in previous school. Approved for Class 6-A.",
  },
  {
    id: 5, applicationNo: "ADM-2026-005",
    applicantName: "Arjun Patel",       dob: "2014-09-30", gender: "Male",
    applyingForClass: "6", parentName: "Dhruv Patel",
    parentPhone: "+91 97654 32109",     parentEmail: "dhruv.patel@gmail.com",
    previousSchool: "Navyug High School",
    submittedDate: "2026-01-17", status: "approved", academicYear: "2026-27",
  },
  {
    id: 6, applicationNo: "ADM-2026-006",
    applicantName: "Priya Gupta",       dob: "2013-06-25", gender: "Female",
    applyingForClass: "7", parentName: "Vinod Gupta",
    parentPhone: "+91 88812 34567",     parentEmail: "vinod.gupta@gmail.com",
    previousSchool: "Shree Ram Public School",
    submittedDate: "2026-01-20", status: "approved", academicYear: "2026-27",
    notes: "National science olympiad participant.",
  },
  {
    id: 7, applicationNo: "ADM-2026-007",
    applicantName: "Siddharth Rao",     dob: "2013-12-14", gender: "Male",
    applyingForClass: "7", parentName: "Girish Rao",
    parentPhone: "+91 78923 45678",     parentEmail: "girish.rao@rediffmail.com",
    submittedDate: "2026-01-22", status: "waitlisted", academicYear: "2026-27",
    notes: "Class 7 seats full. Placed on waitlist #1.",
  },
  {
    id: 8, applicationNo: "ADM-2026-008",
    applicantName: "Kavya Singh",       dob: "2013-03-08", gender: "Female",
    applyingForClass: "7", parentName: "Sanjay Singh",
    parentPhone: "+91 99001 23456",     parentEmail: "sanjay.singh@hotmail.com",
    previousSchool: "Blue Star School",
    submittedDate: "2026-01-24", status: "waitlisted", academicYear: "2026-27",
    notes: "Waitlist #2. Will notify if seat opens.",
  },
  {
    id: 9, applicationNo: "ADM-2026-009",
    applicantName: "Aarav Mehta",       dob: "2012-08-19", gender: "Male",
    applyingForClass: "8", parentName: "Kunal Mehta",
    parentPhone: "+91 98000 98765",     parentEmail: "kunal.mehta@gmail.com",
    previousSchool: "Modern School",
    submittedDate: "2026-02-01", status: "under_review", academicYear: "2026-27",
    notes: "Interview scheduled for Feb 10, 2026.",
  },
  {
    id: 10, applicationNo: "ADM-2026-010",
    applicantName: "Diya Chatterjee",   dob: "2012-05-27", gender: "Female",
    applyingForClass: "8", parentName: "Partha Chatterjee",
    parentPhone: "+91 77654 32198",     parentEmail: "partha.c@gmail.com",
    previousSchool: "Heritage Academy",
    submittedDate: "2026-02-03", status: "under_review", academicYear: "2026-27",
  },
  {
    id: 11, applicationNo: "ADM-2026-011",
    applicantName: "Vivaan Mishra",     dob: "2011-10-02", gender: "Male",
    applyingForClass: "9", parentName: "Alok Mishra",
    parentPhone: "+91 96321 54876",     parentEmail: "alok.mishra@outlook.com",
    previousSchool: "Ryan International",
    submittedDate: "2026-02-05", status: "under_review", academicYear: "2026-27",
    notes: "Strong in Maths and Science. Board result pending.",
  },
  {
    id: 12, applicationNo: "ADM-2026-012",
    applicantName: "Ananya Joshi",      dob: "2011-01-16", gender: "Female",
    applyingForClass: "9", parentName: "Prakash Joshi",
    parentPhone: "+91 88765 43219",     parentEmail: "prakash.joshi@gmail.com",
    previousSchool: "DPS School",
    submittedDate: "2026-02-06", status: "under_review", academicYear: "2026-27",
  },
  {
    id: 13, applicationNo: "ADM-2026-013",
    applicantName: "Kabir Khanna",      dob: "2011-07-31", gender: "Male",
    applyingForClass: "9", parentName: "Amit Khanna",
    parentPhone: "+91 93210 87654",     parentEmail: "amit.khanna@gmail.com",
    submittedDate: "2026-02-08", status: "under_review", academicYear: "2026-27",
    notes: "District chess champion.",
  },
  {
    id: 14, applicationNo: "ADM-2026-014",
    applicantName: "Riya Bose",         dob: "2010-04-04", gender: "Female",
    applyingForClass: "10", parentName: "Subrata Bose",
    parentPhone: "+91 99900 12345",     parentEmail: "subrata.bose@gmail.com",
    previousSchool: "Kendriya Vidyalaya",
    submittedDate: "2026-02-10", status: "pending", academicYear: "2026-27",
  },
  {
    id: 15, applicationNo: "ADM-2026-015",
    applicantName: "Advait Pillai",     dob: "2010-11-22", gender: "Male",
    applyingForClass: "10", parentName: "Rajan Pillai",
    parentPhone: "+91 82345 67890",     parentEmail: "rajan.pillai@gmail.com",
    previousSchool: "Navodaya School",
    submittedDate: "2026-02-11", status: "pending", academicYear: "2026-27",
    notes: "Submitted via online portal.",
  },
  {
    id: 16, applicationNo: "ADM-2026-016",
    applicantName: "Tara Reddy",        dob: "2010-08-13", gender: "Female",
    applyingForClass: "10", parentName: "Vikram Reddy",
    parentPhone: "+91 90909 09090",     parentEmail: "vikram.reddy@yahoo.com",
    previousSchool: "Chaitanya High School",
    submittedDate: "2026-02-13", status: "pending", academicYear: "2026-27",
  },
  {
    id: 17, applicationNo: "ADM-2026-017",
    applicantName: "Samar Khan",        dob: "2015-05-09", gender: "Male",
    applyingForClass: "5", parentName: "Farouk Khan",
    parentPhone: "+91 99123 45678",     parentEmail: "farouk.khan@gmail.com",
    previousSchool: "Al-Ameen School",
    submittedDate: "2026-02-14", status: "pending", academicYear: "2026-27",
  },
  {
    id: 18, applicationNo: "ADM-2026-018",
    applicantName: "Nisha Jain",        dob: "2014-12-01", gender: "Female",
    applyingForClass: "6", parentName: "Mahesh Jain",
    parentPhone: "+91 87654 32109",     parentEmail: "mahesh.jain@gmail.com",
    previousSchool: "Lotus Valley School",
    submittedDate: "2026-02-15", status: "pending", academicYear: "2026-27",
    notes: "Gold medalist in state-level drawing competition.",
  },
  {
    id: 19, applicationNo: "ADM-2026-019",
    applicantName: "Dev Trivedi",       dob: "2014-07-14", gender: "Male",
    applyingForClass: "6", parentName: "Hardik Trivedi",
    parentPhone: "+91 91111 22333",     parentEmail: "hardik.trivedi@outlook.com",
    submittedDate: "2026-02-16", status: "pending", academicYear: "2026-27",
  },
  {
    id: 20, applicationNo: "ADM-2026-020",
    applicantName: "Pooja Das",         dob: "2013-09-20", gender: "Female",
    applyingForClass: "7", parentName: "Bijoy Das",
    parentPhone: "+91 78901 23456",     parentEmail: "bijoy.das@gmail.com",
    previousSchool: "Sree Narayana School",
    submittedDate: "2026-02-18", status: "pending", academicYear: "2026-27",
  },
  {
    id: 21, applicationNo: "ADM-2026-021",
    applicantName: "Krish Aggarwal",    dob: "2012-02-28", gender: "Male",
    applyingForClass: "8", parentName: "Naveen Aggarwal",
    parentPhone: "+91 99887 65432",     parentEmail: "naveen.aggarwal@gmail.com",
    previousSchool: "Delhi Public School",
    submittedDate: "2026-02-19", status: "pending", academicYear: "2026-27",
    notes: "Father is an alumni of this school.",
  },
  {
    id: 22, applicationNo: "ADM-2026-022",
    applicantName: "Zara Shaikh",       dob: "2012-06-11", gender: "Female",
    applyingForClass: "8", parentName: "Imran Shaikh",
    parentPhone: "+91 93456 78901",     parentEmail: "imran.shaikh@gmail.com",
    previousSchool: "Urdu Medium School",
    submittedDate: "2026-02-20", status: "pending", academicYear: "2026-27",
  },
  {
    id: 23, applicationNo: "ADM-2026-023",
    applicantName: "Rehan Siddiqui",    dob: "2011-03-17", gender: "Male",
    applyingForClass: "9", parentName: "Tahir Siddiqui",
    parentPhone: "+91 85678 90123",     parentEmail: "tahir.sid@hotmail.com",
    submittedDate: "2026-02-21", status: "rejected", academicYear: "2026-27",
    notes: "Documents incomplete. Reapply next year.",
  },
  {
    id: 24, applicationNo: "ADM-2026-024",
    applicantName: "Laleh Qureshi",     dob: "2010-01-30", gender: "Female",
    applyingForClass: "10", parentName: "Asim Qureshi",
    parentPhone: "+91 94321 09876",     parentEmail: "asim.qureshi@gmail.com",
    previousSchool: "Oxford School",
    submittedDate: "2026-02-22", status: "rejected", academicYear: "2026-27",
    notes: "Entrance test score below cutoff.",
  },
  {
    id: 25, applicationNo: "ADM-2026-025",
    applicantName: "Vedika Kulkarni",   dob: "2015-08-06", gender: "Female",
    applyingForClass: "5", parentName: "Mohan Kulkarni",
    parentPhone: "+91 76543 21098",     parentEmail: "mohan.kulkarni@gmail.com",
    submittedDate: "2026-02-24", status: "pending", academicYear: "2026-27",
    notes: "Walk-in applicant. Waiting for documents.",
  },

  // ── 2025-26 (previous year, closed) ──────────────────────────────────────
  {
    id: 26, applicationNo: "ADM-2025-001",
    applicantName: "Ritu Saxena",       dob: "2014-03-22", gender: "Female",
    applyingForClass: "5", parentName: "Pankaj Saxena",
    parentPhone: "+91 99001 88776",     parentEmail: "pankaj.saxena@gmail.com",
    previousSchool: "Sunflower School",
    submittedDate: "2025-01-10", status: "enrolled", academicYear: "2025-26",
  },
  {
    id: 27, applicationNo: "ADM-2025-002",
    applicantName: "Om Shukla",         dob: "2013-11-03", gender: "Male",
    applyingForClass: "6", parentName: "Ramakant Shukla",
    parentPhone: "+91 87654 00112",     parentEmail: "ramakant.shukla@yahoo.com",
    previousSchool: "Saraswati Vidya Mandir",
    submittedDate: "2025-01-18", status: "enrolled", academicYear: "2025-26",
  },
  {
    id: 28, applicationNo: "ADM-2025-003",
    applicantName: "Neha Thakur",       dob: "2012-07-14", gender: "Female",
    applyingForClass: "7", parentName: "Brijesh Thakur",
    parentPhone: "+91 96543 21987",     parentEmail: "brijesh.thakur@gmail.com",
    previousSchool: "City English School",
    submittedDate: "2025-02-05", status: "rejected", academicYear: "2025-26",
    notes: "No vacancy. Requested to try next year.",
  },
];

export const ACADEMIC_YEARS = ["2026-27", "2025-26"];
export const APPLY_CLASSES  = ["5", "6", "7", "8", "9", "10"];

// ── Display helpers ───────────────────────────────────────────────────────────

export const STATUS_LABEL: Record<AdmissionStatus, string> = {
  pending:      "Pending",
  under_review: "Under Review",
  approved:     "Approved",
  waitlisted:   "Waitlisted",
  rejected:     "Rejected",
  enrolled:     "Enrolled",
};

export const STATUS_BADGE: Record<AdmissionStatus, string> = {
  pending:      "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  under_review: "bg-blue-500/10    text-blue-600    dark:text-blue-400    border-blue-500/20",
  approved:     "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  waitlisted:   "bg-purple-500/10  text-purple-700  dark:text-purple-300  border-purple-500/20",
  rejected:     "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
  enrolled:     "bg-indigo-500/10  text-indigo-600  dark:text-indigo-400  border-indigo-500/20",
};

export function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export function calcAge(dob: string, academicYear: string) {
  const year = parseInt(academicYear.split("-")[0], 10);
  const born = new Date(dob);
  return year - born.getFullYear();
}
