export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.shikshaloy.com").replace(/\/$/, "");

export const SITE_NAME = "Shikshaloy";

export const DEFAULT_TITLE = "Shikshaloy — Modern School Management System";

export const DEFAULT_DESCRIPTION =
  "Shikshaloy is a complete school management platform for admissions, attendance, fees, exams, homework, and communication — with dedicated dashboards for admins, teachers, students, parents, staff, and drivers.";

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: DEFAULT_TITLE,
};

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/logo.svg"),
    email: "support@shikshaloy.com",
    telephone: "+91-99327-97131",
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+91-99327-97131",
        email: "support@shikshaloy.com",
        contactType: "customer support",
        areaServed: "IN",
        availableLanguage: ["English", "Hindi"],
      },
    ],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
