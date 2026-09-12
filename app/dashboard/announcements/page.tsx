import { supabaseAdmin } from "@/lib/supabase/service";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentInstitutionIdOrThrow, getInstitutionSchools, type InstitutionSchool } from "@/lib/supabase/institution-context";
import { getSectionsForSchool } from "./actions";
import AnnouncementsClient from "./_components/AnnouncementsClient";
import type { Announcement } from "./_components/AnnouncementsClient";

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
  school_id: string;
  poster: { full_name: string | null } | null;
}

const ANNOUNCEMENT_SELECT = `
  id, title, content, priority, audience, audience_label, target_section_id,
  status, views, expires_at, created_at, is_public, school_id,
  poster:posted_by ( full_name )
`;

function toAnnouncement(a: AnnouncementRow, schoolNameById?: Map<string, string>): Announcement {
  return {
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
    schoolId: schoolNameById ? a.school_id : undefined,
    schoolName: schoolNameById ? (schoolNameById.get(a.school_id) ?? "—") : undefined,
  };
}

export default async function AnnouncementsPage() {
  const vu = await getVerifiedUser();

  // super_admin sees announcements combined across every school in the
  // institution instead of being scoped to one "active" school — the
  // school is picked per-announcement in the compose modal instead.
  if (vu?.role === "super_admin") {
    const institutionId = await getCurrentInstitutionIdOrThrow();
    const schools: InstitutionSchool[] = await getInstitutionSchools(institutionId);
    const schoolIds = schools.map((s) => s.id);
    const schoolNameById = new Map(schools.map((s) => [s.id, s.name]));

    if (schoolIds.length === 0) {
      return <AnnouncementsClient initialData={[]} sections={[]} schools={[]} defaultSchoolId="" />;
    }

    const defaultSchoolId = await getCurrentSchoolIdOrThrow();

    const [{ data }, sections] = await Promise.all([
      supabaseAdmin
        .from("announcements")
        .select(ANNOUNCEMENT_SELECT)
        .in("school_id", schoolIds)
        .order("created_at", { ascending: false }),
      getSectionsForSchool(defaultSchoolId),
    ]);

    const announcements = ((data ?? []) as unknown as AnnouncementRow[]).map((a) => toAnnouncement(a, schoolNameById));

    return (
      <AnnouncementsClient
        initialData={announcements}
        sections={sections}
        schools={schools}
        defaultSchoolId={defaultSchoolId}
      />
    );
  }

  const schoolId = await getCurrentSchoolIdOrThrow();

  const [{ data }, sections] = await Promise.all([
    supabaseAdmin
      .from("announcements")
      .select(ANNOUNCEMENT_SELECT)
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false }),
    getSectionsForSchool(schoolId),
  ]);

  const announcements = ((data ?? []) as unknown as AnnouncementRow[]).map((a) => toAnnouncement(a));

  return <AnnouncementsClient initialData={announcements} sections={sections} schools={[]} defaultSchoolId={schoolId} />;
}
