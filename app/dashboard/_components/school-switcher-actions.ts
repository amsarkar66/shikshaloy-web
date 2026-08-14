"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import { ACTIVE_SCHOOL_COOKIE } from "@/lib/supabase/school-context";

export async function setActiveSchool(schoolId: string): Promise<{ error?: string }> {
  const {
    data: { user },
  } = await getUser();
  if (!user || user.user_metadata?.role !== "super_admin") {
    return { error: "Unauthorized." };
  }

  const institutionId = await getCurrentInstitutionIdOrThrow();

  const { data: school } = await supabaseAdmin
    .from("schools")
    .select("id")
    .eq("id", schoolId)
    .eq("institution_id", institutionId)
    .maybeSingle();

  if (!school) {
    return { error: "That school isn't part of your institution." };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_SCHOOL_COOKIE, schoolId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/dashboard");
  return {};
}
