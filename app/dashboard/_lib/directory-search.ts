"use server";

import { getVerifiedUser } from "@/lib/auth/verified-role";
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

// Nav filtering (Sidebar / CommandMenu, both client components) needs the
// caller's own staff template but can't call the server-only verified-role
// helper directly — user.user_metadata.staff_template_id is self-editable
// and must not be trusted, so this resolves it from staff_members instead.
export async function getVerifiedStaffTemplateId(): Promise<string | undefined> {
  const vu = await getVerifiedUser();
  if (!vu || vu.role !== "staff") return undefined;

  const { data: staff } = await supabaseAdmin
    .from("staff_members")
    .select("permission_template_id")
    .eq("profile_id", vu.id)
    .maybeSingle();
  return staff?.permission_template_id ?? undefined;
}

// Record search is scoped to whatever the signed-in role can already see via
// the sidebar nav (see app/dashboard/_lib/nav-data.ts): full directories for
// admin, staff-only for super_admin and the HR staff template. Everyone else
// (teacher/parent/student/driver/kernel) gets no results rather than a query
// error, since they have no directory list of their own to match against.
export async function searchDirectory(query: string): Promise<DirectorySearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const vu = await getVerifiedUser();
  if (!vu) return [];

  const role = vu.role;
  const staffTemplateId = role === "staff" ? await getVerifiedStaffTemplateId() : undefined;

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
