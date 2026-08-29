import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getPublicSiteSchools } from "@/lib/domains/public-site-data";
import { resolveActiveSchool } from "../../../_lib/resolve-active-school";
import { TeacherProfileCard } from "../../../_components/TeacherProfileCard";

export default async function TeacherProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ ownerId: string; facultyId: string }>;
  searchParams: Promise<{ school?: string }>;
}) {
  const { ownerId, facultyId } = await params;
  const { school: requestedSchoolId } = await searchParams;

  const schools = await getPublicSiteSchools(ownerId);
  if (schools.length === 0) notFound();
  const activeSchool = resolveActiveSchool(schools, requestedSchoolId);
  const teacher = activeSchool.faculty.find((f) => f.id === facultyId);

  if (!teacher) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="text-sm text-gray-500">We couldn&apos;t find that faculty profile.</p>
        <Link href="/faculty" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Faculty
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Link href="/faculty" className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-primary-600">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Faculty
      </Link>

      <TeacherProfileCard teacher={teacher} />
    </div>
  );
}
