import { getUser } from "@/lib/supabase/server";
import HelpClient from "./_components/HelpClient";

export default async function HelpPage() {
  const {
    data: { user },
  } = await getUser();

  return <HelpClient userEmail={user?.email ?? ""} />;
}
