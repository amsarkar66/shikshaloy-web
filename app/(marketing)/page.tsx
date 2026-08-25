import type { Metadata } from "next";
import { HeroSection } from "@/components/marketing/hero-section";
import { ProblemSolutionSection } from "@/components/marketing/problem-solution-section";
import { FeatureShowcaseSection } from "@/components/marketing/feature-showcase-section";
import { RolesTabsSection } from "@/components/marketing/roles-tabs-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { MobileAppSection } from "@/components/marketing/mobile-app-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { CtaSection } from "@/components/marketing/cta-section";
import { DEFAULT_TITLE, DEFAULT_DESCRIPTION, absoluteUrl, OG_IMAGE } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: DEFAULT_TITLE },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "school management system",
    "school ERP software",
    "school management software India",
    "student attendance software",
    "fee management system for schools",
    "admission management software",
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
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  url: absoluteUrl("/"),
  description: DEFAULT_DESCRIPTION,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "INR",
    description: "Free plan for a single school with up to 50 students",
  },
};

export default function HomePage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
      />
      <HeroSection />
      <ProblemSolutionSection />
      <FeatureShowcaseSection />
      <RolesTabsSection />
      <HowItWorksSection />
      <MobileAppSection />
      <PricingSection />
      <CtaSection />
    </main>
  );
}
