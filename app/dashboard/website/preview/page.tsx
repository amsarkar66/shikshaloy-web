import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PreviewFrame } from "./PreviewFrame";

export default async function WebsitePreviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as string | undefined;
  if (!user || role !== "super_admin") redirect("/dashboard");

  return <PreviewFrame />;
}
