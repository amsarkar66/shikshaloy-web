import type { ReactNode } from "react";
import Link from "next/link";
import {
  ClipboardCheck,
  CreditCard,
  MessageSquare,
  FileBarChart,
  Check,
  ArrowRight,
  Megaphone,
  Bell,
} from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";

function MockupFrame({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-900/5 overflow-hidden">
      <div className="flex items-center gap-2.5 border-b border-zinc-100 bg-zinc-50/60 px-4 py-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-primary-600 ring-1 ring-zinc-200 [&_svg]:h-3.5 [&_svg]:w-3.5">
          {icon}
        </span>
        <span className="text-xs font-semibold text-zinc-700">{label}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const attendanceRows = [
  { name: "Aarav Sharma", meta: "Class 8 · B", status: "Present", dot: "bg-emerald-400" },
  { name: "Priya Nair", meta: "Class 6 · A", status: "Present", dot: "bg-emerald-400" },
  { name: "Kabir Singh", meta: "Class 9 · C", status: "Leave", dot: "bg-amber-400" },
];

function AttendanceMockup() {
  return (
    <MockupFrame label="Attendance — Class 8B" icon={<ClipboardCheck />}>
      <div className="flex items-end gap-4 mb-5">
        <p className="text-4xl font-extrabold text-zinc-900 tracking-tight">96.4%</p>
        <p className="mb-1 text-xs text-zinc-500">present today</p>
      </div>
      <div className="flex items-end gap-2 h-16 mb-5">
        {[38, 62, 45, 78, 54, 90, 66].map((h, i) => (
          <div key={i} className="flex-1 rounded-t-md bg-gradient-to-t from-primary-500 to-primary-300" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="space-y-2">
        {attendanceRows.map((r) => (
          <div key={r.name} className="flex items-center gap-3 rounded-lg border border-zinc-100 px-3 py-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-b from-primary-300 to-primary-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-800 truncate">{r.name}</p>
              <p className="text-[10px] text-zinc-400">{r.meta}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-zinc-500">
              <span className={`h-1.5 w-1.5 rounded-full ${r.dot}`} />
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

const feeRows = [
  { name: "Diya Patel", amount: "₹4,500", status: "Paid", tint: "text-emerald-600 bg-emerald-50" },
  { name: "Rohan Gupta", amount: "₹2,000", status: "Partial", tint: "text-amber-600 bg-amber-50" },
  { name: "Kabir Verma", amount: "₹4,500", status: "Overdue", tint: "text-red-600 bg-red-50" },
];

function FeesMockup() {
  return (
    <MockupFrame label="Fees — August 2026" icon={<CreditCard />}>
      <div className="flex items-end gap-4 mb-5">
        <p className="text-4xl font-extrabold text-zinc-900 tracking-tight">₹8.2L</p>
        <p className="mb-1 text-xs text-zinc-500">collected this month</p>
      </div>
      <div className="mb-5 h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
        <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-primary-500 to-primary-400" />
      </div>
      <div className="space-y-2">
        {feeRows.map((r) => (
          <div key={r.name} className="flex items-center gap-3 rounded-lg border border-zinc-100 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-zinc-800 truncate">{r.name}</p>
              <p className="text-[10px] text-zinc-400">{r.amount} due</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.tint}`}>{r.status}</span>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

const messages = [
  { icon: Megaphone, text: "PTM scheduled for Class 9 — Sat, 10 AM", tint: "bg-primary-50 text-primary-600" },
  { icon: Bell, text: "Fee reminder sent to 42 parents", tint: "bg-amber-50 text-amber-600" },
  { icon: MessageSquare, text: "3 new replies from parents", tint: "bg-sky-50 text-sky-600" },
];

function CommunicationMockup() {
  return (
    <MockupFrame label="Announcements & Messages" icon={<MessageSquare />}>
      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.text} className="flex items-start gap-3 rounded-xl border border-zinc-100 p-3">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${m.tint}`}>
              <m.icon className="h-4 w-4" />
            </span>
            <p className="mt-1 text-xs font-medium text-zinc-700 leading-relaxed">{m.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-zinc-200 px-3 py-2.5 text-xs text-zinc-400">
        Message a class, a role, or the whole school…
      </div>
    </MockupFrame>
  );
}

function ReportsMockup() {
  return (
    <MockupFrame label="Attendance Trend — Last 6 Weeks" icon={<FileBarChart />}>
      <div className="mb-5 flex items-center gap-6">
        <div>
          <p className="text-3xl font-extrabold text-zinc-900 tracking-tight">92.1%</p>
          <p className="text-xs text-zinc-500">avg. attendance</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
          +3.4% vs last term
        </span>
      </div>
      <svg viewBox="0 0 260 80" className="w-full h-20" fill="none">
        <polyline
          points="0,55 40,48 80,58 120,32 160,40 200,18 260,25"
          stroke="var(--color-primary-500)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="0,55 40,48 80,58 120,32 160,40 200,18 260,25 260,80 0,80"
          fill="var(--color-primary-100)"
          opacity="0.5"
          stroke="none"
        />
      </svg>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: "Classes", value: "24" },
          { label: "Reports run", value: "1.2k" },
          { label: "Exported", value: "310" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-zinc-100 px-3 py-2 text-center">
            <p className="text-sm font-bold text-zinc-900">{s.value}</p>
            <p className="text-[10px] text-zinc-400">{s.label}</p>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

const rows = [
  {
    icon: ClipboardCheck,
    eyebrow: "Attendance",
    title: "Attendance marked in seconds, not minutes",
    desc: "Teachers mark a whole class in one tap — by hand, QR sheet, or check-in device — and every dashboard updates instantly, including the parent's.",
    bullets: ["Manual, QR, or device check-in", "Real-time parent notifications", "Automatic monthly reports"],
    Mockup: AttendanceMockup,
  },
  {
    icon: CreditCard,
    eyebrow: "Fees & Billing",
    title: "Fee collection that reconciles itself",
    desc: "Define fee structures per grade, collect online or offline, and watch dues, partial payments, and receipts stay in sync automatically.",
    bullets: ["Online payments & auto receipts", "Partial payment & due tracking", "Category-wise expense budgets"],
    Mockup: FeesMockup,
  },
  {
    icon: MessageSquare,
    eyebrow: "Communication",
    title: "One inbox instead of six WhatsApp groups",
    desc: "Announcements, direct messages, and grievances all live in the same system every role already checks — targeted by school, class, or role.",
    bullets: ["Announcements by class or role", "Direct teacher-parent messaging", "Documents & circulars, archived"],
    Mockup: CommunicationMockup,
  },
  {
    icon: FileBarChart,
    eyebrow: "Reports & Analytics",
    title: "Answers, not exports you have to build yourself",
    desc: "Attendance trends, exam performance, and financial reports are generated live from the same data every role already sees — no spreadsheet stitching.",
    bullets: ["Attendance & academic trends", "Financial & fee-collection reports", "School and platform-level analytics"],
    Mockup: ReportsMockup,
  },
];

export function FeatureShowcaseSection() {
  return (
    <section id="features" className="relative bg-white py-24 sm:py-32 overflow-hidden">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-20 max-w-2xl mx-auto">
          <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">
            Everything You Need
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight text-balance">
            Four modules, one connected system
          </h2>
          <p className="mt-4 text-zinc-500 text-balance">
            A closer look at the modules schools reach for every single day —
            with 40+ more built in for everything else.
          </p>
        </FadeIn>

        <div className="space-y-24 sm:space-y-32">
          {rows.map((r, i) => (
            <div
              key={r.eyebrow}
              className="grid md:grid-cols-2 items-center gap-10 lg:gap-16"
            >
              <FadeIn direction={i % 2 === 1 ? "right" : "left"} className={i % 2 === 1 ? "md:order-2" : ""}>
                <span className="inline-flex items-center justify-center h-11 w-11 rounded-xl bg-primary-50 mb-5">
                  <r.icon className="h-5 w-5 text-primary-600" />
                </span>
                <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-2">
                  {r.eyebrow}
                </p>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight text-balance">
                  {r.title}
                </h3>
                <p className="mt-4 text-zinc-500 leading-relaxed max-w-md">{r.desc}</p>
                <ul className="mt-6 space-y-2.5">
                  {r.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2.5 text-sm text-zinc-700">
                      <Check className="h-4 w-4 text-primary-600 shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/demo"
                  className="mt-7 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Try it in the live demo
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </FadeIn>

              <FadeIn delay={0.1} direction={i % 2 === 1 ? "left" : "right"} className={i % 2 === 1 ? "md:order-1" : ""}>
                <r.Mockup />
              </FadeIn>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
