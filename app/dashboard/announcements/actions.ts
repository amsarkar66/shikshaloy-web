"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { logAuditEvent } from "@/lib/audit/log";

export async function toggleAnnouncementPublic(id: string, isPublic: boolean): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as string | undefined;
  if (!user || (role !== "admin" && role !== "super_admin" && role !== "kernel")) {
    throw new Error("Unauthorized");
  }

  const { data: announcement, error } = await supabaseAdmin
    .from("announcements")
    .update({ is_public: isPublic })
    .eq("id", id)
    .select("school_id, title")
    .single();

  if (error) throw new Error("Failed to update announcement");

  await logAuditEvent({
    schoolId: announcement.school_id,
    action: "update",
    module: "Announcements",
    description: `${isPublic ? "Made public" : "Made internal"} — '${announcement.title}'`,
  });

  revalidatePath("/dashboard/announcements");
}
