import { notFound } from "next/navigation";
import { getPublicSiteSchools } from "@/lib/domains/public-site-data";
import { resolveActiveSchool } from "../../_lib/resolve-active-school";
import { ContactForm } from "../../_components/ContactForm";

export default async function ContactPage({
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

  return <ContactForm ownerId={ownerId} schools={schools} activeSchool={activeSchool} />;
}
