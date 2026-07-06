import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import AnnouncementsClient from "./_components/AnnouncementsClient";
import type { Announcement } from "./_components/AnnouncementsClient";

export default async function AnnouncementsPage() {
  const { data } = await supabaseAdmin
    .from("announcements")
    .select("id, title, content, priority, audience, audience_label, status, views, expires_at, created_at")
    .eq("school_id", DEMO_SCHOOL_ID)
    .order("created_at", { ascending: false });

  const announcements: Announcement[] = (data ?? []).map((a: any) => ({
    id: a.id,
    title: a.title,
    content: a.content ?? "",
    priority: a.priority ?? "normal",
    audience: a.audience ?? "all",
    audienceLabel: a.audience_label ?? "Everyone",
    status: a.status ?? "draft",
    views: a.views ?? 0,
    date: (a.created_at ?? "").slice(0, 10),
    postedBy: "—",
    expiresAt: a.expires_at ?? undefined,
  }));

  return <AnnouncementsClient initialData={announcements} />;
}
