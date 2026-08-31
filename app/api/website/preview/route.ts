import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Enables Next.js Draft Mode for the current browser, then redirects into
// the real public-site route for the owner's institution. Everything past
// this point reuses the actual public-site pages/components (see the
// draftMode() branches in app/public-site/[ownerId]/layout.tsx + page.tsx)
// so the preview can never drift from what visitors will actually see.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as string | undefined;
  if (!user || role !== "super_admin") redirect("/dashboard");

  // institutions.owner_id = auth.uid() for the super_admin who owns it —
  // no extra lookup needed (see lib/supabase/institution-context.ts).
  (await draftMode()).enable();
  redirect(`/public-site/${user.id}`);
}
