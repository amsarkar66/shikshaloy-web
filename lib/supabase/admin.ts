import { supabaseAdmin } from "./service";
import { KERNEL_PERMISSIONS, type KernelPermission } from "@/lib/kernel-permissions";

export interface InstitutionSchool {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  status: "active" | "inactive" | "pending";
}

export interface PendingInstitution {
  id: string;
  name: string;
  institution_type: string | null;
  board: string | null;
  established_year: number | null;
  city: string | null;
  state: string | null;
  country: string | null;
  address: string | null;
  pin_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  student_range: string | null;
  staff_range: string | null;
  grades_from: string | null;
  grades_to: string | null;
  tagline: string | null;
  udise_code: string | null;
  status: "pending" | "active" | "rejected";
  created_at: string;
  owner_id: string | null;
  owner_email: string | null;
  owner_full_name: string | null;
  principal_name: string | null;
  principal_email: string | null;
  principal_designation: string | null;
  // Every school/college under this institution — length 1 for the common
  // single-school case, more for a university/trust running several.
  schools: InstitutionSchool[];
}

const adminHeaders = () => ({
  "Content-Type": "application/json",
  apikey: process.env.SUPABASE_SECRET_KEY!,
  Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
});

const SCHOOL_ACADEMIC_COLUMNS =
  "id, institution_id, name, city, state, status, board, established_year, pin_code, student_range, staff_range, grades_from, grades_to, tagline, udise_code, principal_name, principal_email, principal_designation, created_at";

interface SchoolAcademicRow {
  id: string;
  institution_id: string;
  name: string;
  city: string | null;
  state: string | null;
  status: "active" | "inactive" | "pending";
  board: string | null;
  established_year: number | null;
  pin_code: string | null;
  student_range: string | null;
  staff_range: string | null;
  grades_from: string | null;
  grades_to: string | null;
  tagline: string | null;
  udise_code: string | null;
  principal_name: string | null;
  principal_email: string | null;
  principal_designation: string | null;
  created_at: string;
}

// The institution's own record carries org-level identity/contact/status;
// academic-profile fields (board, grades, principal, …) live per school. We
// flatten the oldest school's academic fields onto the institution shape so
// existing UI (built when one row was both) keeps working unchanged, and
// additionally expose the full `schools` list for institutions with more
// than one campus.
function flattenInstitution(
  institution: {
    id: string; name: string; type: string | null;
    city: string | null; state: string | null; country: string | null; address: string | null;
    phone: string | null; email: string | null; website: string | null;
    status: "pending" | "active" | "rejected"; created_at: string; owner_id: string | null;
  },
  schools: SchoolAcademicRow[]
): Omit<PendingInstitution, "owner_email" | "owner_full_name"> {
  const primary = schools[0];
  return {
    id: institution.id,
    name: institution.name,
    institution_type: institution.type,
    board: primary?.board ?? null,
    established_year: primary?.established_year ?? null,
    city: institution.city,
    state: institution.state,
    country: institution.country,
    address: institution.address,
    pin_code: primary?.pin_code ?? null,
    phone: institution.phone,
    email: institution.email,
    website: institution.website,
    student_range: primary?.student_range ?? null,
    staff_range: primary?.staff_range ?? null,
    grades_from: primary?.grades_from ?? null,
    grades_to: primary?.grades_to ?? null,
    tagline: primary?.tagline ?? null,
    udise_code: primary?.udise_code ?? null,
    status: institution.status,
    created_at: institution.created_at,
    owner_id: institution.owner_id,
    principal_name: primary?.principal_name ?? null,
    principal_email: primary?.principal_email ?? null,
    principal_designation: primary?.principal_designation ?? null,
    schools: schools.map((s) => ({ id: s.id, name: s.name, city: s.city, state: s.state, status: s.status })),
  };
}

