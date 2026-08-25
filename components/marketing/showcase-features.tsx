import {
  ClipboardCheck,
  CreditCard,
  Award,
  NotebookPen,
  CalendarClock,
  Bus,
  Library,
  Building2,
  Banknote,
  IdCard,
  Megaphone,
  FileText,
  Sparkles,
} from "lucide-react";
import type { ShowcaseFeature } from "@/components/marketing/demo-feature-showcase";
import AttendanceClient, {
  type AttendanceSec,
  type AttendanceStudent,
  type AttendanceStaff,
  type AttendanceStatus,
  type StaffAttendanceStatus,
} from "@/app/dashboard/attendance/_components/AttendanceClient";
import FeesClient from "@/app/dashboard/fees/_components/FeesClient";
import type { FeeStudent, FeePaymentRow } from "@/app/dashboard/fees/_data/fees";

const MOCK_SECTIONS: AttendanceSec[] = [
  { id: "sec-1", classNum: "9",  section: "A", teacher: "Ritu Sharma",   room: "Room 12", enrolled: 38 },
  { id: "sec-2", classNum: "9",  section: "B", teacher: "Arvind Nair",   room: "Room 14", enrolled: 36 },
  { id: "sec-3", classNum: "10", section: "A", teacher: "Priya Menon",   room: "Room 21", enrolled: 34 },
];

const MOCK_STUDENTS: Record<string, AttendanceStudent[]> = {
  "sec-1": [
    { id: "st-1", name: "Aarav Kapoor",   rollNo: "01", attendance: 96, sectionId: "sec-1", classNum: "9", section: "A" },
    { id: "st-2", name: "Diya Patel",     rollNo: "02", attendance: 91, sectionId: "sec-1", classNum: "9", section: "A" },
    { id: "st-3", name: "Kabir Verma",    rollNo: "03", attendance: 78, sectionId: "sec-1", classNum: "9", section: "A" },
    { id: "st-4", name: "Sneha Iyer",     rollNo: "04", attendance: 99, sectionId: "sec-1", classNum: "9", section: "A" },
    { id: "st-5", name: "Rohan Gupta",    rollNo: "05", attendance: 85, sectionId: "sec-1", classNum: "9", section: "A" },
  ],
  "sec-2": [
    { id: "st-6", name: "Ananya Reddy",   rollNo: "01", attendance: 93, sectionId: "sec-2", classNum: "9", section: "B" },
    { id: "st-7", name: "Vihaan Joshi",   rollNo: "02", attendance: 88, sectionId: "sec-2", classNum: "9", section: "B" },
  ],
  "sec-3": [
    { id: "st-8", name: "Ishaan Rao",     rollNo: "01", attendance: 97, sectionId: "sec-3", classNum: "10", section: "A" },
    { id: "st-9", name: "Myra Choudhury", rollNo: "02", attendance: 90, sectionId: "sec-3", classNum: "10", section: "A" },
  ],
};

const MOCK_TODAY_ATTENDANCE: Record<string, AttendanceStatus> = {
  "st-1": "present", "st-2": "present", "st-3": "absent", "st-4": "present",
  "st-5": "late",    "st-6": "present", "st-7": "present", "st-8": "present",
  "st-9": "unmarked",
};

const MOCK_ATTENDANCE_HISTORY: { date: string; rate: number }[] = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (13 - i));
  const rate = [88, 91, 87, 93, 90, 95, 92, 89, 94, 91, 96, 90, 93, 92][i];
  return { date: d.toISOString().split("T")[0], rate };
});

function AttendancePreview() {
  return (
    <AttendanceClient
      initialSections={MOCK_SECTIONS}
      initialStudentsBySection={MOCK_STUDENTS}
      initialStaff={[] as AttendanceStaff[]}
      todayAttendance={MOCK_TODAY_ATTENDANCE}
      todayStaffAttendance={{} as Record<string, StaffAttendanceStatus>}
      attendanceHistory={MOCK_ATTENDANCE_HISTORY}
      allowStaffTab={false}
    />
  );
}

const MOCK_FEE_STUDENTS: FeeStudent[] = [
  { id: "st-1", name: "Aarav Kapoor",   rollNo: "01", classNum: "9",  section: "A", parent: "Rajesh Kapoor",   phone: "98765 43210", active: true },
  { id: "st-2", name: "Diya Patel",     rollNo: "02", classNum: "9",  section: "A", parent: "Meena Patel",     phone: "98765 43211", active: true },
  { id: "st-3", name: "Kabir Verma",    rollNo: "03", classNum: "9",  section: "A", parent: "Sunil Verma",     phone: "98765 43212", active: true },
  { id: "st-6", name: "Ananya Reddy",   rollNo: "01", classNum: "9",  section: "B", parent: "Kiran Reddy",     phone: "98765 43213", active: true },
  { id: "st-8", name: "Ishaan Rao",     rollNo: "01", classNum: "10", section: "A", parent: "Lakshmi Rao",     phone: "98765 43214", active: true },
  { id: "st-9", name: "Myra Choudhury", rollNo: "02", classNum: "10", section: "A", parent: "Anil Choudhury",  phone: "98765 43215", active: true },
];

