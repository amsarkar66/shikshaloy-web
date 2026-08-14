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
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
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

export interface StaffUser {
  id: string;
  email: string;
  user_metadata: {
    role: "staff";
    full_name?: string;
    staff_type?: string;        // display label shown to the staff member, e.g. "Warden"
    staff_template_id?: string; // template slug for permission lookups, e.g. "warden"
  };
}

export async function listStaffUsers(): Promise<StaffUser[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?per_page=1000`,
    { headers: adminHeaders(), cache: "no-store" }
  );
  if (!res.ok) return [];
  const data: { users?: StaffUser[] } = await res.json();
  return (data.users ?? []).filter((u) => u.user_metadata?.role === "staff");
}

export interface KernelUser {
  id: string;
  email: string;
  full_name?: string;
  permission: KernelPermission;
  created_at: string;
  last_sign_in_at: string | null;
}

export async function listKernelUsers(): Promise<KernelUser[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?per_page=1000`,
    { headers: adminHeaders(), cache: "no-store" }
  );
  if (!res.ok) return [];
  const data: {
    users?: {
      id: string;
      email?: string;
      created_at: string;
      last_sign_in_at?: string | null;
      user_metadata?: { role?: string; full_name?: string; kernel_permission?: string };
    }[];
  } = await res.json();

  return (data.users ?? [])
    .filter((u) => u.user_metadata?.role === "kernel")
    .map((u) => ({
      id: u.id,
      email: u.email ?? "—",
      full_name: u.user_metadata?.full_name,
      permission: (KERNEL_PERMISSIONS as readonly string[]).includes(u.user_metadata?.kernel_permission ?? "")
        ? (u.user_metadata!.kernel_permission as KernelPermission)
        : "owner",
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
    }));
}

export async function updateStaffType(
  userId: string,
  staffType: string,
  staffTemplateId: string
): Promise<boolean> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`,
    {
      method: "PUT",
      headers: adminHeaders(),
      body: JSON.stringify({
        user_metadata: {
          staff_type: staffType || null,
          staff_template_id: staffTemplateId || null,
        },
      }),
    }
  );
  return res.ok;
}
