"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";

export async function toggleAnnouncementPublic(id: string, isPublic: boolean): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as string | undefined;
  if (!user || (role !== "admin" && role !== "super_admin" && role !== "kernel")) {
    throw new Error("Unauthorized");
  }

  const { error } = await supabaseAdmin
    .from("announcements")
    .update({ is_public: isPublic })
    .eq("id", id);

  if (error) throw new Error("Failed to update announcement");

  revalidatePath("/dashboard/announcements");
}
