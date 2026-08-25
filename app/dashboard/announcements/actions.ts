"use server";

import { revalidatePath } from "next/cache";
import DOMPurify from "isomorphic-dompurify";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { logAuditEvent } from "@/lib/audit/log";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { stripHtml, type Audience, type Priority, type Status } from "./_data/announcements";

const CONTENT_ALLOWED_TAGS = ["p", "br", "strong", "em", "ul", "ol", "li", "blockquote"];

const AUDIENCE_LABEL: Record<Audience, string> = {
  all: "Everyone",
  students: "All Students",
  staff: "All Staff",
  parents: "All Parents",
  class: "Specific Class",
};

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as string | undefined;
  if (!user || (role !== "admin" && role !== "super_admin" && role !== "kernel")) {
    throw new Error("Unauthorized");
  }
  return user;
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
}

export async function createAnnouncement(input: CreateAnnouncementInput): Promise<void> {
  const user = await requireAdmin();
  const sanitizedContent = DOMPurify.sanitize(input.content, { ALLOWED_TAGS: CONTENT_ALLOWED_TAGS });

  if (!input.title.trim() || !stripHtml(sanitizedContent)) {
    throw new Error("Title and content are required");
  }
  if (input.audience === "class" && !input.targetSectionId) {
    throw new Error("Please choose a class/section");
  }

  const schoolId = await getCurrentSchoolIdOrThrow();
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

  const schoolId = await getCurrentSchoolIdOrThrow();
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
  const schoolId = await getCurrentSchoolIdOrThrow();

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
  const schoolId = await getCurrentSchoolIdOrThrow();

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
  const schoolId = await getCurrentSchoolIdOrThrow();

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
