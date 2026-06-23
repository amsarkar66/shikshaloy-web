import type { User } from "@supabase/supabase-js";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Institution Owner",
  admin:       "Principal",
  staff:       "Staff Manager",
  teacher:     "Teacher",
  parent:      "Parent",
  student:     "Student",
  driver:      "Driver",
};

const ROLE_SUBTITLES: Record<string, string> = {
  super_admin: "Manage schools, staff, and billing under your institution.",
  admin:       "Manage students, staff, classes, fees, and school reports.",
  staff:       "Access your assigned management area.",
  teacher:     "Manage your classes, attendance, and student grades.",
  parent:      "Track your children's progress, fees, and report cards.",
  student:     "View your classes, attendance, grades, and timetable.",
  driver:      "Manage your assigned transport routes and attendance.",
};

export function RoleView({ user }: { user: User }) {
  const role = (user.user_metadata?.role as string) ?? "";
  const staffType = user.user_metadata?.staff_type as string | undefined;
  const label = role === "staff" ? (staffType ?? ROLE_LABELS[role] ?? role) : (ROLE_LABELS[role] ?? role);
  const subtitle =
    role === "staff" && staffType
      ? `You have access to the areas assigned to your ${staffType} role.`
      : (ROLE_SUBTITLES[role] ?? "Your dashboard is being set up.");
  const institution = (user.user_metadata?.institution_name as string) ?? null;

  return (
    <div className="w-full px-6 py-8">
      {institution && (
        <p className="mb-6 text-sm text-indigo-600 dark:text-zinc-400">{institution}</p>
      )}

      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-2xl">
          🚧
        </div>
        <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">{label} dashboard coming soon</p>
        <p className="max-w-xs text-sm text-indigo-600 dark:text-zinc-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
