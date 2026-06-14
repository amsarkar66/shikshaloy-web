import type { User } from "@supabase/supabase-js";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  teacher: "Teacher",
  parent: "Parent",
  student: "Student",
};

export function RoleView({ user }: { user: User }) {
  const role = (user.user_metadata?.role as string) ?? "";
  const label = ROLE_LABELS[role] ?? role;
  const name = ((user.user_metadata?.full_name as string) || user.email) ?? "";
  const institution = (user.user_metadata?.institution_name as string) ?? null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Welcome, {name.split(" ")[0]}</h1>
        {institution && (
          <p className="mt-1 text-sm text-indigo-400">{institution}</p>
        )}
      </div>

      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-2xl">
          🚧
        </div>
        <p className="text-base font-semibold text-white">{label} dashboard coming soon</p>
        <p className="max-w-xs text-sm text-indigo-400">
          This section is under construction. Content specific to your role will appear here.
        </p>
      </div>
    </div>
  );
}
