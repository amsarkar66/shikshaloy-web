import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsPageClient } from "./_components/settings-client";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = (user.user_metadata?.role as string) ?? "";

  return <SettingsPageClient role={role} />;
}
