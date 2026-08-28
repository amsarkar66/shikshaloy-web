import { notFound } from "next/navigation";
import { getAdmissionApplication } from "../../_lib/get-application";
import { EditAdmissionForm } from "../../_components/EditAdmissionForm";

export default async function EditAdmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getAdmissionApplication(id);
  if (!result) notFound();

  return <EditAdmissionForm app={result.app} />;
}
