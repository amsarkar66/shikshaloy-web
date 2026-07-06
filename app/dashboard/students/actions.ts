"use server";

import { revalidatePath } from "next/cache";
import { DEMO_AY_ID } from "@/lib/supabase/service";
import { enrollStudent, type EnrollStudentResult } from "@/lib/students/enroll";

export interface AddStudentInput {
  fullName: string;
  dob: string | null;
  gender: "Male" | "Female" | "Other" | null;
  sectionId: string;
  gradeLevel: number;
  phone?: string | null;
  address?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  parentEmail?: string | null;
  photoUrl?: string | null;
}

export async function addStudentManual(input: AddStudentInput): Promise<EnrollStudentResult> {
  const result = await enrollStudent({
    fullName: input.fullName,
    dob: input.dob,
    gender: input.gender,
    gradeLevel: input.gradeLevel,
    academicYearId: DEMO_AY_ID,
    sectionId: input.sectionId,
    phone: input.phone,
    address: input.address,
    parentName: input.parentName,
    parentPhone: input.parentPhone,
    parentEmail: input.parentEmail,
    photoUrl: input.photoUrl,
  });

  revalidatePath("/dashboard/students");
  return result;
}

export interface BulkImportRow {
  name: string;
  rollNo?: string;
  class: string;
  section?: string;
  parent?: string;
  phone?: string;
}

export interface BulkImportOutcome {
  succeeded: number;
  failed: Array<{ row: string; reason: string }>;
}

export async function bulkImportStudents(rows: BulkImportRow[]): Promise<BulkImportOutcome> {
  const outcome: BulkImportOutcome = { succeeded: 0, failed: [] };

  for (const row of rows) {
    const gradeLevel = parseInt(row.class, 10);
    if (!row.name || Number.isNaN(gradeLevel)) {
      outcome.failed.push({ row: row.name || "(unnamed)", reason: "Missing name or invalid class" });
      continue;
    }
    try {
      await enrollStudent({
        fullName: row.name,
        dob: null,
        gender: null,
        gradeLevel,
        academicYearId: DEMO_AY_ID,
        sectionName: row.section || null,
        rollNo: row.rollNo || null,
        phone: row.phone || null,
        parentName: row.parent || null,
      });
      outcome.succeeded += 1;
    } catch (e) {
      outcome.failed.push({ row: row.name, reason: e instanceof Error ? e.message : "Unknown error" });
    }
  }

  revalidatePath("/dashboard/students");
  return outcome;
}