export async function listInstitutions(): Promise<PendingInstitution[]> {
  const [{ data: institutions }, { data: schools }] = await Promise.all([
    supabaseAdmin
      .from("institutions")
      .select("id, name, type, city, state, country, address, phone, email, website, status, created_at, owner_id")
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("schools")
      .select(SCHOOL_ACADEMIC_COLUMNS)
      .order("created_at", { ascending: true }),
  ]);

  if (!institutions || institutions.length === 0) return [];

  const schoolsByInstitution = new Map<string, SchoolAcademicRow[]>();
  for (const s of (schools ?? []) as SchoolAcademicRow[]) {
    const list = schoolsByInstitution.get(s.institution_id) ?? [];
    list.push(s);
    schoolsByInstitution.set(s.institution_id, list);
  }

  // One bulk admin-users pass to attach owner email/name, cheaper than N lookups.
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?per_page=1000`,
    { headers: adminHeaders(), cache: "no-store" }
  );
  const usersById = new Map<string, { email?: string; user_metadata?: { full_name?: string } }>();
  if (res.ok) {
    const data: { users?: { id: string; email?: string; user_metadata?: { full_name?: string } }[] } =
      await res.json();
    for (const u of data.users ?? []) usersById.set(u.id, u);
  }

  return institutions.map((inst) => {
    const owner = inst.owner_id ? usersById.get(inst.owner_id) : undefined;
    return {
      ...flattenInstitution(inst, schoolsByInstitution.get(inst.id) ?? []),
      owner_email: owner?.email ?? null,
      owner_full_name: owner?.user_metadata?.full_name ?? null,
    };
  });
}

export interface InstitutionSubscription {
  plan_id: string | null;
  plan_name: string | null;
  status: string | null;
  schools_used: number | null;
  max_schools: number | null;
  monthly_fee: number | null;
  renews_on: string | null;
  payment_method_summary: string | null;
}

export async function getInstitution(
  id: string
): Promise<{ institution: PendingInstitution; subscription: InstitutionSubscription | null } | null> {
  const [{ data: institution }, { data: schools }, { data: subscription }] = await Promise.all([
    supabaseAdmin
      .from("institutions")
      .select("id, name, type, city, state, country, address, phone, email, website, status, created_at, owner_id")
      .eq("id", id)
      .maybeSingle(),
    supabaseAdmin
      .from("schools")
      .select(SCHOOL_ACADEMIC_COLUMNS)
      .eq("institution_id", id)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("school_subscriptions")
      .select("plan_id, plan_name, status, schools_used, max_schools, monthly_fee, renews_on, payment_method_summary")
      .eq("institution_id", id)
      .maybeSingle(),
  ]);

  if (!institution) return null;

  let owner_email: string | null = null;
  let owner_full_name: string | null = null;
  if (institution.owner_id) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${institution.owner_id}`,
      { headers: adminHeaders(), cache: "no-store" }
    );
    if (res.ok) {
      const owner: { email?: string; user_metadata?: { full_name?: string } } = await res.json();
      owner_email = owner.email ?? null;
      owner_full_name = owner.user_metadata?.full_name ?? null;
    }
  }

  return {
    institution: { ...flattenInstitution(institution, (schools ?? []) as SchoolAcademicRow[]), owner_email, owner_full_name },
    subscription: subscription ?? null,
  };
}

// Approves/rejects the institution as a whole — the primary kernel gate,
// since a multi-college university is vetted once, not per-campus. Schools
// under an approved institution default to "active" when created and are
// otherwise suspended individually (not covered here).
export async function updateInstitutionStatus(
  institutionId: string,
  status: "active" | "rejected",
  plan?: { id: string; name: string; maxSchools: number; monthlyFee: number }
): Promise<{ ownerId: string | null; ownerEmail: string | null; institutionName: string; primarySchoolId: string | null } | null> {
  const { data: institution } = await supabaseAdmin
    .from("institutions")
    .select("owner_id, name")
    .eq("id", institutionId)
    .single();
  if (!institution) return null;

  await supabaseAdmin.from("institutions").update({ status }).eq("id", institutionId);

  if (institution.owner_id) {
    await supabaseAdmin.from("profiles").update({ status }).eq("id", institution.owner_id);
  }

  if (status === "active" && plan) {
    await supabaseAdmin
      .from("school_subscriptions")
      .update({
        plan_id: plan.id,
        plan_name: plan.name,
        max_schools: plan.maxSchools,
        monthly_fee: plan.monthlyFee,
        updated_at: new Date().toISOString(),
      })
      .eq("institution_id", institutionId);
  }

  let ownerEmail: string | null = null;
  if (institution.owner_id) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${institution.owner_id}`,
      { headers: adminHeaders() }
    );
    if (res.ok) {
      const owner: { email?: string } = await res.json();
      ownerEmail = owner.email ?? null;
    }
  }

  const { data: primarySchool } = await supabaseAdmin
    .from("schools")
    .select("id")
    .eq("institution_id", institutionId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    ownerId: institution.owner_id,
    ownerEmail,
    institutionName: institution.name,
    primarySchoolId: primarySchool?.id ?? null,
  };
}

// Permanently deletes an institution and every row scoped to its schools —
// the actual cascade runs inside a single Postgres transaction (see the
// `delete_institution_cascade` function, migration
// 20260825140000_add_institution_hard_delete.sql) so a table this function
// doesn't know about fails the whole call atomically instead of leaving a
// half-deleted institution. Login accounts (owner, staff, students, parents,
// drivers) are left untouched — only their now-dangling school link is
// cleared, since the same account may work part-time elsewhere.
export async function hardDeleteInstitution(
  institutionId: string
): Promise<{ institutionName: string; schoolNames: string[] }> {
  const { data: institution } = await supabaseAdmin
    .from("institutions")
    .select("id, name")
    .eq("id", institutionId)
    .single();
  if (!institution) throw new Error("Institution not found");

  const { data: schools } = await supabaseAdmin
    .from("schools")
    .select("name")
    .eq("institution_id", institutionId);
  const schoolNames = (schools ?? []).map((s) => s.name);

  const { error } = await supabaseAdmin.rpc("delete_institution_cascade", {
    p_institution_id: institutionId,
  });
  if (error) throw new Error(`Failed to delete institution: ${error.message}`);

  return { institutionName: institution.name, schoolNames };
}

export interface DirectoryUser {
  id: string;
  email: string | null;
  fullName: string | null;
  role: string;
  status: string | null;
  phone: string | null;
  schoolName: string | null;
  institutionName: string | null;
  createdAt: string;
  lastSignInAt: string | null;
}

interface DirectoryProfileRow {
  id: string;
  role: string;
  full_name: string | null;
  phone: string | null;
  status: string | null;
  school_id: string | null;
  created_at: string;
}

// listStaffUsers/listKernelUsers only ever cover a small, single-role slice
// and fit in one page today, but this directory covers every account on the
// platform — it has to loop until a short page signals the end, or accounts
// past #1000 would silently vanish from the list.
async function fetchAllAuthUsersById(): Promise<
  Map<string, { email?: string; created_at: string; last_sign_in_at?: string | null }>
> {
  const usersById = new Map<string, { email?: string; created_at: string; last_sign_in_at?: string | null }>();
  const perPage = 1000;
  let page = 1;
  while (true) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?per_page=${perPage}&page=${page}`,
      { headers: adminHeaders(), cache: "no-store" }
    );
    if (!res.ok) break;
    const data: { users?: { id: string; email?: string; created_at: string; last_sign_in_at?: string | null }[] } =
      await res.json();
    const users = data.users ?? [];
    for (const u of users) usersById.set(u.id, u);
    if (users.length < perPage) break;
    page += 1;
  }
  return usersById;
}

