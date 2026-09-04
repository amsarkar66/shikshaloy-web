import type { DocArticle } from "@/lib/docs/types";

export const SUPER_ADMIN_ARTICLES: DocArticle[] = [
  {
    slug: "getting-started",
    title: "Getting started as an Institution Owner",
    summary: "Sign up, pick a plan, and get oriented in your institution-wide dashboard.",
    steps: [
      {
        heading: "Sign up and choose a plan",
        body: [
          "Create your account at shikshaloy.com/signup with your institution's name and your details.",
          "Pick a subscription plan based on how many schools and students you expect to onboard — you can change plans later from Billing & Subscription in your account menu.",
        ],
      },
      {
        heading: "Log in and tour your dashboard",
        body: [
          "Your dashboard is institution-wide: it rolls up every school under your account. The sidebar covers Institution, People, Operations, Academics, Finance, Reports & Analytics, Communication, and Administration.",
          "This is different from a Principal's (Admin) dashboard, which is scoped to a single school's day-to-day running — you'll mostly work one level up from that.",
        ],
      },
      {
        heading: "Set up your first school",
        body: [
          "Go to Schools → Add School to create your first school, then invite a Principal to run it day-to-day — see Adding & managing schools for details.",
        ],
      },
    ],
  },
  {
    slug: "schools",
    title: "Adding & managing schools",
    summary: "Add every school in your institution and switch between them.",
    steps: [
      {
        heading: "Add a school",
        body: [
          "Go to Schools → Add School and fill in its name, address, and contact details.",
          "Each additional school counts against your subscription plan's school limit — if you've hit it, upgrade your plan from Billing & Subscription (in your account menu) or the prompt that appears.",
        ],
      },
      {
        heading: "Switch between schools",
        body: [
          "Use the school switcher at the top of the sidebar to jump into any school's own dashboard — useful when you need to act at the single-school level rather than institution-wide.",
        ],
      },
      {
        heading: "Edit a school's profile",
        body: [
          "Open a school from Schools to update its details, logo, and academic year configuration.",
        ],
      },
    ],
  },
  {
    slug: "website",
    title: "Building your public school website",
    summary: "Set up and publish a public-facing website for each school.",
    steps: [
      {
        heading: "Open the website builder",
        body: [
          "Go to Website, pick the school you're building for, and choose a starting template.",
        ],
      },
      {
        heading: "Edit pages and content",
        body: [
          "Add and arrange pages (About, Admissions, Contact, etc.), update text and images, and set your school's branding — logo and colors carry through automatically.",
        ],
      },
      {
        heading: "Publish",
        body: [
          "Preview your changes, then click Publish to make the site live. You can keep editing and republish at any time — visitors always see the last published version.",
        ],
      },
    ],
  },
  {
    slug: "people",
    title: "Managing people across your institution",
    summary: "See students, staff, and parents institution-wide, and invite Principals to run each school.",
    steps: [
      {
        heading: "Browse people institution-wide",
        body: [
          "Students, Staff, and Parents each give you a combined view across every school in your institution — filter by school when you need to narrow in.",
          "Day-to-day additions (enrolling a student, hiring a teacher) are usually done by each school's Principal from their own dashboard.",
        ],
      },
      {
        heading: "Invite a Principal",
        body: [
          "Go to Administrators → Invite Principal, pick which school they'll run, and send the invite.",
          "They receive login credentials scoped to that school and get their own Admin dashboard.",
        ],
      },
    ],
  },
  {
    slug: "admissions-front-desk",
    title: "Admissions & front desk oversight",
    summary: "See the admissions pipeline and front-desk activity across your schools.",
    steps: [
      {
        heading: "Review admissions institution-wide",
        body: [
          "Go to Admissions for a combined view of enquiries and applications across every school — filter by school or stage to focus in.",
          "Day-to-day pipeline management (moving an application through stages, converting to enrollment) is typically handled by each school's Principal or front-desk staff.",
        ],
      },
      {
        heading: "Check front desk logs",
        body: [
          "Go to Front Desk for visitor and gate-pass activity across your schools.",
        ],
      },
    ],
  },
  {
    slug: "approvals",
    title: "Reviewing and approving requests",
    summary: "Act on requests that need institution-owner sign-off.",
    steps: [
      {
        heading: "Open your Approvals inbox",
        body: [
          "Go to Approvals to see pending items that need your decision — these can include new school setup requests, plan/limit changes, or actions a Principal has escalated to you.",
        ],
      },
      {
        heading: "Approve or reject",
        body: [
          "Open a request to see its details, then Approve or Reject — the requester is notified of your decision automatically.",
        ],
      },
    ],
  },
  {
    slug: "academics",
    title: "Academic calendar, exams & certificates",
    summary: "Set institution-wide academic policy and oversee results and certificates.",
    steps: [
      {
        heading: "Set the academic calendar",
        body: [
          "Go to Academic Calendar to define terms and holidays — set them once at the institution level, or per school if their calendars differ.",
        ],
      },
      {
        heading: "Oversee exams & results",
        body: [
          "Go to Exams & Results for a cross-school view of exam cycles and published results. Each school's Principal owns the day-to-day setup and marking.",
        ],
      },
      {
        heading: "Manage certificate templates",
        body: [
          "Go to Certificates to maintain the certificate templates (bonafide, transfer, character, etc.) available to every school in your institution.",
        ],
      },
    ],
  },
  {
    slug: "finance",
    title: "Fee collection, expenses & payroll",
    summary: "Oversee financial activity across every school you run.",
    steps: [
      {
        heading: "Fee collection",
        body: [
          "Go to Fee Collection for a combined view of dues and payments collected across all schools — filter by school for a single site's numbers.",
        ],
      },
      {
        heading: "Expenses & payroll",
        body: [
          "Go to Expenses or Payroll for institution-wide spending and staff payroll totals. Individual entries and payroll runs are usually processed at the school level by a Principal or accountant.",
        ],
      },
    ],
    tips: [
      "This is your schools' own internal finances (fees they collect, salaries they pay) — separate from your Shikshaloy subscription billing, which lives under Settings.",
    ],
  },
  {
    slug: "reports-analytics",
    title: "Reports & analytics",
    summary: "Pull cross-school reports and track institution-wide trends.",
    steps: [
      {
        heading: "Generate a report",
        body: [
          "Go to Reports, choose a report type, and select one school or all of them, then export as PDF or Excel.",
        ],
      },
      {
        heading: "Read the analytics dashboard",
        body: [
          "Go to Analytics for institution-wide trends — enrollment growth, attendance patterns, and fee-collection health across all your schools, with the ability to compare schools side by side.",
        ],
      },
    ],
  },
  {
    slug: "communication",
    title: "Announcements, messages & grievances",
    summary: "Communicate across your institution and handle escalated grievances.",
    steps: [
      {
        heading: "Broadcast an announcement",
        body: [
          "Go to Announcements → New Announcement and target it to a single school, several schools, or your whole institution.",
        ],
      },
      {
        heading: "Message someone directly",
        body: [
          "Go to Messages to reach any Principal, staff member, or parent one-to-one, across any school.",
        ],
      },
      {
        heading: "Handle grievances",
        body: [
          "Go to Grievances for issues escalated beyond the school level. Open one to review the history and respond, then mark it resolved.",
        ],
      },
    ],
  },
  {
    slug: "documents",
    title: "Documents & circulars",
    summary: "Maintain a shared document library across your institution.",
    steps: [
      {
        heading: "Upload a document",
        body: [
          "Go to Documents & Circulars → Upload, and choose whether it applies to one school or your whole institution.",
        ],
      },
      {
        heading: "Organize and share",
        body: [
          "Group files into categories (policies, circulars, forms) and control who can see each one — staff, parents, or a specific school.",
        ],
      },
    ],
  },
  {
    slug: "settings",
    title: "Institution settings, branding & roles",
    summary: "Configure your institution profile, permissions, and Shikshaloy subscription.",
    steps: [
      {
        heading: "Institution profile & branding",
        body: [
          "Go to Settings to update your institution's name, logo, and default branding that schools inherit unless they customize their own.",
        ],
      },
      {
        heading: "Manage roles & permissions",
        body: [
          "Still under Settings, review the permission templates available for staff (accountant, librarian, warden, HR manager, receptionist, lab assistant) and what each can access.",
        ],
      },
      {
        heading: "Manage your subscription",
        body: [
          "Open your account menu (click your avatar in the top-right) and choose Billing & Subscription to see your current plan, usage against its limits, upcoming renewal, and to upgrade or change your plan.",
        ],
      },
    ],
  },
  {
    slug: "audit-log",
    title: "Audit log",
    summary: "Trace who changed what, across every school in your institution.",
    steps: [
      {
        heading: "Open the audit log",
        body: [
          "Go to Audit Log for a timestamped history of significant actions across your institution — new enrollments, fee-structure changes, approvals, and more.",
        ],
      },
      {
        heading: "Filter your search",
        body: [
          "Narrow the log by school, user, or date range when you're investigating something specific.",
        ],
      },
    ],
    tips: [
      "The audit log is read-only for everyone, including you — treat it as your source of truth if something needs to be traced back.",
    ],
  },
  {
    slug: "support",
    title: "Getting help & support",
    summary: "Find answers in the FAQ, or reach the Shikshaloy team directly.",
    steps: [
      {
        heading: "Check the FAQ",
        body: [
          "Go to Help & Support and search or browse the FAQ — it covers common questions about billing, school setup, and technical issues.",
        ],
      },
      {
        heading: "Submit a support request",
        body: [
          "If the FAQ doesn't cover it, fill in the category, subject, and message on the same page and click Submit Request.",
          "You can also reach us directly by email or phone — both are listed at the top of the Help & Support page.",
        ],
      },
      {
        heading: "Track your request",
        body: [
          "Switch to My Requests on the same page to see the status of anything you've submitted and reply in the same thread when the team responds.",
        ],
      },
    ],
  },
];
