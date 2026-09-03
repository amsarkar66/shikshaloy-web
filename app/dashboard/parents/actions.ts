"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { resolveAuthorizedSchoolId, assertAuthorizedSchool } from "@/lib/supabase/authorized-school";
import { logAuditEvent } from "@/lib/audit/log";
import { randomPassword } from "@/lib/auth/random-password";
import { getVerifiedUser, requireRole, type VerifiedProfile } from "@/lib/auth/verified-role";

export type ParentRelationship = "father" | "mother" | "guardian";

export interface AddParentInput {
  fullName: string;
  phone?: string | null;
  email?: string | null;
  occupation?: string | null;
  address?: string | null;
  children: { studentId: string; relationship: ParentRelationship }[];
  schoolId?: string;
}

export interface AddParentResult {
  parentId: string;
  login: { email: string; password: string } | null;
}

// Reachable both from the single-school Parents page (no explicit schoolId
// — falls back to the school-switcher cookie) and, once combined across an
// institution's schools, with an explicit schoolId the caller picked, which
// must be verified as theirs before it's trusted.
async function resolveTargetSchoolId(vu: VerifiedProfile, explicitSchoolId?: string): Promise<string> {
  if (explicitSchoolId) {
    await assertAuthorizedSchool(vu, explicitSchoolId);
    return explicitSchoolId;
  }
  return getCurrentSchoolIdOrThrow();
}

async function requireParentAdmin(): Promise<VerifiedProfile> {
  const vu = await getVerifiedUser();
  if (!vu || (vu.role !== "admin" && vu.role !== "super_admin")) throw new Error("Unauthorized");
  return vu;
}

export async function addParent(input: AddParentInput): Promise<AddParentResult> {
  const vu = await requireParentAdmin();
  const schoolId = await resolveTargetSchoolId(vu, input.schoolId);

  const fullName = input.fullName.trim();
  if (!fullName) throw new Error("Parent name is required");

  const email = input.email?.trim() || null;
  const phone = input.phone?.trim() || null;

  let profileId: string | null = null;
  let login: { email: string; password: string } | null = null;

  if (email) {
    const { data: existingParent } = await supabaseAdmin
      .from("parents")
      .select("id")
      .eq("school_id", schoolId)
      .eq("email", email)
      .maybeSingle();
    if (existingParent) throw new Error("A parent with this email already exists.");

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SERVICE_KEY = process.env.SUPABASE_SECRET_KEY!;
    const lookupRes = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    const lookupData = await lookupRes.json();
    const existingUser = lookupData?.users?.find((u: { email: string; id: string }) => u.email === email);

    if (existingUser) {
      profileId = existingUser.id;
    } else {
      const password = randomPassword();
      const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: "parent", full_name: fullName, school_id: schoolId, status: "active" },
      });
      if (error || !newUser?.user) {
        throw new Error(`Failed to create parent login: ${error?.message ?? "unknown error"}`);
      }
      profileId = newUser.user.id;
      login = { email, password };
    }
  }

  const { data: newParent, error: insertError } = await supabaseAdmin
    .from("parents")
    .insert({
      school_id: schoolId,
      profile_id: profileId,
      full_name: fullName,
      phone,
      email,
      occupation: input.occupation?.trim() || null,
      address: input.address?.trim() || null,
      status: "active",
      joined_date: new Date().toISOString().slice(0, 10),
    })
    .select("id")
    .single();

  if (insertError || !newParent) {
    throw new Error(`Failed to create parent: ${insertError?.message ?? "unknown error"}`);
  }

  if (input.children.length > 0) {
    const rows = input.children.map((c, i) => ({
      student_id: c.studentId,
      parent_id: newParent.id,
      relationship: c.relationship,
      is_primary: i === 0,
    }));
    const { error: linkError } = await supabaseAdmin.from("student_parents").insert(rows);
    if (linkError) throw new Error(`Parent created, but failed to link children: ${linkError.message}`);
  }

  await logAuditEvent({
    schoolId,
    action: "create",
    module: "Parents",
    description: `Added new parent — ${fullName}`,
  });

  revalidatePath("/dashboard/parents");
  return { parentId: newParent.id, login };
}

export async function searchStudentsForParentLink(query: string, schoolIdInput?: string): Promise<{ id: string; label: string; sublabel: string }[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const vu = await requireParentAdmin();
  const schoolId = await resolveTargetSchoolId(vu, schoolIdInput);

  const { data } = await supabaseAdmin
    .from("students")
    .select("id, full_name, roll_no, sections ( name, grades ( level ) )")
    .eq("school_id", schoolId)
    .ilike("full_name", `%${q}%`)
    .order("full_name")
    .limit(10);

  return ((data ?? []) as unknown as {
    id: string;
    full_name: string | null;
    roll_no: string | null;
    sections: { name: string | null; grades: { level: number | null } | null } | null;
  }[]).map((s) => {
    const classLabel = s.sections?.grades?.level ? `Class ${s.sections.grades.level}${s.sections?.name ? `-${s.sections.name}` : ""}` : null;
    return {
      id: s.id,
      label: s.full_name ?? "Unknown",
      sublabel: [classLabel, s.roll_no ? `Roll ${s.roll_no}` : null].filter(Boolean).join(" · ") || "Student",
    };
  });
}

