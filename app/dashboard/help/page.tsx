import { getUser } from "@/lib/supabase/server";
import { getMySupportRequests } from "@/lib/support/actions";
import HelpClient from "./_components/HelpClient";

export default async function HelpPage() {
  const {
    data: { user },
  } = await getUser();

  const initialRequests = user ? await getMySupportRequests() : [];

  return <HelpClient initialRequests={initialRequests} />;
}
