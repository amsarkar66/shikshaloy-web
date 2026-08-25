export type ChangeType = "feat" | "fix" | "improve" | "docs";

export interface ChangelogEntryLine {
  type: ChangeType;
  text: string;
}

export interface ChangelogRelease {
  version: string;
  hash: string;
  date: string;
  entries: ChangelogEntryLine[];
}

// Newest first. Hand-curated from the real build history — internal-only
// work (SEO wiring, build fixes, refactors) is deliberately left out since
// this log is user-facing, not a raw commit mirror.
//
// This is the single source of truth for the app version — the dashboard
// sidebar reads RELEASES[0].version instead of package.json, so bumping it
// here is all that's needed to keep both in sync.
export const RELEASES: ChangelogRelease[] = [
  {
    version: "0.9.0",
    hash: "90de18a",
    date: "2026-08-25",
    entries: [
      { type: "feat", text: "Redesigned homepage with clearer, role-by-role walkthroughs" },
      { type: "feat", text: "Front Desk now tracks visitors and gate passes" },
      { type: "improve", text: "Bigger Announcements, Certificates, and Inventory modules" },
    ],
  },
  {
    version: "0.8.0",
    hash: "78f610e",
    date: "2026-08-22",
    entries: [
      { type: "feat", text: "Try Shikshaloy instantly with the new Live Demo — real dashboards, no signup" },
      { type: "feat", text: "Biometric/RFID attendance devices with printable QR sheets" },
      { type: "feat", text: "Exams module: term-wise schedules, grading, and report cards" },
      { type: "feat", text: "Front Desk: enquiries, gate passes, and visitor log" },
      { type: "docs", text: "Added Privacy Policy, Terms of Service, and Account Deletion pages" },
    ],
  },
  {
    version: "0.7.0",
    hash: "f7a12db",
    date: "2026-08-18",
    entries: [
      { type: "feat", text: "Fee Collection workspace with receipts and partial payments" },
      { type: "feat", text: "Custom Reports builder for attendance, fees, and academics" },
      { type: "feat", text: "Razorpay billing — subscribe and pay invoices online" },
      { type: "feat", text: "Support desk and in-app notifications" },
      { type: "improve", text: "Attendance rebuilt as a tabbed dashboard for faster daily marking" },
    ],
  },
  {
    version: "0.6.0",
    hash: "362459e",
    date: "2026-08-14",
    entries: [
      { type: "feat", text: "Multi-branch institutions hierarchy for school groups" },
      { type: "feat", text: "Detailed admissions review with document verification" },
      { type: "feat", text: "Printable student and staff ID cards" },
      { type: "feat", text: "Platform-level billing and operations tools for the Shikshaloy team" },
    ],
  },
  {
    version: "0.5.0",
    hash: "32f7ba6",
    date: "2026-08-10",
    entries: [
      { type: "improve", text: "Reworked signup down to a single step" },
      { type: "improve", text: "Phone-verified onboarding with a cleaner step indicator" },
    ],
  },
  {
    version: "0.4.0",
    hash: "6aa6a91",
    date: "2026-07-07",
    entries: [
      { type: "feat", text: "Student enrollment flow and a dedicated student portal" },
      { type: "feat", text: "Expanded admissions pipeline" },
    ],
  },
  {
    version: "0.3.0",
    hash: "8215cb7",
    date: "2026-06-23",
    entries: [
      { type: "feat", text: "Dashboards for every role — admin, teacher, student, parent, staff, driver" },
      { type: "feat", text: "Audit log for tracking changes across the school" },
    ],
  },
  {
    version: "0.2.0",
    hash: "1f13cc9",
    date: "2026-06-14",
    entries: [
      { type: "feat", text: "Shikshaloy launches — marketing site, secure sign-in, and the first dashboard" },
    ],
  },
];
