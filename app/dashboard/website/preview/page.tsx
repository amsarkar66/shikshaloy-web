import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { PreviewFrame } from "./PreviewFrame";

export default async function WebsitePreviewPage() {
  const verifiedUser = await getVerifiedUser();

  if (!verifiedUser || verifiedUser.role !== "super_admin") redirect("/dashboard");

  return <PreviewFrame />;
}
