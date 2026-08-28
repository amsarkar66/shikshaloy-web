import { notFound } from "next/navigation";
import { getAdmissionApplication } from "../_lib/get-application";
import { AdmissionDetail } from "../_components/AdmissionDetail";

export default async function AdmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getAdmissionApplication(id);
  if (!result) notFound();

  return (
    <AdmissionDetail
      app={result.app}
      documents={result.documents}
      schoolName={result.schoolName}
      schoolLogoUrl={result.schoolLogoUrl}
    />
  );
}
