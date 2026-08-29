import { notFound } from "next/navigation";
import { getPublicSiteSchools } from "@/lib/domains/public-site-data";
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

  return (
    <div>
      <Hero school={activeSchool} />
      <StatsStrip school={activeSchool} />

      <div className="mx-auto max-w-5xl px-6 py-16">
        <Announcements school={activeSchool} limit={3} bare />
      </div>

      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <Events school={activeSchool} limit={4} bare />
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-16">
        <FacultyGrid school={activeSchool} limit={4} bare />
      </div>

      <section className="bg-gray-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <GalleryGrid school={activeSchool} limit={8} bare />
        </div>
      </section>

      <WhyChooseUs />
    </div>
  );
}
