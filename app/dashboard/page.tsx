import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { getActiveIdentity } from "@/lib/identity/context";
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

  // The active identity is a chosen dashboard view, not just profiles.role —
  // it also covers a staff_members admin grant on a teacher/staff account
  // (promoteExistingToAdmin deliberately leaves the role alone) and a
  // linked parents row at this school, surfaced via the identity switcher
  // in the profile menu when more than one applies. See
  // docs/architecture/role-and-identity-model.md §7-9.
  const active = await getActiveIdentity();
  const role = active?.key;

  if (role === "kernel")      return <KernelView />;
  if (role === "super_admin") return <SuperAdminView user={user} />;
  if (role === "admin")       return <AdminView user={user} />;
  if (role === "student")     return <StudentView user={user} />;
  if (role === "teacher")     return <TeacherView user={user} />;
  if (role === "parent")      return <ParentView user={user} />;
  if (role === "driver")      return <DriverView user={user} />;
  if (role === "staff")       return <StaffView user={user} />;
  return <RoleView user={user} role={role ?? ""} />;
}
