import { supabaseAdmin } from "@/lib/supabase/service";

interface NotifyBase {
  schoolId: string;
  title: string;
  description?: string;
  link?: string;
  excludeProfileId?: string;
}

// Best-effort — failures here must never block the action that triggered them.
export async function notifyRoles(input: NotifyBase & { roles: string[] }): Promise<void> {
  try {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("school_id", input.schoolId)
      .in("role", input.roles);

    const rows = (profiles ?? [])
      .filter((p) => p.id !== input.excludeProfileId)
      .map((p) => ({
        school_id: input.schoolId,
        recipient_id: p.id,
        title: input.title,
        description: input.description ?? "",
        link: input.link ?? null,
      }));

    if (rows.length === 0) return;
    await supabaseAdmin.from("notifications").insert(rows);
  } catch {
    // swallow — notification failures shouldn't surface to the end user
  }
}

export async function notifyProfile(input: NotifyBase & { profileId: string }): Promise<void> {
  try {
    if (input.profileId === input.excludeProfileId) return;
    await supabaseAdmin.from("notifications").insert({
      school_id: input.schoolId,
      recipient_id: input.profileId,
      title: input.title,
      description: input.description ?? "",
      link: input.link ?? null,
    });
  } catch {
    // swallow
  }
}
