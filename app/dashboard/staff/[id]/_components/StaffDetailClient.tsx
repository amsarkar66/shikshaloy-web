"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Pencil, Phone, Mail, Calendar, Briefcase, Building2,
  IndianRupee, CheckCircle2, AlertCircle, TrendingUp, Shield,
  Droplet, ClipboardList, IdCard, LayoutGrid, CalendarCheck, FileText,
  Bus, MapPin, Users, Wrench, Siren, Home, AlertTriangle,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import {
  STATUS_LABEL as PAYROLL_STATUS_LABEL, STATUS_BADGE as PAYROLL_STATUS_BADGE,
  formatCurrency, formatMonth, formatDate as formatPayrollDate,
  earningsOf, deductionsOf,
  type PayrollRecord,
} from "../../../payroll/_data/payroll";
import { LEAVE_TYPE_LABEL, STATUS_BADGE as LEAVE_STATUS_BADGE, type LeaveStatus } from "../../../leaves/_data/leaves";
import { FUEL_ICON, VEHICLE_STATUS_BADGE, FEE_BADGE, type FuelType, type TransportFeeStatus } from "../../../transport/_data/transport";
import AttendanceCredentialsCard from "../../../attendance/_components/AttendanceCredentialsCard";
import { EditStaffModal } from "./edit-staff-modal";
import type { DriverRoute } from "@/lib/drivers/context";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface StaffDetail {
  id: string;
  name: string;
  employeeId: string;
  phone: string;
  email: string;
  type: "teaching" | "non_teaching";
  designation: string;
  department: string;
  joinedDate: string;
  status: string;
  bloodGroup: string;
  photoUrl: string | null;
  bio: string | null;
  permissionTemplateName: string | null;
  yearsOfService: string;
  isDriver: boolean;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  licenseNumber: string;
  licenseExpiry: string | null;
}

export interface StaffLeave {
  id: string;
  leaveType: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
  approvedBy?: string;
}

export interface StaffAttendanceSummary {
  monthly: { month: string; present: number; total: number }[];
  overallPct: number;
  totalPresent: number;
  totalDays: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500",
  "bg-cyan-500", "bg-orange-500",
];

