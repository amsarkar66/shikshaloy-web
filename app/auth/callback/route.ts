import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // OAuth sign-ins (Google, etc.) never carry role/status in
      // user_metadata the way our own signUp() calls do — Supabase
      // populates it straight from the provider's profile. Every gate in
      // the app (middleware, dashboard layout, onboarding page) reads
      // user_metadata.role, so a brand-new OAuth user with no role skips
      // the onboarding redirect entirely and lands straight on the
      // dashboard. `profiles` always gets the right default via the
      // handle_new_user trigger, so mirror it into user_metadata here.
      if (!data.user.user_metadata?.role) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("role, status, school_id")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profile) {
          await supabase.auth.updateUser({
            data: {
              role: profile.role,
              status: profile.status,
              school_id: profile.school_id ?? undefined,
            },
          });
        }
      }

      redirect("/dashboard");
    }
  }

  redirect("/login?error=confirm_failed");
}
