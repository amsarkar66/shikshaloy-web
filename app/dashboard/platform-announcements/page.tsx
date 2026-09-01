import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import PlatformAnnouncementsClient, { type PlatformBroadcast } from "./_components/PlatformAnnouncementsClient";
import { PLATFORM_AUDIENCE_LABEL } from "./constants";

export const dynamic = "force-dynamic";

export default async function PlatformAnnouncementsPage() {
  const vu = await getVerifiedUser();
  if (!vu) redirect("/login");
  if (vu.role !== "kernel") redirect("/dashboard");

  const { data } = await supabaseAdmin
    .from("announcements")
    .select("id, title, content, priority, expires_at, created_at")
    .eq("audience_label", PLATFORM_AUDIENCE_LABEL)
    .order("created_at", { ascending: false });

  // Broadcasting fans out one row per institution — collapse rows that share
  // a title+content into a single history entry with a reach count.
  const byBatch = new Map<string, PlatformBroadcast>();
  for (const a of data ?? []) {
    const key = `${a.title}|||${a.content}|||${a.created_at}`;
    const existing = byBatch.get(key);
    if (existing) {
      existing.reach += 1;
    } else {
      byBatch.set(key, {
        id: a.id,
        title: a.title,
        content: a.content,
        priority: a.priority ?? "normal",
        expiresAt: a.expires_at,
        createdAt: a.created_at,
        reach: 1,
      });
    }
  }

  const broadcasts = [...byBatch.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return <PlatformAnnouncementsClient broadcasts={broadcasts} />;
}
