"use server";

import { revalidatePath } from "next/cache";
import DOMPurify from "isomorphic-dompurify";
import { supabaseAdmin } from "@/lib/supabase/service";
import { logAuditEvent } from "@/lib/audit/log";
import { getVerifiedUser, requireRole } from "@/lib/auth/verified-role";
import { assertAuthorizedSchool, resolveAuthorizedSchoolId } from "@/lib/supabase/authorized-school";
import { stripHtml, type Audience, type Priority, type Status, type SectionOption } from "./_data/announcements";

const CONTENT_ALLOWED_TAGS = ["p", "br", "strong", "em", "ul", "ol", "li", "blockquote"];

const AUDIENCE_LABEL: Record<Audience, string> = {
  all: "Everyone",
  students: "All Students",
  staff: "All Staff",
  parents: "All Parents",
  class: "Specific Class",
};

async function requireAdmin() {
  return requireRole(["admin", "super_admin", "kernel"]);
}

async function resolveAudienceLabel(schoolId: string, audience: Audience, targetSectionId?: string | null): Promise<string> {
  if (audience !== "class" || !targetSectionId) return AUDIENCE_LABEL[audience];

  const { data: section } = await supabaseAdmin
    .from("sections")
    .select("name, grades ( level )")
    .eq("id", targetSectionId)
    .eq("school_id", schoolId)
    .maybeSingle();

  const gradeLevel = (section as unknown as { grades: { level: number } | null } | null)?.grades?.level;
  return section ? `Class ${gradeLevel ?? "?"}-${section.name}` : AUDIENCE_LABEL.class;
}

// Sections are per-school (and per academic year), so the "Specific Class"
// audience picker in the compose modal needs to reload this whenever the
// target school changes — used both for the page's initial default school
// and, client-side, whenever a super_admin picks a different one.
export async function getSectionsForSchool(schoolId: string): Promise<SectionOption[]> {
  await requireAdmin();
  const vu = await getVerifiedUser();
  if (!vu) throw new Error("Unauthorized");
  await assertAuthorizedSchool(vu, schoolId);

  const { data: yearRow } = await supabaseAdmin
    .from("academic_years")
    .select("id")
    .eq("school_id", schoolId)
    .eq("is_current", true)
    .maybeSingle();
  if (!yearRow) return [];

  const { data: sectionRows } = await supabaseAdmin
    .from("sections")
    .select("id, name, grades ( level )")
    .eq("school_id", schoolId)
    .eq("academic_year_id", yearRow.id)
    .order("name");

  return ((sectionRows ?? []) as unknown as { id: string; name: string | null; grades: { level: number | null } | null }[])
    .map((s) => ({ id: s.id, name: s.name ?? "", gradeLevel: s.grades?.level ?? 0 }))
    .sort((a, b) => a.gradeLevel - b.gradeLevel || a.name.localeCompare(b.name));
}

export interface AnnouncementFormInput {
  title: string;
  content: string;
  priority: Priority;
  audience: Audience;
  targetSectionId?: string | null;
  expiresAt?: string | null;
}

export interface CreateAnnouncementInput extends AnnouncementFormInput {
  status: "active" | "draft";
  schoolId: string;
}

export async function createAnnouncement(input: CreateAnnouncementInput): Promise<void> {
  const user = await requireAdmin();
  const vu = await getVerifiedUser();
  if (!vu) throw new Error("Unauthorized");
  await assertAuthorizedSchool(vu, input.schoolId);

  const sanitizedContent = DOMPurify.sanitize(input.content, { ALLOWED_TAGS: CONTENT_ALLOWED_TAGS });

  if (!input.title.trim() || !stripHtml(sanitizedContent)) {
    throw new Error("Title and content are required");
  }
  if (input.audience === "class" && !input.targetSectionId) {
    throw new Error("Please choose a class/section");
  }

  const schoolId = input.schoolId;
  const audienceLabel = await resolveAudienceLabel(schoolId, input.audience, input.targetSectionId);

  const { error } = await supabaseAdmin.from("announcements").insert({
    school_id: schoolId,
    title: input.title.trim(),
    content: sanitizedContent,
    priority: input.priority,
    status: input.status,
    audience: input.audience,
    audience_label: audienceLabel,
    target_section_id: input.audience === "class" ? input.targetSectionId : null,
    expires_at: input.expiresAt || null,
    posted_by: user.id,
  });

  if (error) throw new Error("Failed to create announcement");

  await logAuditEvent({
    schoolId,
    action: "create",
    module: "Announcements",
    description: `${input.status === "active" ? "Published" : "Drafted"} — '${input.title.trim()}'`,
  });

  revalidatePath("/dashboard/announcements");
}

