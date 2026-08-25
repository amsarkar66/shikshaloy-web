import type { Metadata } from "next";
import { HeroSection } from "@/components/marketing/hero-section";
import { StatsSection } from "@/components/marketing/stats-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { RolesSection } from "@/components/marketing/roles-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { MobileAppSection } from "@/components/marketing/mobile-app-section";
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
      <StatsSection />
      <FeaturesSection />
      <RolesSection />
      <PricingSection />
      <HowItWorksSection />
      <MobileAppSection />
      <CtaSection />
    </main>
  );
}