// Platform-wide user directory for kernel — every account across every
// role and institution, unlike the rest of the app's people-listing pages
// which are always scoped to one school.
export async function listAllUsers(): Promise<DirectoryUser[]> {
  const PAGE = 1000;
  let from = 0;
  const profiles: DirectoryProfileRow[] = [];
  while (true) {
    const { data } = await supabaseAdmin
      .from("profiles")
      .select("id, role, full_name, phone, status, school_id, created_at")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (!data || data.length === 0) break;
    profiles.push(...(data as DirectoryProfileRow[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }

  const schoolIds = [...new Set(profiles.map((p) => p.school_id).filter((id): id is string => !!id))];
  const { data: schools } = schoolIds.length
    ? await supabaseAdmin.from("schools").select("id, name, institution_id").in("id", schoolIds)
    : { data: null };

  const institutionIds = [...new Set((schools ?? []).map((s) => s.institution_id).filter((id): id is string => !!id))];
  const { data: institutions } = institutionIds.length
    ? await supabaseAdmin.from("institutions").select("id, name").in("id", institutionIds)
    : { data: null };

  // super_admin accounts aren't tied to a school_id — they own an
  // institution directly, so resolve their institution the other way round.
  const superAdminIds = profiles.filter((p) => p.role === "super_admin").map((p) => p.id);
  const { data: ownedInstitutions } = superAdminIds.length
    ? await supabaseAdmin.from("institutions").select("id, name, owner_id").in("owner_id", superAdminIds)
    : { data: null };

  const institutionNameById = new Map((institutions ?? []).map((i) => [i.id, i.name]));
  const schoolById = new Map(
    (schools ?? []).map((s) => [
      s.id,
      { name: s.name, institutionName: s.institution_id ? institutionNameById.get(s.institution_id) ?? null : null },
    ])
  );
  const institutionNameByOwnerId = new Map((ownedInstitutions ?? []).map((i) => [i.owner_id as string, i.name]));

  const authUsersById = await fetchAllAuthUsersById();

  return profiles.map((p) => {
    const auth = authUsersById.get(p.id);
    const school = p.school_id ? schoolById.get(p.school_id) : undefined;
    return {
      id: p.id,
      email: auth?.email ?? null,
      fullName: p.full_name,
      role: p.role,
      status: p.status,
      phone: p.phone,
      schoolName: school?.name ?? null,
      institutionName: school?.institutionName ?? institutionNameByOwnerId.get(p.id) ?? null,
      createdAt: p.created_at,
      lastSignInAt: auth?.last_sign_in_at ?? null,
    };
  });
}

export interface KernelUser {
  id: string;
  email: string;
  full_name?: string;
  permission: KernelPermission;
  created_at: string;
  last_sign_in_at: string | null;
}

// Who's actually kernel is decided by `profiles.role` (server-controlled),
// not the live JWT — a self-escalated user_metadata.role="kernel" must not
// be able to inject itself into the platform team roster.
export async function listKernelUsers(): Promise<KernelUser[]> {
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, kernel_permission")
    .eq("role", "kernel");
  if (!profiles || profiles.length === 0) return [];

  const authUsersById = await fetchAllAuthUsersById();

  return profiles.map((p) => {
    const auth = authUsersById.get(p.id);
    return {
      id: p.id,
      email: auth?.email ?? "—",
      full_name: p.full_name ?? undefined,
      permission: (KERNEL_PERMISSIONS as readonly string[]).includes(p.kernel_permission ?? "")
        ? (p.kernel_permission as KernelPermission)
        : "owner",
      created_at: auth?.created_at ?? "",
      last_sign_in_at: auth?.last_sign_in_at ?? null,
    };
  });
}

