import type { Metadata } from "next";
import { FadeIn } from "@/components/ui/fade-in";
import { breadcrumbJsonLd, OG_IMAGE } from "@/lib/seo";

const title = "Terms of Service";
const description =
  "The terms governing use of the Shikshaloy school management platform — account responsibilities, subscription plans, acceptable use, and service availability.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/terms" },
  openGraph: { title, description, url: "/terms", images: [OG_IMAGE] },
  robots: { index: true, follow: true },
};

const breadcrumbs = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Terms of Service", path: "/terms" },
]);

const sections = [
  {
    title: "1. Acceptance of terms",
    body: `By creating a Shikshaloy account or using the platform, you agree to these terms on behalf of yourself and, if you're registering a school, on behalf of that institution.`,
  },
  {
    title: "2. The service",
    body: `Shikshaloy is a school management platform providing role-based dashboards and modules for admissions, academics, attendance, fees, communication, transport, and related school operations, as described on our Features page.`,
  },
  {
    title: "3. Accounts and roles",
    body: `A school's Super Admin account is responsible for that institution's use of Shikshaloy, including inviting and managing Admin, Staff, Teacher, Student, Parent, and Driver accounts within their school. Each account should be used only by the person it was created for.`,
  },
  {
    title: "4. Subscriptions and payment",
    body: `Paid plans are billed monthly as described on our Pricing page. Plan limits (schools, students) are enforced per institution; schools may upgrade at any time. Fees already paid are non-refundable except where required by law.`,
  },
  {
    title: "5. School-owned data",
    body: `All student, staff, and school records entered into Shikshaloy remain the property of the school that entered them. We act as a service provider processing that data on the school's behalf, and do not claim ownership over it.`,
  },
  {
    title: "6. Acceptable use",
    body: `You agree not to use Shikshaloy to store or transmit unlawful content, attempt to access data outside your assigned role or institution, or interfere with the platform's operation or other schools' use of it. The public live demo accounts are provided for evaluation only, reset automatically, and must not be used to store real personal data.`,
  },
  {
    title: "7. Termination",
    body: `A school may close its account at any time. We may suspend or terminate accounts that violate these terms or applicable law, with notice where practicable.`,
  },
  {
    title: "8. Disclaimers and liability",
    body: `Shikshaloy is provided "as is." While we work to keep the platform reliable and secure, we do not guarantee uninterrupted availability. To the extent permitted by law, our liability for any claim relating to the service is limited to the fees paid for the affected subscription in the preceding twelve months.`,
  },
  {
    title: "9. Governing law",
    body: `These terms are governed by the laws of India, without regard to conflict-of-law principles.`,
  },
  {
    title: "10. Changes to these terms",
    body: `We may update these terms as the platform evolves. Material changes will be reflected here with an updated date, and significant changes will be communicated to active Super Admin accounts.`,
  },
];

export default function TermsPage() {
  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <section className="pt-40 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">
              Legal
            </p>
            <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">
              Terms of Service
            </h1>
            <p className="mt-3 text-sm text-zinc-400">Last updated: August 2026</p>
            <p className="mt-6 text-zinc-500 leading-relaxed">
              These terms cover the use of Shikshaloy by schools and the people
              within them. They&apos;re written as a general baseline — schools with
              specific procurement or compliance requirements should have their
              legal counsel review a formal agreement against those needs.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 space-y-10">
          {sections.map((s) => (
            <FadeIn key={s.title}>
              <h2 className="text-lg font-semibold text-zinc-900 mb-2">{s.title}</h2>
              <p className="text-zinc-600 leading-relaxed">{s.body}</p>
            </FadeIn>
          ))}

          <FadeIn className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-2">Contact us</h2>
            <p className="text-zinc-600 leading-relaxed">
              Questions about these terms can be sent to{" "}
              <a href="mailto:support@shikshaloy.com" className="font-semibold text-primary-600 hover:text-primary-700">
                support@shikshaloy.com
              </a>{" "}
              or{" "}
              <a href="tel:+919932797131" className="font-semibold text-primary-600 hover:text-primary-700">
                +91 99327 97131
              </a>
              .
            </p>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