export async function updateAnnouncement(id: string, input: AnnouncementFormInput): Promise<void> {
  await requireAdmin();
  const sanitizedContent = DOMPurify.sanitize(input.content, { ALLOWED_TAGS: CONTENT_ALLOWED_TAGS });

  if (!input.title.trim() || !stripHtml(sanitizedContent)) {
    throw new Error("Title and content are required");
  }
  if (input.audience === "class" && !input.targetSectionId) {
    throw new Error("Please choose a class/section");
  }

  const schoolId = await resolveAuthorizedSchoolId("announcements", id);
  const audienceLabel = await resolveAudienceLabel(schoolId, input.audience, input.targetSectionId);

  const { data: announcement, error } = await supabaseAdmin
    .from("announcements")
    .update({
      title: input.title.trim(),
      content: sanitizedContent,
      priority: input.priority,
      audience: input.audience,
      audience_label: audienceLabel,
      target_section_id: input.audience === "class" ? input.targetSectionId : null,
      expires_at: input.expiresAt || null,
    })
    .eq("id", id)
    .eq("school_id", schoolId)
    .select("title")
    .single();

  if (error) throw new Error("Failed to update announcement");

  await logAuditEvent({
    schoolId,
    action: "update",
    module: "Announcements",
    description: `Edited — '${announcement.title}'`,
  });

  revalidatePath("/dashboard/announcements");
}

export async function setAnnouncementStatus(id: string, status: Status): Promise<void> {
  await requireAdmin();
  const schoolId = await resolveAuthorizedSchoolId("announcements", id);

  const { data: announcement, error } = await supabaseAdmin
    .from("announcements")
    .update({ status })
    .eq("id", id)
    .eq("school_id", schoolId)
    .select("title")
    .single();

  if (error) throw new Error("Failed to update announcement");

  const verb = status === "active" ? "Published" : status === "archived" ? "Archived" : "Moved to draft";
  await logAuditEvent({
    schoolId,
    action: "update",
    module: "Announcements",
    description: `${verb} — '${announcement.title}'`,
  });

  revalidatePath("/dashboard/announcements");
}

export async function deleteAnnouncement(id: string): Promise<void> {
  await requireAdmin();
  const schoolId = await resolveAuthorizedSchoolId("announcements", id);

  const { data: announcement, error } = await supabaseAdmin
    .from("announcements")
    .delete()
    .eq("id", id)
    .eq("school_id", schoolId)
    .select("title")
    .single();

  if (error) throw new Error("Failed to delete announcement");

  await logAuditEvent({
    schoolId,
    action: "delete",
    module: "Announcements",
    description: `Deleted — '${announcement.title}'`,
  });

  revalidatePath("/dashboard/announcements");
}

export async function toggleAnnouncementPublic(id: string, isPublic: boolean): Promise<void> {
  await requireAdmin();
  const schoolId = await resolveAuthorizedSchoolId("announcements", id);

  const { data: announcement, error } = await supabaseAdmin
    .from("announcements")
    .update({ is_public: isPublic })
    .eq("id", id)
    .eq("school_id", schoolId)
    .select("title")
    .single();

  if (error) throw new Error("Failed to update announcement");

  await logAuditEvent({
    schoolId,
    action: "update",
    module: "Announcements",
    description: `${isPublic ? "Made public" : "Made internal"} — '${announcement.title}'`,
  });

  revalidatePath("/dashboard/announcements");
}
