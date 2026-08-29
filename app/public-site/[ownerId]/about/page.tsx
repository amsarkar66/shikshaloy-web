import { notFound } from "next/navigation";
import { getPublicSiteSchools } from "@/lib/domains/public-site-data";
import { resolveActiveSchool } from "../../_lib/resolve-active-school";
import { About } from "../../_components/About";
import { WhyChooseUs } from "../../_components/WhyChooseUs";

export default async function AboutPage({
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
      <About school={activeSchool} />
      <WhyChooseUs />
    </div>
  );
}
