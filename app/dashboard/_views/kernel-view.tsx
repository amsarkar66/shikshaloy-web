import Link from "next/link";
import {
  Building2, Clock, CheckCircle2, XCircle,
  MapPin, Phone, Globe, Mail, Users, Briefcase,
  CalendarDays, Inbox, GraduationCap, Hash,
} from "lucide-react";
import { listInstitutions, type PendingInstitution } from "@/lib/supabase/admin";
import { StatusBadge, TypeBadge, BoardBadge, SchoolCountBadge, InstitutionActions } from "../institutions/_components/institution-ui";

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-zinc-50">{value}</p>
        <p className="text-sm text-primary-600 dark:text-zinc-400">{label}</p>
      </div>
    </div>
  );
}

function PendingCard({ inst }: { inst: PendingInstitution }) {
  const submitted = new Date(inst.created_at).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
  const location = [inst.address, inst.city, inst.state, inst.pin_code, inst.country]
    .filter(Boolean)
    .join(", ");
  const grades = inst.grades_from && inst.grades_to ? `${inst.grades_from} – ${inst.grades_to}` : null;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-50">
              <Link href={`/dashboard/institutions/${inst.id}`} className="hover:underline">
                {inst.name ?? "—"}
              </Link>
            </h3>
            <TypeBadge type={inst.institution_type} />
            <BoardBadge board={inst.board} />
            <SchoolCountBadge count={inst.schools.length} />
            {inst.established_year && (
              <span className="text-xs text-primary-500 dark:text-zinc-500">Est. {inst.established_year}</span>
            )}
          </div>

          {inst.tagline && (
            <p className="text-xs italic text-primary-500 dark:text-zinc-500">{inst.tagline}</p>
          )}

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-primary-600 dark:text-zinc-400">
            {location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary-500" />
                {location}
              </span>
            )}
            {inst.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-primary-500" />
                {inst.phone}
              </span>
            )}
            {inst.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-primary-500" />
                {inst.email}
              </span>
            )}
            {inst.website && (
              <a href={inst.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-primary-800 dark:hover:text-zinc-200 transition-colors">
                <Globe className="h-3.5 w-3.5 text-primary-500" />
                {inst.website.replace(/^https?:\/\//, "")}
              </a>
            )}
            {inst.student_range && (
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary-500" />
                {inst.student_range} students
              </span>
            )}
            {inst.staff_range && (
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-primary-500" />
                {inst.staff_range} staff
              </span>
            )}
            {grades && (
              <span className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-primary-500" />
                Grades {grades}
              </span>
            )}
            {inst.udise_code && (
              <span className="flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-primary-500" />
                UDISE+ {inst.udise_code}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-3 py-2 text-sm">
            <span className="font-medium text-gray-900 dark:text-zinc-50">{inst.owner_full_name ?? "—"}</span>
            <span className="flex items-center gap-1 text-primary-600 dark:text-zinc-400">
              <Mail className="h-3 w-3" />
              {inst.owner_email ?? "—"}
            </span>
          </div>

          {(inst.principal_name || inst.principal_email) && (
            <p className="text-xs text-primary-500 dark:text-zinc-500">
              Principal: {inst.principal_name ?? "—"}
              {inst.principal_designation ? ` · ${inst.principal_designation}` : ""}
              {inst.principal_email ? ` · ${inst.principal_email}` : ""}
            </p>
          )}

          <p className="flex items-center gap-1.5 text-xs text-primary-500 dark:text-zinc-500">
            <CalendarDays className="h-3.5 w-3.5" />
            Submitted {submitted}
          </p>
        </div>

        <InstitutionActions inst={inst} />
      </div>
    </div>
  );
}

function InstitutionRow({ inst }: { inst: PendingInstitution }) {
  const date = new Date(inst.created_at).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
  return (
    <tr className="border-b border-gray-100 dark:border-zinc-800 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/50">
      <td className="py-3 pl-4 pr-3">
        <p className="text-sm font-medium text-gray-900 dark:text-zinc-50">
          <Link href={`/dashboard/institutions/${inst.id}`} className="hover:underline">
            {inst.name ?? "—"}
          </Link>
        </p>
        <p className="text-xs text-primary-600 dark:text-zinc-500">
          {[inst.institution_type, inst.board].filter(Boolean).join(" · ")}
        </p>
      </td>
      <td className="px-3 py-3">
        <p className="text-sm text-gray-700 dark:text-zinc-300">{inst.owner_full_name ?? "—"}</p>
        <p className="text-xs text-primary-600 dark:text-zinc-500">{inst.owner_email}</p>
      </td>
      <td className="px-3 py-3 text-sm text-primary-600 dark:text-zinc-400">
        {[inst.city, inst.state].filter(Boolean).join(", ") || "—"}
      </td>
      <td className="px-3 py-3 text-sm text-primary-600 dark:text-zinc-400">{inst.owner_email}</td>
      <td className="px-3 py-3"><StatusBadge status={inst.status} /></td>
      <td className="py-3 pl-3 pr-4 text-sm text-primary-500 dark:text-zinc-500">{date}</td>
    </tr>
  );
}

export async function KernelView() {
  const institutions = await listInstitutions();
  const pending  = institutions.filter((i) => i.status === "pending");
  const active   = institutions.filter((i) => i.status === "active");
  const rejected = institutions.filter((i) => i.status === "rejected");

  const stats = [
    { label: "Total institutions", value: institutions.length, icon: Building2,    color: "bg-indigo-500/15 text-indigo-500" },
    { label: "Pending review",     value: pending.length,      icon: Clock,         color: "bg-amber-500/15  text-amber-500"  },
    { label: "Active",             value: active.length,       icon: CheckCircle2,  color: "bg-emerald-500/15 text-emerald-500" },
    { label: "Rejected",           value: rejected.length,     icon: XCircle,       color: "bg-red-500/15    text-red-500"    },
  ];

  return (
    <div className="w-full space-y-8 px-6 py-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-base font-semibold text-gray-900 dark:text-zinc-50">Pending approval</h2>
          {pending.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
              {pending.length}
            </span>
          )}
        </div>
        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-14 text-center">
            <Inbox className="h-8 w-8 text-primary-400 dark:text-zinc-600" />
            <p className="text-sm font-medium text-gray-700 dark:text-zinc-400">No pending applications</p>
            <p className="text-xs text-primary-500 dark:text-zinc-500">New institution requests will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((inst) => <PendingCard key={inst.id} inst={inst} />)}
          </div>
        )}
      </section>

      {institutions.length > 0 && (
        <section>
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-zinc-50">All institutions</h2>
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50">
            <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-800">
                  {["Institution", "Contact", "Location", "Email", "Status", "Date"].map((h) => (
                    <th key={h} className={`py-3 text-xs font-semibold uppercase tracking-wider text-primary-500 dark:text-zinc-500 ${h === "Institution" ? "pl-4 pr-3" : h === "Date" ? "pl-3 pr-4" : "px-3"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...pending, ...active, ...rejected].map((inst) => (
                  <InstitutionRow key={inst.id} inst={inst} />
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
