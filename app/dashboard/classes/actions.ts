"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getCurrentAcademicYearId } from "@/lib/supabase/academic-year";

export interface CreateSectionInput {
  classNum:      string;
  section:       string;
  room?:         string | null;
  capacity?:     number | null;
  classTeacherId?: string | null;
  streamId?:     string | null;
  newStreamName?: string | null;
}

async function findOrCreateGrade(schoolId: string, level: number) {
  const { data: existing } = await supabaseAdmin
    .from("grades")
    .select("id")
    .eq("school_id", schoolId)
    .eq("level", level)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabaseAdmin
    .from("grades")
    .insert({ school_id: schoolId, name: `Class ${level}`, level })
    .select("id")
    .single();

  if (error || !created) throw new Error(error?.message ?? "Failed to create class.");
  return created.id;
}

async function resolveStreamId(schoolId: string, streamId?: string | null, newStreamName?: string | null): Promise<string | null> {
  const name = newStreamName?.trim();
  if (!name) return streamId || null;

  const { data: existing } = await supabaseAdmin
    .from("streams")
    .select("id")
    .eq("school_id", schoolId)
    .eq("name", name)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabaseAdmin
    .from("streams")
    .insert({ school_id: schoolId, name })
    .select("id")
    .single();

  if (error || !created) throw new Error(error?.message ?? "Failed to create stream.");
  return created.id;
}

export async function createSection(input: CreateSectionInput): Promise<{ id: string }> {
  const level = Number(input.classNum);
  const sectionName = input.section.trim();

  if (!Number.isFinite(level) || level <= 0) throw new Error("Enter a valid class number.");
  if (!sectionName) throw new Error("Section name is required.");

  const schoolId = await getCurrentSchoolIdOrThrow();
  const academicYearId = await getCurrentAcademicYearId();
  const gradeId = await findOrCreateGrade(schoolId, level);
  const streamId = await resolveStreamId(schoolId, input.streamId, input.newStreamName);

  const { data, error } = await supabaseAdmin
    .from("sections")
    .insert({
      school_id: schoolId,
      grade_id: gradeId,
      academic_year_id: academicYearId,
      name: sectionName,
      room: input.room?.trim() || null,
      capacity: input.capacity && input.capacity > 0 ? input.capacity : 40,
      class_teacher_id: input.classTeacherId || null,
      stream_id: streamId,
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error(`Section ${level}-${sectionName} already exists.`);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/classes");
  return { id: data.id };
}

export interface CreateClassInput {
  classNum:       string;
  room?:          string | null;
  capacity?:      number | null;
  classTeacherId?: string | null;
}

const DEFAULT_SECTION_NAME = "A";

export async function createClass(input: CreateClassInput): Promise<{ id: string }> {
  return createSection({
    classNum:       input.classNum,
    section:        DEFAULT_SECTION_NAME,
    room:           input.room,
    capacity:       input.capacity,
    classTeacherId: input.classTeacherId,
  });
}

export interface UpdateSectionInput {
  id:              string;
  classNum:        string;
  section:         string;
  room?:           string | null;
  capacity?:       number | null;
  classTeacherId?: string | null;
  streamId?:       string | null;
  newStreamName?:  string | null;
  status:          "active" | "inactive";
}

export async function updateSection(input: UpdateSectionInput): Promise<void> {
  const level = Number(input.classNum);
  const sectionName = input.section.trim();

  if (!Number.isFinite(level) || level <= 0) throw new Error("Enter a valid class number.");
  if (!sectionName) throw new Error("Section name is required.");

  const schoolId = await getCurrentSchoolIdOrThrow();
  const gradeId = await findOrCreateGrade(schoolId, level);
  const streamId = await resolveStreamId(schoolId, input.streamId, input.newStreamName);

  const { error } = await supabaseAdmin
    .from("sections")
    .update({
      grade_id: gradeId,
      name: sectionName,
      stream_id: streamId,
      room: input.room?.trim() || null,
      capacity: input.capacity && input.capacity > 0 ? input.capacity : 40,
      class_teacher_id: input.classTeacherId || null,
      status: input.status,
    })
    .eq("id", input.id)
    .eq("school_id", schoolId);

  if (error) {
    if (error.code === "23505") throw new Error(`Section ${level}-${sectionName} already exists.`);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/classes");
  revalidatePath(`/dashboard/classes/${input.id}`);
}

export async function deleteSection(id: string): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const { count: studentCount } = await supabaseAdmin
    .from("students")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .eq("section_id", id);

  if (studentCount && studentCount > 0) {
    throw new Error(`Cannot delete — ${studentCount} student${studentCount === 1 ? "" : "s"} still enrolled in this section. Move or remove them first.`);
  }

  const { error } = await supabaseAdmin
    .from("sections")
    .delete()
    .eq("id", id)
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/classes");
}

// ── Stream management ────────────────────────────────────────────────────────

export interface StreamWithUsage {
  id: string;
  name: string;
  sectionCount: number;
}

export async function listStreamsWithUsage(): Promise<StreamWithUsage[]> {
  const schoolId = await getCurrentSchoolIdOrThrow();

  const [{ data: streamRows }, { data: sectionRows }] = await Promise.all([
    supabaseAdmin.from("streams").select("id, name").eq("school_id", schoolId).order("name"),
    supabaseAdmin.from("sections").select("stream_id").eq("school_id", schoolId).not("stream_id", "is", null),
  ]);

  const counts: Record<string, number> = {};
  for (const s of sectionRows ?? []) {
    if (s.stream_id) counts[s.stream_id] = (counts[s.stream_id] ?? 0) + 1;
  }

  return (streamRows ?? []).map((s) => ({ id: s.id, name: s.name, sectionCount: counts[s.id] ?? 0 }));
}

export async function createStream(name: string): Promise<{ id: string }> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const id = await resolveStreamId(schoolId, null, name);
  if (!id) throw new Error("Stream name is required.");
  revalidatePath("/dashboard/classes");
  return { id };
}

export async function renameStream(id: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Stream name is required.");

  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin
    .from("streams")
    .update({ name: trimmed })
    .eq("id", id)
    .eq("school_id", schoolId);

  if (error) {
    if (error.code === "23505") throw new Error(`A stream named "${trimmed}" already exists.`);
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/classes");
}

export async function deleteStream(id: string): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin
    .from("streams")
    .delete()
    .eq("id", id)
    .eq("school_id", schoolId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/classes");
}
