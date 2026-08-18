"use server";

import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolId } from "@/lib/supabase/school-context";

export type DirectoryGroup = "Students" | "Staff" | "Parents";

export interface DirectorySearchResult {
  id: string;
  label: string;
  sublabel: string;
  href: string;
  group: DirectoryGroup;
}

const RESULT_LIMIT = 5;

// Record search is scoped to whatever the signed-in role can already see via
// the sidebar nav (see app/dashboard/_lib/nav-data.ts): full directories for
// admin, staff-only for super_admin and the HR staff template. Everyone else
// (teacher/parent/student/driver/kernel) gets no results rather than a query
// error, since they have no directory list of their own to match against.
export async function searchDirectory(query: string): Promise<DirectorySearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const {
    data: { user },
  } = await getUser();
  if (!user) return [];

  const role = (user.user_metadata?.role as string) ?? "";
  const staffTemplateId = user.user_metadata?.staff_template_id as string | undefined;

  const canSearchStudents = role === "admin";
  const canSearchParents = role === "admin";
  const canSearchStaff =
    role === "admin" || role === "super_admin" || (role === "staff" && staffTemplateId === "hr_manager");

  if (!canSearchStudents && !canSearchParents && !canSearchStaff) return [];

  const schoolId = await getCurrentSchoolId();
  if (!schoolId) return [];

  const pattern = `%${q}%`;
  const lookups: PromiseLike<DirectorySearchResult[]>[] = [];

  if (canSearchStudents) {
    lookups.push(
      supabaseAdmin
        .from("students")
        .select("id, full_name, roll_no")
        .eq("school_id", schoolId)
        .ilike("full_name", pattern)
        .order("full_name")
        .limit(RESULT_LIMIT)
        .then(({ data }) =>
          (data ?? []).map((s) => ({
            id: s.id,
            label: s.full_name ?? "Unknown",
            sublabel: s.roll_no ? `Roll No. ${s.roll_no}` : "Student",
            href: `/dashboard/students/${s.id}`,
            group: "Students" as const,
          }))
        )
    );
  }

  if (canSearchStaff) {
    lookups.push(
      supabaseAdmin
        .from("staff_members")
        .select("id, full_name, designation")
        .eq("school_id", schoolId)
        .ilike("full_name", pattern)
        .order("full_name")
        .limit(RESULT_LIMIT)
        .then(({ data }) =>
          (data ?? []).map((s) => ({
            id: s.id,
            label: s.full_name ?? "Unknown",
            sublabel: s.designation || "Staff",
            href: `/dashboard/staff/${s.id}`,
            group: "Staff" as const,
          }))
        )
    );
  }

  if (canSearchParents) {
    lookups.push(
      supabaseAdmin
        .from("parents")
        .select("id, full_name, phone")
        .eq("school_id", schoolId)
        .ilike("full_name", pattern)
        .order("full_name")
        .limit(RESULT_LIMIT)
        .then(({ data }) =>
          (data ?? []).map((p) => ({
            id: p.id,
            label: p.full_name ?? "Unknown",
            sublabel: p.phone || "Parent",
            href: `/dashboard/parents/${p.id}`,
            group: "Parents" as const,
          }))
        )
    );
  }

  const results = await Promise.all(lookups);
  return results.flat();
}
