import Link from "next/link";
import { ChevronRight, GraduationCap, IndianRupee } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { getParentContext } from "@/lib/parents/context";

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500",
];
function avatarColor(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

const FEE_BADGE: Record<string, string> = {
  paid:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  partial: "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  overdue: "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
};

function attColor(pct: number) {
  if (pct >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (pct >= 80) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export default async function ChildrenPage() {
  const { data: { user } } = await getUser();

  const parent = user ? await getParentContext(user.id) : null;

  if (!parent) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-2xl">💚</div>
          <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">No parent record linked to this login</p>
          <p className="max-w-sm text-sm text-gray-500 dark:text-zinc-400">
            Ask your school admin to link your login to your child&apos;s profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">My Children</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
          {parent.children.length} {parent.children.length === 1 ? "child" : "children"} linked to your account
        </p>
      </div>

      {parent.children.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-20 text-center">
          <p className="text-sm text-gray-400 dark:text-zinc-500">No children linked to this account yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {parent.children.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/children/${c.id}`}
              className="group rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                {c.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.photoUrl} alt={c.fullName} className="h-14 w-14 shrink-0 rounded-2xl object-cover" />
                ) : (
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white ${avatarColor(c.id)}`}>
                    {initials(c.fullName)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate">{c.fullName}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1">
                    <GraduationCap className="h-3 w-3" />
                    {c.gradeLevel ? `Class ${c.gradeLevel}-${c.sectionName}` : "Not assigned"}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 capitalize">{c.relationship}{c.isPrimary ? " · primary" : ""}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 dark:text-zinc-600 group-hover:text-primary-500 transition-colors" />
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-zinc-700/50 pt-3">
                <div className="text-xs text-gray-500 dark:text-zinc-400">
                  Roll No <span className="font-medium text-gray-700 dark:text-zinc-300">{c.rollNo || "—"}</span>
                </div>
                <div className={`text-xs font-semibold ${attColor(c.attendancePct)}`}>{c.attendancePct}% attendance</div>
              </div>

              <div className="mt-2 flex items-center gap-1.5">
                <IndianRupee className="h-3 w-3 text-gray-400 dark:text-zinc-500" />
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${FEE_BADGE[c.feeStatus] ?? FEE_BADGE.overdue}`}>
                  Fees {c.feeStatus}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
