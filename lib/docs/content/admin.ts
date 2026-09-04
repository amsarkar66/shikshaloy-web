import type { DocArticle } from "@/lib/docs/types";

export const ADMIN_ARTICLES: DocArticle[] = [
  {
    slug: "getting-started",
    title: "Your first week as Principal",
    summary: "Log in, get oriented, and set up the essentials for your school.",
    steps: [
      {
        heading: "Log in",
        body: [
          "Your institution's Super Admin invites you as Principal/Admin for a specific school — you'll receive a login email and a temporary password.",
          "Sign in and set a new password on first login.",
        ],
      },
      {
        heading: "Find your way around",
        body: [
          "The left sidebar groups everything by area: People, Time & Attendance, Academics, Operations, Finance, Communication, Facilities, Reports, and Administration.",
          "If your institution runs more than one school, use the school switcher at the top of the sidebar to confirm you're working in the right one — nothing you do here affects other schools.",
        ],
      },
      {
        heading: "Set up the basics",
        body: [
          "Before adding people, set up your Academic Calendar and Classes & Sections — most other modules (attendance, exams, fees) are organized around these.",
          "Then add your Staff and Students, and invite Parents so they can log in.",
        ],
      },
    ],
  },
  {
    slug: "people",
    title: "Managing students, staff, drivers & parents",
    summary: "Add and manage everyone at your school.",
    steps: [
      {
        heading: "Students",
        body: [
          "Go to Students to add a new student individually, or use bulk import for a whole class at once.",
          "Assign each student to a class and section — this is what drives their attendance, timetable, and exam records.",
        ],
      },
      {
        heading: "Staff",
        body: [
          "Go to Staff to add teachers and support staff. For support staff, assign a permission template (Accountant, Librarian, Warden, HR Manager, Receptionist, Lab Assistant) to control what they can see and do.",
        ],
      },
      {
        heading: "Drivers",
        body: [
          "Go to Drivers to add transport staff and assign them to a route (set up under Transport).",
        ],
      },
      {
        heading: "Parents",
        body: [
          "Go to Parents to invite a parent and link them to their child's student profile — this is what gives them access to their child's attendance, grades, and fees.",
        ],
      },
    ],
    tips: [
      "Use bulk import (CSV/Excel) when onboarding a new academic year — it's much faster than adding students one at a time.",
    ],
  },
  {
    slug: "attendance-leave",
    title: "Attendance tracking & leave management",
    summary: "Monitor daily attendance and manage staff leave requests.",
    steps: [
      {
        heading: "Attendance",
        body: [
          "Go to Attendance to view attendance marked by teachers, filter by class or date, and spot patterns like frequent absences.",
          "You can also mark or correct attendance directly from this page if needed.",
        ],
      },
      {
        heading: "Leave Management",
        body: [
          "Go to Leave Management to review pending leave requests from teachers and staff.",
          "Approve or reject each request — approved leave is reflected automatically wherever staff attendance is tracked.",
        ],
      },
    ],
  },
  {
    slug: "academics",
    title: "Classes, subjects, timetable & homework",
    summary: "Set up the academic structure your school runs on.",
    steps: [
      {
        heading: "Academic Calendar",
        body: [
          "Go to Academic Calendar to set the current academic year, terms, and holidays — other modules use these dates.",
        ],
      },
      {
        heading: "Classes & Sections, Subjects",
        body: [
          "Go to Classes & Sections to define your grade levels and sections (e.g. Class 8 – A, B, C).",
          "Go to Subjects to define the subjects taught, and assign a teacher to each subject per class.",
        ],
      },
      {
        heading: "Timetable & Homework",
        body: [
          "Go to Timetable to build the weekly schedule for each class/section, period by period.",
          "Homework is created by teachers, but you can review what's been assigned across the school from the Homework page.",
        ],
      },
    ],
  },
  {
    slug: "exams-grades",
    title: "Exams, results & grades",
    summary: "Set up exams and oversee results across your school.",
    steps: [
      {
        heading: "Set up an exam",
        body: [
          "Go to Exams & Results and create a new exam — name, term, classes involved, and the subjects and max marks for each.",
        ],
      },
      {
        heading: "Review grades",
        body: [
          "Teachers enter marks for their subjects; go to Grades to review submissions across the school and approve them for publishing.",
        ],
      },
      {
        heading: "Publish results",
        body: [
          "Once marks are finalized, publish the exam so results become visible to students and parents.",
        ],
      },
    ],
  },
  {
    slug: "certificates-id-cards",
    title: "Certificates & ID cards",
    summary: "Generate official certificates and student/staff ID cards.",
    steps: [
      {
        heading: "Certificates",
        body: [
          "Go to Certificates to generate a bonafide, transfer, or character certificate for a student — pick a template, fill in the details, and download a PDF.",
        ],
      },
      {
        heading: "ID Cards",
        body: [
          "Go to ID Cards to design and generate ID cards for students or staff, individually or in bulk for a whole class.",
        ],
      },
    ],
  },
  {
    slug: "admissions-front-desk",
    title: "Admissions & front desk",
    summary: "Manage new applications and day-to-day visitors.",
    steps: [
      {
        heading: "Admissions",
        body: [
          "Go to Admissions to see incoming applications and move each one through your school's admission stages (inquiry, application, offer, enrolled).",
          "Once an applicant is accepted, convert them into a student record directly from their application.",
        ],
      },
      {
        heading: "Front Desk",
        body: [
          "Go to Front Desk to log visitors — name, purpose, and who they're here to see — useful for walk-ins and admission inquiries alike.",
        ],
      },
    ],
  },
  {
    slug: "finance",
    title: "Fee management, expenses & payroll",
    summary: "Run your school's finances from one place.",
    steps: [
      {
        heading: "Fee Management",
        body: [
          "Go to Fee Management to set up fee structures per class, track what each student owes and has paid, and record offline payments.",
        ],
      },
      {
        heading: "Expenses",
        body: [
          "Go to Expenses to log school spending by category, with receipts attached where you have them.",
        ],
      },
      {
        heading: "Payroll",
        body: [
          "Go to Payroll to review staff salary details and run payroll for the month, generating payslips.",
        ],
      },
    ],
  },
  {
    slug: "communication",
    title: "Announcements, messages, events & grievances",
    summary: "Keep students, staff, and parents informed and heard.",
    steps: [
      {
        heading: "Announcements",
        body: [
          "Go to Announcements to post a school-wide or class-specific notice — it appears in the relevant users' dashboards and can trigger email/notification alerts.",
        ],
      },
      {
        heading: "Messages",
        body: [
          "Go to Messages to message any student, parent, or staff member directly.",
        ],
      },
      {
        heading: "Events & Calendar",
        body: [
          "Go to Events & Calendar to add upcoming school events so they show up for staff, students, and parents.",
        ],
      },
      {
        heading: "Grievances",
        body: [
          "Go to Grievances to review complaints or concerns raised by parents or staff, and track each one through to resolution.",
        ],
      },
    ],
  },
  {
    slug: "facilities",
    title: "Transport, library, hostel & inventory",
    summary: "Manage your school's physical facilities.",
    steps: [
      {
        heading: "Transport",
        body: [
          "Go to Transport to set up routes and stops, and assign drivers and students to a route.",
        ],
      },
      {
        heading: "Library",
        body: [
          "Go to Library to manage the book catalog and track issues, returns, and overdue books.",
        ],
      },
      {
        heading: "Hostel",
        body: [
          "Go to Hostel to manage rooms and beds, and allocate resident students.",
        ],
      },
      {
        heading: "Inventory",
        body: [
          "Go to Inventory to track school equipment and stock levels.",
        ],
      },
    ],
  },
  {
    slug: "reports-analytics",
    title: "Reports & analytics",
    summary: "See how your school is doing at a glance.",
    steps: [
      {
        heading: "Reports",
        body: [
          "Go to Reports to generate exportable reports — attendance summaries, fee collection, exam performance, and more, filterable by class and date range.",
        ],
      },
      {
        heading: "Analytics",
        body: [
          "Go to Analytics for visual dashboards of trends over time, such as attendance rates and fee collection progress.",
        ],
      },
    ],
  },
  {
    slug: "documents",
    title: "Documents & circulars",
    summary: "Keep official school documents in one shared library.",
    steps: [
      {
        heading: "Upload a document",
        body: [
          "Go to Documents & Circulars and click Upload to add a file, choose a category, and decide who can see it (all staff, a specific role, or everyone including parents).",
        ],
      },
      {
        heading: "Find a document",
        body: [
          "Use the category filters or search to find a previously uploaded circular or document.",
        ],
      },
    ],
  },
  {
    slug: "settings-audit",
    title: "Settings & audit log",
    summary: "Configure your school and review a history of changes.",
    steps: [
      {
        heading: "Settings",
        body: [
          "Go to Settings to update your school's profile, branding, and preferences for the modules you use.",
        ],
      },
      {
        heading: "Audit Log",
        body: [
          "Go to Audit Log to see a chronological record of significant actions taken in your school's account — who did what, and when. Useful for tracing back a change you didn't expect.",
        ],
      },
    ],
  },
];
