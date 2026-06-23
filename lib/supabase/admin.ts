export interface InstitutionUser {
  id: string;
  email: string;
  created_at: string;
  user_metadata: {
    role: "super_admin";
    status: "pending" | "active" | "rejected";
    full_name?: string;
    designation?: string;
    institution_name?: string;
    institution_type?: string;
    city?: string;
    state?: string;
    country?: string;
    phone?: string;
    website?: string;
    student_range?: string;
  };
}

const adminHeaders = () => ({
  "Content-Type": "application/json",
  apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
});

export async function listInstitutions(): Promise<InstitutionUser[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?per_page=1000`,
    { headers: adminHeaders(), cache: "no-store" }
  );
  if (!res.ok) return [];
  const data: { users?: InstitutionUser[] } = await res.json();
  return (data.users ?? []).filter(
    (u) => u.user_metadata?.role === "super_admin"
  );
}

export async function updateInstitutionStatus(
  userId: string,
  status: "active" | "rejected"
) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`,
    {
      method: "PUT",
      headers: adminHeaders(),
      body: JSON.stringify({ user_metadata: { status } }),
    }
  );
  return res.ok;
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
