import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import AnnouncementsClient from "./_components/AnnouncementsClient";
import type { Announcement } from "./_components/AnnouncementsClient";
import type { SectionOption } from "./_data/announcements";

interface AnnouncementRow {
  id: string;
  title: string;
  content: string | null;
  priority: Announcement["priority"] | null;
  audience: Announcement["audience"] | null;
  audience_label: string | null;
  target_section_id: string | null;
  status: Announcement["status"] | null;
  views: number | null;
  expires_at: string | null;
  created_at: string | null;
  is_public: boolean | null;
  poster: { full_name: string | null } | null;
}

interface SectionRow {
  id: string;
  name: string | null;
  grades: { level: number | null } | null;
}

export default async function AnnouncementsPage() {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const [{ data }, { data: sectionRows }] = await Promise.all([
    supabaseAdmin
      .from("announcements")
      .select(`
        id, title, content, priority, audience, audience_label, target_section_id,
        status, views, expires_at, created_at, is_public,
        poster:posted_by ( full_name )
      `)
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false }),

    supabaseAdmin
      .from("sections")
      .select("id, name, grades ( level )")
      .eq("school_id", schoolId)
      .eq("academic_year_id", academicYearId)
      .order("name"),
  ]);

  const announcements: Announcement[] = ((data ?? []) as unknown as AnnouncementRow[]).map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content ?? "",
    priority: a.priority ?? "normal",
    audience: a.audience ?? "all",
    audienceLabel: a.audience_label ?? "Everyone",
    targetSectionId: a.target_section_id ?? undefined,
    status: a.status ?? "draft",
    views: a.views ?? 0,
    date: (a.created_at ?? "").slice(0, 10),
    postedBy: a.poster?.full_name ?? "—",
    expiresAt: a.expires_at ?? undefined,
    isPublic: a.is_public ?? false,
  }));

  const sections: SectionOption[] = ((sectionRows ?? []) as unknown as SectionRow[])
    .map((s) => ({ id: s.id, name: s.name ?? "", gradeLevel: s.grades?.level ?? 0 }))
    .sort((a, b) => a.gradeLevel - b.gradeLevel || a.name.localeCompare(b.name));

  return <AnnouncementsClient initialData={announcements} sections={sections} />;
}
