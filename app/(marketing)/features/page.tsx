import { FancyButton, ArrowUpRightIcon } from "@/components/ui/fancy-button";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/fade-in";
import {
  Layers,
  BookMarked,
  FileText,
  ClipboardCheck,
  CalendarRange,
  Award,
  UserCheck,
  Bus,
  CreditCard,
  Wallet,
  Receipt,
  Megaphone,
  MessageSquare,
  Users2,
  FolderOpen,
  MessageSquareWarning,
  UserPlus,
  DoorOpen,
  Library,
  BedDouble,
  Package,
  Shield,
  UserCog,
  FileBarChart,
  TrendingUp,
  History,
  type LucideIcon,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

interface Category {
  title: string;
  desc: string;
  features: Feature[];
}

const categories: Category[] = [
  {
    title: "Academics",
    desc: "Everything from class setup to report cards.",
    features: [
      { icon: Layers, title: "Classes & Sections", desc: "Organize grades, sections, and academic years with class-teacher assignment." },
      { icon: BookMarked, title: "Subjects & Timetable", desc: "Build weekly timetables and assign subject teachers per section." },
      { icon: FileText, title: "Homework & Assignments", desc: "Post homework by class and subject, track submissions in real time." },
      { icon: ClipboardCheck, title: "Exams & Grading", desc: "Schedule exams, enter marks, compute grades, and publish results." },
      { icon: CalendarRange, title: "Academic Calendar", desc: "Terms, holidays, exams, and events in one shared school calendar." },
      { icon: Award, title: "Certificates & ID Cards", desc: "Generate bonafide, transfer, and character certificates plus printable ID cards." },
    ],
  },
  {
    title: "Attendance",
    desc: "Mark it once, and every dashboard updates instantly.",
    features: [
      { icon: UserCheck, title: "Digital Attendance", desc: "Mark student and staff attendance manually, by QR sheet, or via device check-in." },
      { icon: Bus, title: "Transport Attendance", desc: "Track morning and evening trip check-ins per route and vehicle." },
    ],
  },
  {
    title: "Fees & Finance",
    desc: "From a single fee receipt to institution-wide billing.",
    features: [
      { icon: CreditCard, title: "Fee Management", desc: "Define fee structures per grade, collect payments, and track dues by student." },
      { icon: Wallet, title: "Payroll", desc: "Process staff salaries with allowances, deductions, and payslips." },
      { icon: Receipt, title: "Expenses & Budgets", desc: "Log school expenses against category budgets with approval status." },
    ],
  },
  {
    title: "Communication",
    desc: "Replace scattered WhatsApp groups with one system of record.",
    features: [
      { icon: Megaphone, title: "Announcements", desc: "Target announcements to everyone, a role, or a single class section." },
      { icon: MessageSquare, title: "Direct Messaging", desc: "In-app conversations between teachers, parents, staff, and admin." },
      { icon: Users2, title: "Parent-Teacher Meetings", desc: "Schedule PTM slots and let parents book directly." },
      { icon: FolderOpen, title: "Documents & Circulars", desc: "Share and archive school documents by audience and category." },
      { icon: MessageSquareWarning, title: "Grievances", desc: "A structured channel for parents and staff to raise and track issues." },
    ],
  },
  {
    title: "Admissions & Front Desk",
    desc: "From first enquiry to enrolled student.",
    features: [
      { icon: UserPlus, title: "Admissions Pipeline", desc: "Track applications from submitted through enrolled with status history." },
      { icon: DoorOpen, title: "Front Desk", desc: "Log visitors, enquiries, calls, and gate passes at reception." },
    ],
  },
  {
    title: "Facilities",
    desc: "Manage the parts of school life beyond the classroom.",
    features: [
      { icon: Bus, title: "Transport & Routes", desc: "Assign vehicles, drivers, and stops, with per-student route billing." },
      { icon: Library, title: "Library", desc: "Catalog books and track issues and returns for students and staff." },
      { icon: BedDouble, title: "Hostel", desc: "Manage rooms, allotments, and hostel fee status." },
      { icon: Package, title: "Inventory", desc: "Track equipment and supplies across locations with condition and quantity." },
    ],
  },
  {
    title: "People & Platform",
    desc: "Purpose-built for every role, secured by the database itself.",
    features: [
      { icon: Shield, title: "7 Role-Based Dashboards", desc: "Super admin, admin, teacher, staff, student, parent, and driver each get their own experience." },
      { icon: UserCog, title: "Configurable Staff Roles", desc: "Templates for librarian, warden, accountant, HR manager, receptionist, and lab assistant." },
      { icon: FileBarChart, title: "Reports", desc: "Attendance, academic, and financial reports generated on demand." },
      { icon: TrendingUp, title: "Analytics", desc: "School and platform-level analytics for admins and super admins." },
      { icon: History, title: "Audit Log", desc: "Every sensitive action is recorded, scoped, and reviewable." },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <main className="bg-white">
      <section className="relative pt-40 pb-20 sm:pb-24 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary-200/40 rounded-full blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">
              Features
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-900 tracking-tight text-balance">
              Every module a school actually runs on
            </h1>
            <p className="mt-5 text-lg text-zinc-500 text-balance">
              From the front desk to the finance office, Shikshaloy replaces the
              spreadsheets and group chats with one connected system.
            </p>
            <div className="mt-8 flex justify-center">
              <FancyButton href="/demo" size="lg">
                See it in the live demo
                <ArrowUpRightIcon className="size-5" />
              </FancyButton>
            </div>
          </FadeIn>
        </div>
      </section>

      {categories.map((cat, i) => (
        <section
          key={cat.title}
          className={`py-16 sm:py-20 ${i % 2 === 1 ? "bg-zinc-50/60 border-y border-zinc-100" : ""}`}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn className="mb-10 max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
                {cat.title}
              </h2>
              <p className="mt-2 text-zinc-500">{cat.desc}</p>
            </FadeIn>

            <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {cat.features.map((f) => (
                <StaggerItem key={f.title}>
                  <div className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-primary-200 hover:shadow-lg hover:shadow-primary-50 hover:-translate-y-0.5 transition-all duration-300 h-full">
                    <div className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary-50 mb-4 group-hover:bg-primary-100 transition-colors">
                      <f.icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <h3 className="font-semibold text-zinc-900 mb-2">{f.title}</h3>
                    <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerChildren>
          </div>
        </section>
      ))}

      <section className="bg-primary-950 py-20 text-center">
        <FadeIn className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white tracking-tight text-balance">
            See every module in a real dashboard
          </h2>
          <p className="mt-4 text-primary-200">
            No signup needed — pick a role and explore live, populated data.
          </p>
          <div className="mt-8">
            <FancyButton href="/demo" size="lg">
              Try the Live Demo
              <ArrowUpRightIcon className="size-5" />
            </FancyButton>
          </div>
        </FadeIn>
      </section>
    </main>
  );
}