function avatarColor(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function attColor(pct: number) {
  if (pct >= 90) return { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" };
  if (pct >= 80) return { bar: "bg-amber-500",   text: "text-amber-600 dark:text-amber-400" };
  return           { bar: "bg-red-500",     text: "text-red-600 dark:text-red-400" };
}

const STATUS_BADGE: Record<string, string> = {
  active:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  on_leave: "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  inactive: "bg-zinc-100       text-zinc-500    dark:bg-zinc-800      dark:text-zinc-400    border-zinc-200 dark:border-zinc-700",
};
const STATUS_LABEL: Record<string, string> = {
  active: "Active", on_leave: "On Leave", inactive: "Inactive",
};

function licenseStatus(expiry: string | null): { label: string; cls: string } | null {
  if (!expiry) return null;
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: "Expired", cls: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" };
  if (days <= 30) return { label: "Expiring soon", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
  return { label: "Valid", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
}

function formatShortDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function serviceDueDays(nextService: string | null): number | null {
  if (!nextService) return null;
  return Math.ceil((new Date(nextService).getTime() - Date.now()) / 86400000);
}

type Tab = "overview" | "attendance" | "leaves" | "payroll" | "transport";

const BASE_TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview",   label: "Overview",   icon: LayoutGrid },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "leaves",     label: "Leaves",     icon: ClipboardList },
  { id: "payroll",    label: "Payroll",    icon: IndianRupee },
];

const TRANSPORT_TAB: { id: Tab; label: string; icon: React.ElementType } = { id: "transport", label: "Transport", icon: Bus };

// ── Component ─────────────────────────────────────────────────────────────────

export default function StaffDetailClient({
  staff, attendance, leaves, payroll, routes,
}: {
  staff: StaffDetail;
  attendance: StaffAttendanceSummary;
  leaves: StaffLeave[];
  payroll: PayrollRecord[];
  routes: DriverRoute[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [editOpen, setEditOpen] = useState(false);

  const pendingLeaves = leaves.filter((l) => l.status === "pending").length;
  const latestPayroll = payroll[0];
  const ac = attColor(attendance.overallPct);
  const chartMax = Math.max(1, ...attendance.monthly.map((m) => m.total));
  const tabs = staff.isDriver ? [...BASE_TABS, TRANSPORT_TAB] : BASE_TABS;
  const license = licenseStatus(staff.licenseExpiry);
  const totalStudents = routes.reduce((sum, r) => sum + r.roster.length, 0);
  const vehiclesDue = routes
    .map((r) => r.vehicle)
    .filter((v): v is NonNullable<typeof v> => v !== null)
    .filter((v) => { const d = serviceDueDays(v.nextService); return d !== null && d <= 14; });

  return (
    <div className="w-full px-6 py-6 space-y-6">

      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/staff"
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Staff
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">

        {/* ── Left: Info ────────────────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-6">
            <div className="flex flex-col items-center text-center gap-3">
              {staff.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={staff.photoUrl} alt={staff.name} className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
              ) : (
                <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white ${avatarColor(staff.id)}`}>
                  {initials(staff.name)}
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-50">{staff.name}</h2>
                <p className="text-sm text-gray-500 dark:text-zinc-400">{staff.designation}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[staff.status] ?? STATUS_BADGE.active}`}>
                  {STATUS_LABEL[staff.status] ?? "Active"}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400">
                  {staff.type === "teaching" ? "Teaching" : "Non-Teaching"}
                </span>
              </div>
              <FancyButton size="sm" className="w-full" onClick={() => setEditOpen(true)}>
                <Pencil className="h-3.5 w-3.5" /> Edit Profile
              </FancyButton>
            </div>

            <dl className="mt-6 space-y-4 text-sm border-t border-gray-100 dark:border-zinc-700 pt-5">
              <div className="flex items-start gap-2.5">
                <IdCard className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400 dark:text-zinc-500" />
                <div className="min-w-0">
                  <dt className="text-xs text-gray-400 dark:text-zinc-500">Employee ID</dt>
                  <dd className="font-medium text-gray-800 dark:text-zinc-200">{staff.employeeId}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Building2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400 dark:text-zinc-500" />
                <div className="min-w-0">
                  <dt className="text-xs text-gray-400 dark:text-zinc-500">Department</dt>
                  <dd className="font-medium text-gray-800 dark:text-zinc-200">{staff.department}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400 dark:text-zinc-500" />
                <div className="min-w-0">
                  <dt className="text-xs text-gray-400 dark:text-zinc-500">Phone</dt>
                  <dd className="font-medium text-gray-800 dark:text-zinc-200">{staff.phone}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400 dark:text-zinc-500" />
                <div className="min-w-0">
                  <dt className="text-xs text-gray-400 dark:text-zinc-500">Email</dt>
                  <dd className="font-medium text-gray-800 dark:text-zinc-200 break-all">{staff.email}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Droplet className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400 dark:text-zinc-500" />
                <div className="min-w-0">
                  <dt className="text-xs text-gray-400 dark:text-zinc-500">Blood Group</dt>
                  <dd className="font-medium text-gray-800 dark:text-zinc-200">{staff.bloodGroup}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Calendar className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400 dark:text-zinc-500" />
                <div className="min-w-0">
                  <dt className="text-xs text-gray-400 dark:text-zinc-500">Joined</dt>
                  <dd className="font-medium text-gray-800 dark:text-zinc-200">{staff.joinedDate} <span className="text-xs text-gray-400 dark:text-zinc-500">({staff.yearsOfService})</span></dd>
                </div>
              </div>
              {staff.address !== "—" && (
                <div className="flex items-start gap-2.5">
                  <Home className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400 dark:text-zinc-500" />
                  <div className="min-w-0">
                    <dt className="text-xs text-gray-400 dark:text-zinc-500">Address</dt>
                    <dd className="font-medium text-gray-800 dark:text-zinc-200">{staff.address}</dd>
                  </div>
                </div>
              )}
              {(staff.emergencyContactName !== "—" || staff.emergencyContactPhone !== "—") && (
                <div className="flex items-start gap-2.5">
                  <Siren className="h-3.5 w-3.5 mt-0.5 shrink-0 text-red-400" />
                  <div className="min-w-0">
                    <dt className="text-xs text-gray-400 dark:text-zinc-500">Emergency Contact</dt>
                    <dd className="font-medium text-gray-800 dark:text-zinc-200">{staff.emergencyContactName}{staff.emergencyContactPhone !== "—" ? ` · ${staff.emergencyContactPhone}` : ""}</dd>
                  </div>
                </div>
              )}
              {staff.isDriver && (
                <div className="flex items-start gap-2.5">
                  <IdCard className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400 dark:text-zinc-500" />
                  <div className="min-w-0 flex-1">
                    <dt className="text-xs text-gray-400 dark:text-zinc-500">Driving License</dt>
                    <dd className="flex items-center gap-2 font-medium text-gray-800 dark:text-zinc-200">
                      {staff.licenseNumber}
                      {license && (
                        <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${license.cls}`}>{license.label}</span>
                      )}
                    </dd>
                    {staff.licenseExpiry && (
                      <p className="text-[11px] text-gray-400 dark:text-zinc-500">Expires {formatShortDate(staff.licenseExpiry)}</p>
                    )}
                  </div>
                </div>
              )}
              {staff.type === "non_teaching" && (
                <div className="flex items-start gap-2.5">
                  <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400 dark:text-zinc-500" />
                  <div className="min-w-0">
                    <dt className="text-xs text-gray-400 dark:text-zinc-500">Permission Template</dt>
                    <dd className="font-medium text-gray-800 dark:text-zinc-200">{staff.permissionTemplateName ?? "— None —"}</dd>
                  </div>
                </div>
              )}
              {staff.bio && (
                <div className="flex items-start gap-2.5">
                  <Briefcase className="h-3.5 w-3.5 mt-0.5 shrink-0 text-gray-400 dark:text-zinc-500" />
                  <div className="min-w-0">
                    <dt className="text-xs text-gray-400 dark:text-zinc-500">Bio</dt>
                    <dd className="font-medium text-gray-800 dark:text-zinc-200">{staff.bio}</dd>
                  </div>
                </div>
              )}
            </dl>
          </div>

          <AttendanceCredentialsCard personType="staff" personId={staff.id} />
        </div>

        {/* ── Right: Data (tabbed) ─────────────────────────────────────────── */}
        <div className="space-y-5 min-w-0">
          <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800 overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  tab === id
                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
                {id === "leaves" && pendingLeaves > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500/15 px-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">{pendingLeaves}</span>
                )}
                {id === "transport" && vehiclesDue.length > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500/15 px-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">{vehiclesDue.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Overview */}
          {tab === "overview" && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Attendance",       value: attendance.totalDays ? `${attendance.overallPct}%` : "—", sub: attendance.totalDays ? `${attendance.totalPresent}/${attendance.totalDays} days recorded` : "No attendance records yet", icon: CheckCircle2, color: `${ac.text} bg-emerald-500/10` },
                { label: "Years of Service", value: staff.yearsOfService, sub: `Joined ${staff.joinedDate}`, icon: TrendingUp, color: "text-violet-600 dark:text-violet-400 bg-violet-500/10" },
                { label: "Net Salary",       value: latestPayroll ? formatCurrency(latestPayroll.net) : "—", sub: latestPayroll ? formatMonth(latestPayroll.monthStr) : "No payroll records yet", icon: IndianRupee, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10" },
                { label: "Leave Requests",   value: String(leaves.length), sub: pendingLeaves ? `${pendingLeaves} pending` : "None pending", icon: ClipboardList, color: "text-amber-600 dark:text-amber-400 bg-amber-500/10" },
                ...(staff.isDriver ? [{ label: "Students on Route", value: String(totalStudents), sub: `${routes.length} route${routes.length === 1 ? "" : "s"} assigned`, icon: Users, color: "text-teal-600 dark:text-teal-400 bg-teal-500/10" }] : []),
              ].map((st) => (
                <div key={st.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${st.color}`}>
                    <st.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-gray-900 dark:text-zinc-50 leading-tight">{st.value}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 leading-tight">{st.label}</p>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500">{st.sub}</p>
                  </div>
                </div>
              ))}

              {latestPayroll && (
                <div className="col-span-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50 flex items-center gap-2"><IndianRupee className="h-4 w-4 text-primary-500" /> Latest Payslip — {formatMonth(latestPayroll.monthStr)}</p>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PAYROLL_STATUS_BADGE[latestPayroll.status]}`}>{PAYROLL_STATUS_LABEL[latestPayroll.status]}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Net pay: <span className="font-bold text-gray-900 dark:text-zinc-50">{formatCurrency(latestPayroll.net)}</span></p>
                </div>
              )}

              {leaves.length > 0 && (
                <div className="col-span-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50 flex items-center gap-2 mb-3"><ClipboardList className="h-4 w-4 text-primary-500" /> Latest Leave Request</p>
                  {(() => {
                    const l = leaves[0];
                    const badge = LEAVE_STATUS_BADGE[l.status] ?? LEAVE_STATUS_BADGE.pending;
                    return (
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm text-gray-600 dark:text-zinc-400">
                          {LEAVE_TYPE_LABEL[l.leaveType as keyof typeof LEAVE_TYPE_LABEL] ?? l.leaveType} · {l.from} → {l.to}
                        </p>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${badge.cls}`}>{badge.label}</span>
                      </div>
                    );
                  })()}
                </div>
              )}

              {staff.isDriver && (vehiclesDue.length > 0 || license?.label === "Expiring soon" || license?.label === "Expired") && (
                <div className="col-span-2 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="text-sm text-gray-700 dark:text-zinc-300 space-y-0.5">
                    {vehiclesDue.map((v) => {
                      const d = serviceDueDays(v.nextService)!;
                      return <p key={v.id}>{v.regNo} — {d < 0 ? "service overdue" : `service due in ${d} day${d === 1 ? "" : "s"}`}</p>;
                    })}
                    {license && license.label !== "Valid" && <p>Driving license {license.label.toLowerCase()}{staff.licenseExpiry ? ` (${formatShortDate(staff.licenseExpiry)})` : ""}</p>}
                  </div>
                </div>
              )}

              {staff.isDriver && (
                <div className="col-span-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50 flex items-center gap-2"><Bus className="h-4 w-4 text-teal-500" /> Vehicle &amp; Route Assignment</p>
                    <button onClick={() => setTab("transport")} className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">View details</button>
                  </div>
                  {routes.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-zinc-500">No vehicle or route assigned yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {routes.map((r) => (
                        <div key={r.id} className="flex items-center justify-between gap-3 text-sm">
                          <span className="text-gray-700 dark:text-zinc-300">Route {r.routeNo}{r.routeName ? ` · ${r.routeName}` : ""}</span>
                          <span className="text-gray-500 dark:text-zinc-400">{r.vehicle?.regNo ?? "No vehicle"} · {r.roster.length} student{r.roster.length === 1 ? "" : "s"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Attendance */}
          {tab === "attendance" && (
            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Monthly Attendance</p>
                {attendance.monthly.length > 0 && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ac.text} bg-emerald-500/10`}>
                    {attendance.overallPct}% overall
                  </span>
                )}
              </div>
              {attendance.monthly.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-zinc-500 py-6 text-center">No attendance records yet.</p>
              ) : (
                <div className="flex items-end gap-2" style={{ height: 100 }}>
                  {attendance.monthly.map((m) => {
                    const pct = m.total ? Math.round((m.present / m.total) * 100) : 0;
                    const barH = Math.round((m.present / chartMax) * 72);
                    const c = attColor(pct);
                    return (
                      <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                        <span className={`text-[10px] font-semibold tabular-nums ${c.text}`}>{pct}%</span>
                        <div className="w-full flex flex-col justify-end" style={{ height: 72 }}>
                          <div className={`w-full rounded-t-md ${c.bar}`} style={{ height: barH || 3 }} />
                        </div>
                        <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">{m.month}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Leaves */}
          {tab === "leaves" && (
            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-indigo-500" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Leave Requests</p>
                </div>
                {pendingLeaves > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">{pendingLeaves} pending</span>
                )}
              </div>
              {leaves.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-zinc-500 py-10 text-center">No leave requests yet.</p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
                  {leaves.map((l) => {
                    const badge = LEAVE_STATUS_BADGE[l.status] ?? LEAVE_STATUS_BADGE.pending;
                    return (
                      <div key={l.id} className="px-5 py-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">
                            {LEAVE_TYPE_LABEL[l.leaveType as keyof typeof LEAVE_TYPE_LABEL] ?? l.leaveType}
                          </p>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${badge.cls}`}>{badge.label}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-400 dark:text-zinc-500">{l.from} → {l.to} · {l.days} day{l.days === 1 ? "" : "s"}{l.approvedBy ? ` · Approved by ${l.approvedBy}` : ""}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{l.reason}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Payroll */}
          {tab === "payroll" && (
            <div className="space-y-5">
              <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-primary-500" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Salary Breakdown</p>
                  </div>
                  {latestPayroll && (
                    <span className="text-xs text-gray-500 dark:text-zinc-400">{formatMonth(latestPayroll.monthStr)}</span>
                  )}
                </div>
                {!latestPayroll ? (
                  <p className="text-sm text-gray-400 dark:text-zinc-500 py-10 text-center">No payroll records yet.</p>
                ) : (
                  <div className="px-5 py-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${PAYROLL_STATUS_BADGE[latestPayroll.status]}`}>
                        {PAYROLL_STATUS_LABEL[latestPayroll.status]}
                      </span>
                      <p className="text-sm font-bold text-gray-900 dark:text-zinc-50">{formatCurrency(latestPayroll.net)} <span className="text-xs font-normal text-gray-400 dark:text-zinc-500">net</span></p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="mb-1.5 font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Earnings</p>
                        <div className="space-y-1">
                          {earningsOf(latestPayroll).map((e) => (
                            <div key={e.label} className="flex justify-between text-gray-600 dark:text-zinc-400"><span>{e.label}</span><span className="tabular-nums">{formatCurrency(e.amount)}</span></div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="mb-1.5 font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Deductions</p>
                        <div className="space-y-1">
                          {deductionsOf(latestPayroll).map((d) => (
                            <div key={d.label} className="flex justify-between text-gray-600 dark:text-zinc-400"><span>{d.label}</span><span className="tabular-nums">{formatCurrency(d.amount)}</span></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {payroll.length > 0 && (
                <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary-500" />
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Payroll History</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                          <th className="py-2.5 pl-5 pr-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Month</th>
                          <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Gross</th>
                          <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Net</th>
                          <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Status</th>
                          <th className="py-2.5 pl-3 pr-5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Paid On</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
                        {payroll.map((r) => (
                          <tr key={r.monthStr} className="hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                            <td className="py-3 pl-5 pr-3 font-medium text-gray-800 dark:text-zinc-200">{formatMonth(r.monthStr)}</td>
                            <td className="px-3 py-3 text-right tabular-nums text-gray-600 dark:text-zinc-400">{formatCurrency(r.gross)}</td>
                            <td className="px-3 py-3 text-right tabular-nums font-semibold text-gray-900 dark:text-zinc-50">{formatCurrency(r.net)}</td>
                            <td className="px-3 py-3">
                              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${PAYROLL_STATUS_BADGE[r.status]}`}>{PAYROLL_STATUS_LABEL[r.status]}</span>
                            </td>
                            <td className="py-3 pl-3 pr-5 text-gray-600 dark:text-zinc-400">
                              {r.paidOn ? (
                                <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> {formatPayrollDate(r.paidOn)}</span>
                              ) : (
                                <span className="flex items-center gap-1 text-gray-400 dark:text-zinc-500"><AlertCircle className="h-3 w-3" /> Not paid</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transport */}
          {tab === "transport" && (
            <div className="space-y-5">
              {routes.length === 0 ? (
                <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-16 text-center">
                  <Bus className="h-8 w-8 text-gray-300 dark:text-zinc-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No vehicle or route assigned yet</p>
                </div>
              ) : (
                routes.map((r) => {
                  const v = r.vehicle;
                  const dueDays = v ? serviceDueDays(v.nextService) : null;
                  const vehicleBadge = v ? (VEHICLE_STATUS_BADGE[v.status as keyof typeof VEHICLE_STATUS_BADGE] ?? VEHICLE_STATUS_BADGE.active) : "";
                  return (
                    <div key={r.id} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-teal-500" />
                          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Route {r.routeNo}{r.routeName ? ` · ${r.routeName}` : ""}</p>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-zinc-400">{r.roster.length}/{r.capacity || "—"} students</span>
                      </div>

                      <div className="p-5 space-y-4">
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-zinc-400">
                          <span>Morning <span className="font-medium text-gray-800 dark:text-zinc-200">{r.morningDeparture?.slice(0, 5) ?? "—"}</span></span>
                          <span>Evening <span className="font-medium text-gray-800 dark:text-zinc-200">{r.eveningDeparture?.slice(0, 5) ?? "—"}</span></span>
                        </div>

                        {r.stops.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {r.stops.map((stop) => (
                              <span key={stop} className="rounded-md bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-zinc-300">{stop}</span>
                            ))}
                          </div>
                        )}

                        {v ? (
                          <div className="rounded-lg border border-gray-100 dark:border-zinc-700/50 p-3.5 flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                              <Wrench className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{v.regNo}</p>
                                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${vehicleBadge}`}>{v.status}</span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-zinc-400">
                                {v.model} · {v.capacity} seats · {FUEL_ICON[v.fuelType as FuelType] ?? "⛽"} {v.fuelType}{v.year ? ` · ${v.year}` : ""}
                              </p>
                              {v.nextService && (
                                <p className={`text-xs mt-0.5 ${dueDays !== null && dueDays <= 14 ? "text-amber-600 dark:text-amber-400 font-medium" : "text-gray-400 dark:text-zinc-500"}`}>
                                  Next service {formatShortDate(v.nextService)}{dueDays !== null && dueDays <= 14 ? ` — ${dueDays < 0 ? "overdue" : `due in ${dueDays}d`}` : ""}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 dark:text-zinc-500">No vehicle assigned to this route.</p>
                        )}

                        {r.roster.length > 0 && (
                          <div className="overflow-x-auto -mx-5 -mb-5 border-t border-gray-100 dark:border-zinc-700">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                                  <th className="py-2.5 pl-5 pr-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Student</th>
                                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Class</th>
                                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Stop</th>
                                  <th className="py-2.5 pl-3 pr-5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Fee Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
                                {r.roster.map((st) => (
                                  <tr key={st.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                                    <td className="py-2.5 pl-5 pr-3">
                                      <p className="font-medium text-gray-800 dark:text-zinc-200">{st.fullName}</p>
                                      <p className="text-xs text-gray-400 dark:text-zinc-500">Roll {st.rollNo}</p>
                                    </td>
                                    <td className="px-3 py-2.5 text-gray-600 dark:text-zinc-400">{st.classNum}-{st.section}</td>
                                    <td className="px-3 py-2.5 text-gray-600 dark:text-zinc-400">{st.stopName}</td>
                                    <td className="py-2.5 pl-3 pr-5">
                                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${FEE_BADGE[st.feeStatus as TransportFeeStatus] ?? FEE_BADGE.overdue}`}>{st.feeStatus}</span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {editOpen && (
        <EditStaffModal
          staffId={staff.id}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); router.refresh(); }}
        />
      )}
    </div>
  );
}
