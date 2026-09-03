"use client";

import { useState } from "react";
import {
  Palette,
  PanelTop,
  PanelBottom,
  LayoutList,
  GalleryHorizontal,
  Images,
  Globe,
  Eye,
} from "lucide-react";
import type { SiteSettings } from "@/lib/site-settings/types";
import type { DomainSummary, WebsiteActivityEntry } from "@/lib/site-settings/actions";
import { FancyButton } from "@/components/ui/fancy-button";
import { PublishStatus, PublishActions } from "./PublishBar";
import { ThemeSection } from "./sections/ThemeSection";
import { HeaderSection } from "./sections/HeaderSection";
import { FooterSection } from "./sections/FooterSection";
import { HomepageSectionsSection } from "./sections/HomepageSectionsSection";
import { GallerySection, type GalleryImage } from "./sections/GallerySection";
import { CarouselSection } from "./sections/CarouselSection";
import { DomainSection } from "./sections/DomainSection";
import type { SchoolBanner } from "@/lib/schools/banner-actions";
import { PageSchoolPicker } from "../../_components/page-school-picker";
import type { InstitutionSchool } from "@/lib/supabase/institution-context";

type SectionId = "theme" | "header" | "footer" | "homepage" | "carousel" | "gallery" | "domain";

const SECTION_IDS: SectionId[] = ["theme", "header", "footer", "homepage", "carousel", "gallery", "domain"];

const RAIL_ITEMS: { id: SectionId; label: string; icon: React.ElementType }[] = [
  { id: "theme", label: "Theme", icon: Palette },
  { id: "header", label: "Header", icon: PanelTop },
  { id: "footer", label: "Footer", icon: PanelBottom },
  { id: "homepage", label: "Homepage Sections", icon: LayoutList },
  { id: "carousel", label: "Carousel", icon: GalleryHorizontal },
  { id: "gallery", label: "Gallery", icon: Images },
  { id: "domain", label: "Domain", icon: Globe },
];

export function WebsiteEditorShell({
  initialDraft,
  published,
  publishedAt,
  initialGalleryImages,
  initialBanners,
  domain,
  activity,
  initialSection,
  schools = [],
  activeSchoolId = null,
}: {
  initialDraft: SiteSettings;
  published: SiteSettings | null;
  publishedAt: string | null;
  initialGalleryImages: GalleryImage[];
  initialBanners: SchoolBanner[];
  domain: DomainSummary | null;
  activity: WebsiteActivityEntry[];
  initialSection?: string;
  schools?: InstitutionSchool[];
  activeSchoolId?: string | null;
}) {
  const [activeSection, setActiveSection] = useState<SectionId>(
    SECTION_IDS.includes(initialSection as SectionId) ? (initialSection as SectionId) : "theme"
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const sectionKey = `${activeSection}-${refreshKey}`;

  return (
    <div className="w-full px-6 py-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Website</h1>
          <PublishStatus draft={initialDraft} published={published} publishedAt={publishedAt} />
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          {schools.length > 1 && (
            <PageSchoolPicker schools={schools} activeSchoolId={activeSchoolId} />
          )}
          <FancyButton href="/dashboard/website/preview" size="sm" variant="white">
            <Eye className="h-4 w-4" /> Live Preview
          </FancyButton>
          <PublishActions
            draft={initialDraft}
            published={published}
            onDiscarded={() => setRefreshKey((k) => k + 1)}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <nav className="flex shrink-0 gap-1 overflow-x-auto lg:w-56 lg:flex-col lg:overflow-visible">
          {RAIL_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                activeSection === id
                  ? "bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 font-semibold"
                  : "text-zinc-500 dark:text-zinc-400 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {activeSection === "theme" && <ThemeSection key={sectionKey} value={initialDraft.theme} />}
          {activeSection === "header" && <HeaderSection key={sectionKey} value={initialDraft.header} />}
          {activeSection === "footer" && <FooterSection key={sectionKey} value={initialDraft.footer} />}
          {activeSection === "homepage" && (
            <HomepageSectionsSection key={sectionKey} value={initialDraft.homepage} />
          )}
          {activeSection === "carousel" && (
            <CarouselSection key={sectionKey} initialBanners={initialBanners} />
          )}
          {activeSection === "gallery" && (
            <GallerySection key={sectionKey} initialData={initialGalleryImages} />
          )}
          {activeSection === "domain" && <DomainSection domain={domain} activity={activity} />}
        </div>
      </div>
    </div>
  );
}
