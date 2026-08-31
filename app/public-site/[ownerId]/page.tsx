import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import { getPublicSiteSchools } from "@/lib/domains/public-site-data";
import { getDraftSiteSettings, getPublishedSiteSettings } from "@/lib/site-settings/public";
import type { HomepageSectionId } from "@/lib/site-settings/types";
import { resolveActiveSchool } from "../_lib/resolve-active-school";
import { Hero } from "../_components/Hero";
import { StatsStrip } from "../_components/StatsStrip";
import { WhyChooseUs } from "../_components/WhyChooseUs";
import { Announcements } from "../_components/Announcements";
import { Events } from "../_components/Events";
import { FacultyGrid } from "../_components/FacultyGrid";
import { GalleryGrid } from "../_components/GalleryGrid";

export default async function PublicSiteHomePage({
  params,
  searchParams,
}: {
  params: Promise<{ ownerId: string }>;
  searchParams: Promise<{ school?: string }>;
}) {
  const { ownerId } = await params;
  const { school: requestedSchoolId } = await searchParams;

  const schools = await getPublicSiteSchools(ownerId);
  if (schools.length === 0) notFound();
  const activeSchool = resolveActiveSchool(schools, requestedSchoolId);

  const { isEnabled: isPreview } = await draftMode();
  const settings = isPreview ? await getDraftSiteSettings(ownerId) : await getPublishedSiteSettings(ownerId);
  const visible = new Set(settings.homepage.sections.filter((s) => s.visible).map((s) => s.id));
  const order = settings.homepage.sections.map((s) => s.id);

  const sections: Record<HomepageSectionId, React.ReactNode> = {
    hero: <Hero key="hero" school={activeSchool} />,
    stats: <StatsStrip key="stats" school={activeSchool} />,
    announcements: (
      <div key="announcements" className="mx-auto max-w-5xl px-6 py-16">
        <Announcements school={activeSchool} limit={3} bare />
      </div>
    ),
    events: (
      <section key="events" className="bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <Events school={activeSchool} limit={4} bare />
        </div>
      </section>
    ),
    faculty: (
      <div key="faculty" className="mx-auto max-w-5xl px-6 py-16">
        <FacultyGrid school={activeSchool} limit={4} bare />
      </div>
    ),
    gallery: (
      <section key="gallery" className="bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <GalleryGrid school={activeSchool} limit={8} bare />
        </div>
      </section>
    ),
    whyChooseUs: <WhyChooseUs key="whyChooseUs" />,
  };

  return <div>{order.filter((id) => visible.has(id)).map((id) => sections[id])}</div>;
}