export interface ParentEditData {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  occupation: string;
  address: string;
  active: boolean;
  children: { id: string; label: string; sublabel: string; relationship: ParentRelationship }[];
}

export async function getParentForEdit(parentId: string): Promise<ParentEditData> {
  await requireRole(["admin", "super_admin"]);
  const schoolId = await resolveAuthorizedSchoolId("parents", parentId);

  const { data } = await supabaseAdmin
    .from("parents")
    .select(`
      id, full_name, phone, email, occupation, address, status,
      student_parents (
        relationship,
        students ( id, full_name, roll_no, sections ( name, grades ( level ) ) )
      )
    `)
    .eq("school_id", schoolId)
    .eq("id", parentId)
    .single();

  if (!data) throw new Error("Parent not found");

  const row = data as unknown as {
    id: string;
    full_name: string | null;
    phone: string | null;
    email: string | null;
    occupation: string | null;
    address: string | null;
    status: string | null;
    student_parents: {
      relationship: string | null;
      students: {
        id: string;
        full_name: string | null;
        roll_no: string | null;
        sections: { name: string | null; grades: { level: number | null } | null } | null;
      } | null;
    }[] | null;
  };

  const children = (row.student_parents ?? []).flatMap((sp) => {
    const s = sp.students;
    if (!s) return [];
    const classLabel = s.sections?.grades?.level ? `Class ${s.sections.grades.level}${s.sections?.name ? `-${s.sections.name}` : ""}` : null;
    return [{
      id: s.id,
      label: s.full_name ?? "Unknown",
      sublabel: [classLabel, s.roll_no ? `Roll ${s.roll_no}` : null].filter(Boolean).join(" · ") || "Student",
      relationship: (sp.relationship ?? "guardian") as ParentRelationship,
    }];
  });

  return {
    id: row.id,
    fullName: row.full_name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    occupation: row.occupation ?? "",
    address: row.address ?? "",
    active: row.status !== "inactive",
    children,
  };
}

export interface UpdateParentInput {
  parentId: string;
  fullName: string;
  phone?: string | null;
  occupation?: string | null;
  address?: string | null;
  active: boolean;
  children: { studentId: string; relationship: ParentRelationship }[];
}

export async function updateParent(input: UpdateParentInput): Promise<void> {
  await requireRole(["admin", "super_admin"]);
  const schoolId = await resolveAuthorizedSchoolId("parents", input.parentId);

  const fullName = input.fullName.trim();
  if (!fullName) throw new Error("Parent name is required");

  const { error: updateError } = await supabaseAdmin
    .from("parents")
    .update({
      full_name: fullName,
      phone: input.phone?.trim() || null,
      occupation: input.occupation?.trim() || null,
      address: input.address?.trim() || null,
      status: input.active ? "active" : "inactive",
    })
    .eq("school_id", schoolId)
    .eq("id", input.parentId);

  if (updateError) throw new Error(`Failed to update parent: ${updateError.message}`);

  const { error: deleteError } = await supabaseAdmin
    .from("student_parents")
    .delete()
    .eq("parent_id", input.parentId);
  if (deleteError) throw new Error(`Failed to update linked children: ${deleteError.message}`);

  if (input.children.length > 0) {
    const rows = input.children.map((c, i) => ({
      student_id: c.studentId,
      parent_id: input.parentId,
      relationship: c.relationship,
      is_primary: i === 0,
    }));
    const { error: linkError } = await supabaseAdmin.from("student_parents").insert(rows);
    if (linkError) throw new Error(`Failed to link children: ${linkError.message}`);
  }

  await logAuditEvent({
    schoolId,
    action: "update",
    module: "Parents",
    description: `Updated parent — ${fullName}`,
  });

  revalidatePath("/dashboard/parents");
  revalidatePath(`/dashboard/parents/${input.parentId}`);
}

export async function deleteParent(parentId: string): Promise<void> {
  await requireRole(["admin", "super_admin"]);
  const schoolId = await resolveAuthorizedSchoolId("parents", parentId);

  const { data: parent } = await supabaseAdmin
    .from("parents")
    .select("full_name")
    .eq("school_id", schoolId)
    .eq("id", parentId)
    .maybeSingle();
  if (!parent) throw new Error("Parent not found");

  const { error } = await supabaseAdmin
    .from("parents")
    .delete()
    .eq("school_id", schoolId)
    .eq("id", parentId);
  if (error) throw new Error(`Failed to delete parent: ${error.message}`);

  await logAuditEvent({
    schoolId,
    action: "delete",
    module: "Parents",
    description: `Deleted parent — ${parent.full_name}`,
  });

  revalidatePath("/dashboard/parents");
}
