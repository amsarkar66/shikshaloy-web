import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
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

  const role = user.user_metadata?.role as string | undefined;

  if (role === "kernel")      return <KernelView />;
  if (role === "super_admin") return <SuperAdminView user={user} />;
  if (role === "admin")       return <AdminView user={user} />;
  if (role === "student")     return <StudentView user={user} />;
  if (role === "teacher")     return <TeacherView user={user} />;
  if (role === "parent")      return <ParentView user={user} />;
  if (role === "driver")      return <DriverView user={user} />;
  if (role === "staff")       return <StaffView user={user} />;
  return <RoleView user={user} />;
}
