"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { PLATFORM_AUDIENCE_LABEL } from "./constants";

async function requireKernel() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as string | undefined;
  if (!user || role !== "kernel") throw new Error("Unauthorized");
  return user;
}

export async function broadcastAnnouncement(formData: FormData): Promise<void> {
  await requireKernel();

  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string)?.trim();
  const priority = (formData.get("priority") as string) || "normal";
  const expiresAt = (formData.get("expiresAt") as string) || null;

  if (!title || !content) throw new Error("Title and content are required");

  const { data: schools } = await supabaseAdmin
    .from("schools")
    .select("id")
    .eq("status", "active");

  if (!schools || schools.length === 0) throw new Error("No active institutions to notify");

  const rows = schools.map((s) => ({
    school_id: s.id,
    title,
    content,
    priority,
    status: "active",
    audience: "all",
    audience_label: PLATFORM_AUDIENCE_LABEL,
    expires_at: expiresAt || null,
  }));

  const { error } = await supabaseAdmin.from("announcements").insert(rows);
  if (error) throw new Error(`Failed to broadcast: ${error.message}`);

  revalidatePath("/dashboard/platform-announcements");
}
