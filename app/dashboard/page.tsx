import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { getVerifiedUser, isAdmin } from "@/lib/auth/verified-role";
import { KernelView } from "./_views/kernel-view";
import { SuperAdminView } from "./_views/super-admin-view";
import { AdminView } from "./_views/admin-view";
import { StudentView } from "./_views/student-view";
import { TeacherView } from "./_views/teacher-view";
import { ParentView } from "./_views/parent-view";
import { DriverView } from "./_views/driver-view";
import { StaffView } from "./_views/staff-view";
import { RoleView } from "./_views/role-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const {
    data: { user },
  } = await getUser();

  if (!user) redirect("/login");

  const vu = await getVerifiedUser();
  const role = vu?.role;

  if (role === "kernel")      return <KernelView />;
  if (role === "super_admin") return <SuperAdminView user={user} />;
  // Also lands anyone with a staff_members admin grant here — e.g. a
  // teacher promoted via promoteExistingToAdmin, which deliberately keeps
  // their original role instead of overwriting it. See
  // docs/architecture/role-and-identity-model.md §7-8. A real "which
  // identity am I acting as" switcher (§4) would let them get back to
  // TeacherView; until that exists, admin access takes priority.
  if (role === "admin" || (await isAdmin(vu))) return <AdminView user={user} />;
  if (role === "student")     return <StudentView user={user} />;
  if (role === "teacher")     return <TeacherView user={user} />;
  if (role === "parent")      return <ParentView user={user} />;
  if (role === "driver")      return <DriverView user={user} />;
  if (role === "staff")       return <StaffView user={user} />;
  return <RoleView user={user} role={role ?? ""} />;
}
