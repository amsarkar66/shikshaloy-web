"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Edit2, MoreHorizontal, Landmark, MapPin, Phone, Mail, Globe,
  GraduationCap, Briefcase, UserCog, CalendarDays, CreditCard, TrendingUp,
  Users, ClipboardCheck, Megaphone, UserPlus, CalendarRange, Receipt,
  RefreshCw, Trash2, Loader2, Plus, AlertTriangle, CheckCircle2, Clock,
  ExternalLink,
} from "lucide-react";
import { STATUS_BADGE, formatLakh, type SchoolStatus } from "../../_data/schools";
import { setActiveSchool } from "../../../_components/school-switcher-actions";

// The standalone public site (shikshaloy-institution-site) reads this school
// via a `?school=` query param — see its SchoolContext. Point this at your
// deployed site's URL once one exists; defaults to its local dev server.
const INSTITUTION_SITE_URL = process.env.NEXT_PUBLIC_INSTITUTION_SITE_URL || "http://localhost:5173";

export interface SchoolDetail {
  id: string;
  name: string;
  shortName: string | null;
  institutionType: string;
  board: string | null;
  gradesFrom: string | null;
  gradesTo: string | null;
  establishedYear: number | null;
  status: SchoolStatus;
  address: string | null;
  city: string;
  state: string;
  country: string;
  pinCode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logoUrl: string | null;
  principalName: string | null;
  principalEmail: string | null;
  principalPhone: string | null;
  principalDesignation: string | null;
  createdAt: string;
  students: number;
  teachingStaff: number;
  nonTeachingStaff: number;
  admins: number;
  attendancePct: number;
  feePct: number;
  monthlyRevenue: number;
}

export interface SchoolActivity {
  action: string;
  module: string;
  description: string;
  actorName: string;
  time: string;
}

const ACTION_ICON: Record<string, React.ElementType> = {
  create: Plus, update: ClipboardCheck, delete: AlertTriangle,
  approve: CheckCircle2, reject: AlertTriangle, login: Clock,
};
const MODULE_COLOR: Record<string, string> = {
  Fees: "text-emerald-500 bg-emerald-500/10",
  Attendance: "text-sky-500 bg-sky-500/10",
  Students: "text-blue-500 bg-blue-500/10",
  Staff: "text-violet-500 bg-violet-500/10",
  Leave: "text-amber-500 bg-amber-500/10",
  Settings: "text-gray-500 bg-gray-500/10",
  Admissions: "text-blue-500 bg-blue-500/10",
  Announcements: "text-violet-500 bg-violet-500/10",
};