const MOCK_FEE_PAYMENTS: FeePaymentRow[] = [
  { id: "fp-1", studentId: "st-1", monthStr: "2026-08", category: "Tuition Fee",   amountDue: 4500, amountPaid: 4500, status: "paid",    paidDate: "2026-08-04", receiptNo: "RCPT-2026-0231", paymentMode: "online" },
  { id: "fp-2", studentId: "st-1", monthStr: "2026-08", category: "Transport Fee", amountDue: 1200, amountPaid: 1200, status: "paid",    paidDate: "2026-08-04", receiptNo: "RCPT-2026-0232", paymentMode: "online" },
  { id: "fp-3", studentId: "st-2", monthStr: "2026-08", category: "Tuition Fee",   amountDue: 4500, amountPaid: 2000, status: "partial", paidDate: "2026-08-10", receiptNo: "RCPT-2026-0240", paymentMode: "cash" },
  { id: "fp-4", studentId: "st-3", monthStr: "2026-08", category: "Tuition Fee",   amountDue: 4500, amountPaid: 0,    status: "overdue", paidDate: null,         receiptNo: null,             paymentMode: null },
  { id: "fp-5", studentId: "st-6", monthStr: "2026-08", category: "Tuition Fee",   amountDue: 4200, amountPaid: 4200, status: "paid",    paidDate: "2026-08-02", receiptNo: "RCPT-2026-0219", paymentMode: "upi" },
  { id: "fp-6", studentId: "st-8", monthStr: "2026-08", category: "Tuition Fee",   amountDue: 5000, amountPaid: 5000, status: "paid",    paidDate: "2026-08-05", receiptNo: "RCPT-2026-0235", paymentMode: "online" },
  { id: "fp-7", studentId: "st-8", monthStr: "2026-08", category: "Lab Fee",       amountDue: 800,  amountPaid: 0,    status: "overdue", paidDate: null,         receiptNo: null,             paymentMode: null },
  { id: "fp-8", studentId: "st-9", monthStr: "2026-08", category: "Tuition Fee",   amountDue: 5000, amountPaid: 3000, status: "partial", paidDate: "2026-08-12", receiptNo: "RCPT-2026-0248", paymentMode: "cheque" },
  { id: "fp-9", studentId: "st-1", monthStr: "2026-07", category: "Tuition Fee",   amountDue: 4500, amountPaid: 4500, status: "paid",    paidDate: "2026-07-03", receiptNo: "RCPT-2026-0180", paymentMode: "online" },
  { id: "fp-10", studentId: "st-2", monthStr: "2026-07", category: "Tuition Fee",  amountDue: 4500, amountPaid: 4500, status: "paid",    paidDate: "2026-07-05", receiptNo: "RCPT-2026-0184", paymentMode: "cash" },
];

function FeesPreview() {
  return <FeesClient students={MOCK_FEE_STUDENTS} payments={MOCK_FEE_PAYMENTS} />;
}

function ComingSoonPreview({ label }: { label: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
        <Sparkles className="h-5 w-5" />
      </span>
      <p className="text-sm font-semibold text-zinc-900">{label} preview coming soon</p>
      <p className="max-w-xs text-xs text-zinc-400">
        Sign into the live demo above to explore this module today.
      </p>
    </div>
  );
}

export const SHOWCASE_FEATURES: ShowcaseFeature[] = [
  {
    id: "attendance",
    label: "Attendance",
    description: "Mark & track attendance in seconds",
    icon: <ClipboardCheck className="h-4 w-4" />,
    content: <AttendancePreview />,
  },
  {
    id: "fees",
    label: "Fees & Billing",
    description: "Collect, track, and reconcile fees",
    icon: <CreditCard className="h-4 w-4" />,
    content: <FeesPreview />,
  },
  {
    id: "exams",
    label: "Exams & Results",
    description: "Grade exams and publish results",
    icon: <Award className="h-4 w-4" />,
    content: <ComingSoonPreview label="Exams & Results" />,
  },
  {
    id: "homework",
    label: "Homework & Assignments",
    description: "Assign, collect, and grade homework",
    icon: <NotebookPen className="h-4 w-4" />,
    content: <ComingSoonPreview label="Homework & Assignments" />,
  },
  {
    id: "timetable",
    label: "Timetable",
    description: "Build and share the class timetable",
    icon: <CalendarClock className="h-4 w-4" />,
    content: <ComingSoonPreview label="Timetable" />,
  },
  {
    id: "transport",
    label: "Transport & Routes",
    description: "Track routes, stops, and trips",
    icon: <Bus className="h-4 w-4" />,
    content: <ComingSoonPreview label="Transport & Routes" />,
  },
  {
    id: "library",
    label: "Library",
    description: "Manage the book catalog and issues",
    icon: <Library className="h-4 w-4" />,
    content: <ComingSoonPreview label="Library" />,
  },
  {
    id: "hostel",
    label: "Hostel",
    description: "Manage rooms, allotments, and mess",
    icon: <Building2 className="h-4 w-4" />,
    content: <ComingSoonPreview label="Hostel" />,
  },
  {
    id: "payroll",
    label: "Payroll",
    description: "Run staff payroll and payslips",
    icon: <Banknote className="h-4 w-4" />,
    content: <ComingSoonPreview label="Payroll" />,
  },
  {
    id: "id-cards",
    label: "ID Cards",
    description: "Design and print student ID cards",
    icon: <IdCard className="h-4 w-4" />,
    content: <ComingSoonPreview label="ID Cards" />,
  },
  {
    id: "announcements",
    label: "Announcements & Messaging",
    description: "Broadcast updates to parents & staff",
    icon: <Megaphone className="h-4 w-4" />,
    content: <ComingSoonPreview label="Announcements & Messaging" />,
  },
  {
    id: "documents",
    label: "Documents & Circulars",
    description: "Share and archive school documents",
    icon: <FileText className="h-4 w-4" />,
    content: <ComingSoonPreview label="Documents & Circulars" />,
  },
];
