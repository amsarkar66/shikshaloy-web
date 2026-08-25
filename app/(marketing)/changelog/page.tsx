import type { Metadata } from "next";
import { FadeIn } from "@/components/ui/fade-in";
import { ChangelogTerminal, type ChangelogRelease } from "@/components/marketing/changelog-terminal";
import { breadcrumbJsonLd, OG_IMAGE } from "@/lib/seo";

const title = "Changelog";
const description =
  "Everything shipped in Shikshaloy — new modules, improvements, and fixes, in one running log.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/changelog" },
  openGraph: { title, description, url: "/changelog", images: [OG_IMAGE] },
};

const breadcrumbs = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Changelog", path: "/changelog" },
]);

// Newest first. Hand-curated from the real build history — internal-only
// work (SEO wiring, build fixes, refactors) is deliberately left out since
// this log is user-facing, not a raw commit mirror.
const RELEASES: ChangelogRelease[] = [
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

export default function ChangelogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <section className="relative overflow-hidden pt-40 pb-20 sm:pb-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-10%] left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-primary-200/40 blur-3xl" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_40%,transparent_100%)]"
          style={{
            backgroundImage: "radial-gradient(circle,#d4d4d8 1px,transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <FadeIn>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary-600">
              Changelog
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-balance text-zinc-900 sm:text-5xl">
              What&apos;s new in Shikshaloy
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-balance text-zinc-500">
              Every module we ship, every bug we squash — logged here as it happens.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <ChangelogTerminal releases={RELEASES} />
        </div>
      </section>
    </>
  );
}
