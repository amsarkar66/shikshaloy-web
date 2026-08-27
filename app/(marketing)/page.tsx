import type { Metadata } from "next";
import { HeroSection } from "@/components/marketing/hero-section";
import { ProblemSolutionSection } from "@/components/marketing/problem-solution-section";
import { FeatureShowcaseSection } from "@/components/marketing/feature-showcase-section";
import { RolesTabsSection } from "@/components/marketing/roles-tabs-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { MobileAppSection } from "@/components/marketing/mobile-app-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { DEFAULT_TITLE, DEFAULT_DESCRIPTION, absoluteUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: DEFAULT_TITLE },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "best school management system",
    "modern school management system",
    "school management system",
    "school management software",
    "school app",
    "school ERP software",
    "school management software India",
    "student attendance software",
    "fee management system for schools",
    "admission management software",
    "Shikshaloy",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: "/",
    images: [OG_IMAGE],
  },
};

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Shikshaloy",
  alternateName: "Shikshaloy School Management System",
  applicationCategory: "EducationalApplication",
  applicationSubCategory: "School Management System",
  operatingSystem: "Web, Android",
  url: absoluteUrl("/"),
  description: DEFAULT_DESCRIPTION,
  featureList: [
    "Admissions & front desk",
    "Attendance tracking",
    "Fee management & payroll",
    "Exams & grading",
    "Homework & assignments",
    "Timetable & academic calendar",
    "Transport & routes",
    "Library & hostel management",
    "Parent-teacher communication",
    "Role-based dashboards for admins, teachers, students, parents, staff, and drivers",
  ],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
    description: "Free plan for a single school with up to 50 students",
  },
};

const FAQ = [
  {
    q: "What is the best school management system for schools in India?",
    a: "Shikshaloy is a modern, all-in-one school management system built for Indian schools — it covers admissions, attendance, fees, exams, homework, transport, and communication in one platform, with dedicated dashboards for every role instead of stitched-together spreadsheets and apps.",
  },
  {
    q: "What is Shikshaloy?",
    a: "Shikshaloy is a school management software and school app that replaces spreadsheets, WhatsApp groups, and paper registers with one connected system — used by admins, teachers, students, parents, staff, and drivers, each with their own dashboard.",
  },
  {
    q: "Is there a school app for parents and teachers?",
    a: "Yes. Shikshaloy has a dedicated Android app on the Play Store alongside the web dashboard, so parents and teachers can check attendance, homework, fees, and announcements from their phone.",
  },
  {
    q: "Is Shikshaloy free to use?",
    a: "Yes. Shikshaloy has a free plan for a single school with up to 50 students, with no setup fee — you can upgrade to a paid plan as your school grows.",
  },
  {
    q: "How is Shikshaloy different from other school ERP software?",
    a: "Shikshaloy ships as one system with 7 role-based dashboards (super admin, admin, teacher, staff, student, parent, driver) rather than a single admin console — plus a live demo you can try instantly with no signup.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export default function HomePage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <HeroSection />
      <ProblemSolutionSection />
      <FeatureShowcaseSection />
      <RolesTabsSection />
      <HowItWorksSection />
      <MobileAppSection />
      <PricingSection />

      <section id="faq" className="scroll-mt-24 py-24 sm:py-32 border-t border-zinc-100 bg-zinc-50/60">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FaqAccordion
            badge="Frequently asked"
            heading="Everything schools ask before switching"
            subtext="Quick answers about what Shikshaloy is, what it costs, and how it compares."
            items={FAQ}
          />
        </div>
      </section>

      <CtaSection />
    </main>
  );
}
