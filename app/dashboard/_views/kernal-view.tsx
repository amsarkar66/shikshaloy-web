import {
  Building2, Clock, CheckCircle2, XCircle,
  MapPin, Phone, Globe, Users, Mail,
  Check, X, CalendarDays, Inbox,
} from "lucide-react";
import { listInstitutions, type InstitutionUser } from "@/lib/supabase/admin";
import { approveInstitution, rejectInstitution } from "../actions";

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-5">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-indigo-400">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: InstitutionUser["user_metadata"]["status"] }) {
  const map = {
    pending:  "bg-amber-500/10   text-amber-400   border-amber-500/20",
    active:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rejected: "bg-red-500/10     text-red-400     border-red-500/20",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${map[status]}`}>
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type?: string }) {
  if (!type) return null;
  return (
    <span className="inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-300">
      {type}
    </span>
  );
}

function PendingCard({ inst }: { inst: InstitutionUser }) {
  const m = inst.user_metadata;
  const submitted = new Date(inst.created_at).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/[0.07]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-white">{m.institution_name ?? "—"}</h3>
            <TypeBadge type={m.institution_type} />
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-indigo-300">
            {(m.city || m.state) && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                {[m.city, m.state].filter(Boolean).join(", ")}
              </span>
            )}
            {m.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-indigo-500" />
                {m.phone}
              </span>
            )}
            {m.student_range && (
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-indigo-500" />
                {m.student_range} students
              </span>
            )}
            {m.website && (
              <a href={m.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-indigo-200 transition-colors">
                <Globe className="h-3.5 w-3.5 text-indigo-500" />
                {m.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-sm">
            <span className="font-medium text-white">{m.full_name ?? "—"}</span>
            {m.designation && <span className="text-indigo-400">· {m.designation}</span>}
            <span className="flex items-center gap-1 text-indigo-400">
              <Mail className="h-3 w-3" />
              {inst.email}
            </span>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-indigo-500">
            <CalendarDays className="h-3.5 w-3.5" />
            Submitted {submitted}
          </p>
        </div>

        <div className="flex shrink-0 gap-2 sm:flex-col">
          <form action={approveInstitution}>
            <input type="hidden" name="userId" value={inst.id} />
            <button type="submit" className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-500/20 hover:text-emerald-300">
              <Check className="h-4 w-4" /> Approve
            </button>
          </form>
          <form action={rejectInstitution}>
            <input type="hidden" name="userId" value={inst.id} />
            <button type="submit" className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20 hover:text-red-300">
              <X className="h-4 w-4" /> Reject
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function InstitutionRow({ inst }: { inst: InstitutionUser }) {
  const m = inst.user_metadata;
  const date = new Date(inst.created_at).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });
  return (
    <tr className="border-b border-white/5 transition-colors hover:bg-white/[0.03]">
      <td className="py-3 pl-4 pr-3">
        <p className="text-sm font-medium text-white">{m.institution_name ?? "—"}</p>
        <p className="text-xs text-indigo-400">{m.institution_type}</p>
      </td>
      <td className="px-3 py-3">
        <p className="text-sm text-indigo-200">{m.full_name}</p>
        <p className="text-xs text-indigo-400">{m.designation}</p>
      </td>
      <td className="px-3 py-3 text-sm text-indigo-300">
        {[m.city, m.state].filter(Boolean).join(", ") || "—"}
      </td>
      <td className="px-3 py-3 text-sm text-indigo-300">{inst.email}</td>
      <td className="px-3 py-3"><StatusBadge status={m.status} /></td>
      <td className="py-3 pl-3 pr-4 text-sm text-indigo-500">{date}</td>
    </tr>
  );
}

export async function KernalView() {
  const institutions = await listInstitutions();
  const pending  = institutions.filter((i) => i.user_metadata.status === "pending");
  const active   = institutions.filter((i) => i.user_metadata.status === "active");
  const rejected = institutions.filter((i) => i.user_metadata.status === "rejected");

  const stats = [
    { label: "Total institutions", value: institutions.length, icon: Building2,    color: "bg-indigo-500/15 text-indigo-400" },
    { label: "Pending review",     value: pending.length,      icon: Clock,         color: "bg-amber-500/15  text-amber-400"  },
    { label: "Active",             value: active.length,       icon: CheckCircle2,  color: "bg-emerald-500/15 text-emerald-400" },
    { label: "Rejected",           value: rejected.length,     icon: XCircle,       color: "bg-red-500/15    text-red-400"    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-6 py-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="mt-1 text-sm text-indigo-400">Manage institution onboarding requests and approvals.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-base font-semibold text-white">Pending approval</h2>
          {pending.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-xs font-semibold text-amber-400">
              {pending.length}
            </span>
          )}
        </div>
        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-14 text-center">
            <Inbox className="h-8 w-8 text-indigo-600" />
            <p className="text-sm font-medium text-indigo-300">No pending applications</p>
            <p className="text-xs text-indigo-500">New institution requests will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((inst) => <PendingCard key={inst.id} inst={inst} />)}
          </div>
        )}
      </section>

      {institutions.length > 0 && (
        <section>
          <h2 className="mb-4 text-base font-semibold text-white">All institutions</h2>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  {["Institution", "Contact", "Location", "Email", "Status", "Date"].map((h) => (
                    <th key={h} className={`py-3 text-xs font-semibold uppercase tracking-wider text-indigo-500 ${h === "Institution" ? "pl-4 pr-3" : h === "Date" ? "pl-3 pr-4" : "px-3"}`}>
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
        </section>
      )}
    </div>
  );
}
