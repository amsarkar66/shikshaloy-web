"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";
import { requireRole } from "@/lib/auth/verified-role";
import type { EventType, AudienceType } from "./_data/events";

export interface CreateEventInput {
  title: string;
  type: EventType;
  date: string;
  endDate?: string | null;
  time?: string | null;
  endTime?: string | null;
  isAllDay: boolean;
  location?: string | null;
  description?: string | null;
  audience: AudienceType[];
  isPublic: boolean;
}

export async function createEvent(input: CreateEventInput): Promise<void> {
  await requireRole(["admin", "super_admin"]);

  if (!input.title.trim()) throw new Error("Event title is required");
  if (!input.date) throw new Error("Event date is required");

  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();

  const { data: event, error } = await supabaseAdmin
    .from("school_events")
    .insert({
      school_id: schoolId,
      academic_year_id: academicYearId,
      title: input.title.trim(),
      type: input.type,
      date: input.date,
      end_date: input.endDate || null,
      time: input.isAllDay ? null : input.time || null,
      end_time: input.isAllDay ? null : input.endTime || null,
      location: input.location?.trim() || null,
      description: input.description?.trim() || null,
      is_all_day: input.isAllDay,
      is_public: input.isPublic,
    })
    .select("id")
    .single();

  if (error || !event) throw new Error(error?.message ?? "Failed to create event");

  const audiences = input.audience.length ? input.audience : (["all"] as AudienceType[]);
  const { error: audienceError } = await supabaseAdmin
    .from("event_audiences")
    .insert(audiences.map((audience_type) => ({ event_id: event.id, audience_type })));

  if (audienceError) throw new Error(`Event created, but failed to set audience: ${audienceError.message}`);

  revalidatePath("/dashboard/events");
}

export async function toggleEventPublic(id: string, isPublic: boolean): Promise<void> {
  await requireRole(["admin", "super_admin", "kernel"]);

  const { error } = await supabaseAdmin
    .from("school_events")
    .update({ is_public: isPublic })
    .eq("id", id);

  if (error) throw new Error("Failed to update event");

  revalidatePath("/dashboard/events");
}
