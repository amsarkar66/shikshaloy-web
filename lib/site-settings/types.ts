export type HomepageSectionId =
  | "hero"
  | "stats"
  | "announcements"
  | "events"
  | "faculty"
  | "gallery"
  | "whyChooseUs";

export interface CarouselSlide {
  bannerId: string;
  caption: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
}

export interface SchoolCarousel {
  schoolId: string;
  slides: CarouselSlide[];
}

export interface SchoolGallerySelection {
  schoolId: string;
  imageIds: string[];
}

export interface SiteSettings {
  theme: {
    // Hex color, e.g. "#246150". `null` means "use the default brand color".
    primaryColor: string | null;
  };
  header: {
    showApplyCta: boolean;
    ctaLabel: string;
  };
  footer: {
    tagline: string | null;
    showQuickLinks: boolean;
  };
  homepage: {
    sections: { id: HomepageSectionId; visible: boolean }[];
  };
  carousel: SchoolCarousel[];
  gallery: SchoolGallerySelection[];
}

export const DEFAULT_HOMEPAGE_SECTIONS: { id: HomepageSectionId; visible: boolean }[] = [
  { id: "hero", visible: true },
  { id: "stats", visible: true },
  { id: "announcements", visible: true },
  { id: "events", visible: true },
  { id: "faculty", visible: true },
  { id: "gallery", visible: true },
  { id: "whyChooseUs", visible: true },
];

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  theme: { primaryColor: null },
  header: { showApplyCta: true, ctaLabel: "Apply Now" },
  footer: { tagline: null, showQuickLinks: true },
  homepage: { sections: DEFAULT_HOMEPAGE_SECTIONS },
  carousel: [],
  gallery: [],
};

// Merges a possibly-partial/older-shaped blob (e.g. `{}` on first read, or
// a draft saved before a new field was introduced) over the defaults, so
// every caller always gets a fully-shaped SiteSettings back.
export function normalizeSiteSettings(raw: unknown): SiteSettings {
  const value = (raw && typeof raw === "object" ? raw : {}) as Partial<SiteSettings>;
  return {
    theme: { ...DEFAULT_SITE_SETTINGS.theme, ...value.theme },
    header: { ...DEFAULT_SITE_SETTINGS.header, ...value.header },
    footer: { ...DEFAULT_SITE_SETTINGS.footer, ...value.footer },
    homepage: {
      sections:
        value.homepage?.sections && value.homepage.sections.length > 0
          ? value.homepage.sections
          : DEFAULT_HOMEPAGE_SECTIONS,
    },
    carousel: value.carousel ?? [],
    gallery: value.gallery ?? [],
  };
}
