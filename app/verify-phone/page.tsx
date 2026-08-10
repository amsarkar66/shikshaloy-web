import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { VerifyPhoneClient } from "./_verify-phone-client";

export default async function VerifyPhonePage() {
  const {
    data: { user },
  } = await getUser();
  if (!user) redirect("/login");

  const role = user.user_metadata?.role as string | undefined;
  if (role !== "super_admin") redirect("/dashboard");
  if (user.phone_confirmed_at) redirect("/onboarding");

  return <VerifyPhoneClient defaultPhone={(user.user_metadata?.phone as string) ?? ""} />;
}