const QUICK_LINKS = [
  { label: "Staff",              href: "/dashboard/staff",             icon: Briefcase,     color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20" },
  { label: "Admissions",         href: "/dashboard/admissions",        icon: UserPlus,      color: "text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20" },
  { label: "Academic Calendar",  href: "/dashboard/academic-calendar", icon: CalendarRange, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20" },
  { label: "Exams & Results",    href: "/dashboard/exams",             icon: ClipboardCheck, color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/20" },
  { label: "Fee Collection",     href: "/dashboard/fee-collection",    icon: Receipt,       color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20" },
  { label: "Announcements",      href: "/dashboard/announcements",     icon: Megaphone,     color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20" },
] as const;

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-400" />
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 dark:text-zinc-500">{label}</p>
        <p className="text-xs font-medium text-gray-800 dark:text-zinc-200 break-words">{value}</p>
      </div>
    </div>
  );
}

function StatTile({ label, value, icon: Icon, accent }: { label: string; value: string; icon: React.ElementType; accent: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 px-4 py-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight text-gray-900 dark:text-zinc-50">{value}</p>
        <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{label}</p>
      </div>
    </div>
  );
}

function MiniBar({ label, value, pct, colorClass }: { label: string; value: string; pct: number; colorClass: string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-gray-500 dark:text-zinc-400">{label}</span>
        <span className="font-semibold text-gray-700 dark:text-zinc-300">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
        <div className={`h-1.5 rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function MoreMenu({ schoolId, open, onToggle }: { schoolId: string; open: boolean; onToggle: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSwitch() {
    startTransition(async () => {
      await setActiveSchool(schoolId);
      onToggle();
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
      >
        <MoreHorizontal className="h-3.5 w-3.5" /> More
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute right-0 top-full mt-1.5 z-20 w-52 overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg shadow-black/10 py-1">
            <button
              onClick={handleSwitch}
              disabled={isPending}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 shrink-0" />}
              Switch to this school
            </button>
            <Link
              href="/dashboard/principals"
              onClick={onToggle}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors"
            >
              <UserCog className="h-3.5 w-3.5 shrink-0" />
              Manage admins
            </Link>
            <a
              href={`${INSTITUTION_SITE_URL}/?school=${schoolId}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onToggle}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              View school as public
            </a>
            <button
              onClick={onToggle}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              Remove school
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function SchoolDetailClient({ school, activity }: { school: SchoolDetail; activity: SchoolActivity[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const badge = STATUS_BADGE[school.status];
  const location = [school.city, school.state, school.country].filter((s) => s && s !== "—").join(", ");
  const grades = school.gradesFrom && school.gradesTo ? `Grades ${school.gradesFrom}–${school.gradesTo}` : null;
  const initials = school.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const attendanceColor = school.attendancePct >= 95 ? "bg-emerald-500" : school.attendancePct >= 90 ? "bg-blue-500" : "bg-amber-500";
  const feeColor = school.feePct >= 85 ? "bg-emerald-500" : school.feePct >= 75 ? "bg-blue-500" : "bg-amber-500";
  const totalStaff = school.teachingStaff + school.nonTeachingStaff;

  return (
    <div className="w-full px-6 py-6 space-y-6">

      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/dashboard/schools" className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Schools
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/schools/${school.id}/edit`}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-violet-500 hover:bg-violet-600 px-4 text-sm font-medium text-white transition-colors shadow shadow-violet-500/20"
          >
            <Edit2 className="h-3.5 w-3.5" /> Edit
          </Link>
          <MoreMenu schoolId={school.id} open={menuOpen} onToggle={() => setMenuOpen((o) => !o)} />
        </div>
      </div>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 rounded-2xl px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {school.logoUrl ? (
              <img src={school.logoUrl} alt="" className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-4 ring-white dark:ring-zinc-900 bg-white" />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-violet-500 text-2xl font-bold text-white ring-4 ring-white dark:ring-zinc-900">
                {initials || <Landmark className="h-8 w-8" />}
              </div>
            )}
            <div className="min-w-0 flex-1 pt-1 sm:pt-0 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-50">{school.name}</h1>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badge.cls}`}>{badge.label}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                  {school.institutionType}
                </span>
                {school.board && <span>{school.board}</span>}
                {grades && <span>{grades}</span>}
                {school.establishedYear && <span>Est. {school.establishedYear}</span>}
                {location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-violet-400" />{location}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatTile label="Students"       value={school.students.toLocaleString()}   icon={GraduationCap} accent="text-blue-500 bg-blue-500/10" />
        <StatTile label="Staff"          value={totalStaff.toString()}               icon={Briefcase}     accent="text-emerald-500 bg-emerald-500/10" />
        <StatTile label="Admins"         value={school.admins.toString()}            icon={UserCog}       accent="text-violet-500 bg-violet-500/10" />
        <StatTile label="Attendance"     value={`${school.attendancePct}%`}          icon={TrendingUp}    accent="text-sky-500 bg-sky-500/10" />
        <StatTile label="Fee collection" value={`${school.feePct}%`}                 icon={CreditCard}    accent="text-indigo-500 bg-indigo-500/10" />
        <StatTile label="Monthly revenue" value={formatLakh(school.monthlyRevenue)}  icon={Users}         accent="text-amber-500 bg-amber-500/10" />
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left */}
        <div className="lg:col-span-2 space-y-6">

          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
            <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50">About</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={MapPin} label="Address" value={[school.address, school.pinCode].filter(Boolean).join(", ") || location || "—"} />
              <InfoRow icon={Phone} label="Phone" value={school.phone ?? "—"} />
              <InfoRow icon={Mail} label="Email" value={school.email ?? "—"} />
              <InfoRow icon={Globe} label="Website" value={school.website ?? "—"} />
              <InfoRow icon={CalendarDays} label="Onboarded" value={new Date(school.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} />
              <InfoRow icon={Landmark} label="Board" value={school.board ?? "—"} />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
            <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50">Staff & performance</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-lg border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-3 py-2.5">
                <p className="text-lg font-bold text-gray-900 dark:text-zinc-50">{school.teachingStaff}</p>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400">Teaching staff</p>
              </div>
              <div className="rounded-lg border border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-3 py-2.5">
                <p className="text-lg font-bold text-gray-900 dark:text-zinc-50">{school.nonTeachingStaff}</p>
                <p className="text-[11px] text-gray-500 dark:text-zinc-400">Non-teaching staff</p>
              </div>
            </div>
            <div className="space-y-3">
              <MiniBar label="Attendance (avg)" value={`${school.attendancePct}%`} pct={school.attendancePct} colorClass={attendanceColor} />
              <MiniBar label="Fee collection (latest month)" value={`${school.feePct}%`} pct={school.feePct} colorClass={feeColor} />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
            <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50">Recent activity</p>
            {activity.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">No activity recorded yet</p>
            ) : (
              <div className="space-y-1">
                {activity.map((a, i) => {
                  const Icon = ACTION_ICON[a.action] ?? ClipboardCheck;
                  const color = MODULE_COLOR[a.module] ?? "text-gray-500 bg-gray-500/10";
                  return (
                    <div key={i} className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-700/30">
                      <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 leading-tight">{a.description}</p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-500">{a.actorName} · {a.module}</p>
                      </div>
                      <span className="shrink-0 text-[10px] text-gray-400 dark:text-zinc-600 whitespace-nowrap pt-0.5">{a.time}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right */}
        <div className="space-y-6">

          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
            <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50">Principal</p>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                <UserCog className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50 truncate">{school.principalName ?? "Not assigned"}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-500 truncate">{school.principalDesignation ?? "Principal"}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2.5">
              <InfoRow icon={Mail} label="Email" value={school.principalEmail ?? "—"} />
              <InfoRow icon={Phone} label="Phone" value={school.principalPhone ?? "—"} />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
            <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-zinc-50">Quick access</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_LINKS.map((l) => (
                <QuickAccessLink key={l.href} schoolId={school.id} {...l} />
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function QuickAccessLink({
  schoolId, href, label, icon: Icon, color,
}: {
  schoolId: string; href: string; label: string; icon: React.ElementType; color: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await setActiveSchool(schoolId);
      router.push(href);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium text-center transition-colors disabled:opacity-50 ${color}`}
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {label}
    </button>
  );
}
