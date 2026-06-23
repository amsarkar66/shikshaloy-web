"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users, GraduationCap, UserPlus, UserMinus,
  Search, Plus, Download, ChevronLeft, ChevronRight,
  Eye, Pencil, ArrowUpDown, ArrowUp, ArrowDown, X, Briefcase,
  Shield, CheckCircle2, Loader2,
} from "lucide-react";
import {
  ALL_STAFF, avatarColor, initials, deptColor, formatJoinDate,
  type StaffMember, type StaffStatus,
} from "./_data/staff";
import { assignStaffTemplate } from "./actions";

// ── Permission templates ──────────────────────────────────────────────────────

const PERMISSION_TEMPLATES = [
  { id: "librarian",    name: "Librarian"    },
  { id: "warden",       name: "Warden"       },
  { id: "accountant",   name: "Accountant"   },
  { id: "hr_manager",   name: "HR Manager"   },
  { id: "receptionist", name: "Receptionist" },
  { id: "lab_assistant",name: "Lab Assistant"},
];

// ── Types ─────────────────────────────────────────────────────────────────────

type SortField = "name" | "department" | "joinedDate" | "status";
type SortDir   = "asc" | "desc";

const STATUS_BADGE: Record<StaffStatus, string> = {
  active:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  on_leave: "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  inactive: "bg-zinc-100       text-zinc-500    dark:bg-zinc-800      dark:text-zinc-400    border-zinc-200 dark:border-zinc-700",
};

const STATUS_LABEL: Record<StaffStatus, string> = {
  active:   "Active",
  on_leave: "On Leave",
  inactive: "Inactive",
};

const PAGE_SIZE = 10;

// ── Stats ─────────────────────────────────────────────────────────────────────

function StatsRow() {
  const total       = ALL_STAFF.length;
  const teaching    = ALL_STAFF.filter((s) => s.type === "teaching").length;
  const onLeave     = ALL_STAFF.filter((s) => s.status === "on_leave").length;
  const newThisYear = ALL_STAFF.filter((s) => s.joinedDate >= "2026-01-01").length;

  const items = [
    { label: "Total Staff",    value: total,       icon: Users,        accent: "text-blue-500    bg-blue-500/10"    },
    { label: "Teaching Staff", value: teaching,    icon: GraduationCap,accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "On Leave Today", value: onLeave,     icon: UserMinus,    accent: "text-amber-500   bg-amber-500/10"   },
    { label: "New This Year",  value: newThisYear, icon: UserPlus,     accent: "text-emerald-500 bg-emerald-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s) => (
        <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}>
            <s.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Sort icon ─────────────────────────────────────────────────────────────────

function SortIcon({ field, active, dir }: { field: string; active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

// ── Permission badge ──────────────────────────────────────────────────────────

function PermissionBadge({ name }: { name?: string }) {
  if (!name) return <span className="text-xs text-gray-400 dark:text-zinc-500">—</span>;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
      <Shield className="h-2.5 w-2.5" />
      {name}
    </span>
  );
}

// ── Edit Permission Modal ─────────────────────────────────────────────────────

function EditPermissionModal({
  staff,
  onClose,
  onSave,
}: {
  staff: StaffMember;
  onClose: () => void;
  onSave: (staffId: number, templateId: string, templateName: string) => void;
}) {
  const [templateId,   setTemplateId]   = useState(staff.permissionTemplateId ?? "");
  const [status,       setStatus]       = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSave() {
    setStatus("saving");
    try {
      const template = PERMISSION_TEMPLATES.find((t) => t.id === templateId);
      await assignStaffTemplate(
        String(staff.id),
        template?.name ?? "",
        templateId
      );
      setStatus("saved");
      onSave(staff.id, templateId, template?.name ?? "");
      setTimeout(onClose, 800);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Edit Permission Template</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">{staff.name}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">
            Permission Template
          </label>
          <div className="relative">
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">— None —</option>
              {PERMISSION_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          {templateId && (
            <p className="text-[11px] text-gray-400 dark:text-zinc-500">
              This staff member will see &ldquo;{PERMISSION_TEMPLATES.find((t) => t.id === templateId)?.name}&rdquo; as their role label on next login.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded-lg border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={status === "saving" || status === "saved"}
            className="flex items-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 px-4 py-2 text-sm font-medium text-white transition-colors"
          >
            {status === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {status === "saved"  && <CheckCircle2 className="h-3.5 w-3.5" />}
            {status === "error"  ? "Retry" : status === "saved" ? "Saved" : "Save"}
          </button>
        </div>

        {status === "error" && (
          <p className="text-xs text-red-500 text-center -mt-2">Failed to save. Please try again.</p>
        )}
      </div>
    </div>
  );
}

// ── Invite Staff Modal ────────────────────────────────────────────────────────

function InviteStaffModal({ onClose }: { onClose: () => void }) {
  const [fullName,    setFullName]    = useState("");
  const [email,       setEmail]       = useState("");
  const [templateId,  setTemplateId]  = useState("");
  const [status,      setStatus]      = useState<"idle" | "saving" | "sent" | "error">("idle");

  async function handleInvite() {
    if (!email.trim()) return;
    setStatus("saving");
    try {
      const template = PERMISSION_TEMPLATES.find((t) => t.id === templateId);
      await assignStaffTemplate(
        `invite:${email}`,
        template?.name ?? "",
        templateId
      );
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Invite Staff Member</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">They will receive an email to set their password.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {status === "sent" ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-50">Invite sent to {email}</p>
            <button onClick={onClose} className="rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Full Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Arjun Mehta"
                  className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@school.edu"
                  className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Permission Template</label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">— None —</option>
                  {PERMISSION_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                  Determines which modules this staff member can access.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button onClick={onClose} className="rounded-lg border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={!email.trim() || status === "saving"}
                className="flex items-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors"
              >
                {status === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Send Invite
              </button>
            </div>

            {status === "error" && (
              <p className="text-xs text-red-500 text-center -mt-2">Failed to send invite. Please try again.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StaffPage() {
  const [staffList,    setStaffList]   = useState<StaffMember[]>(ALL_STAFF);
  const [query,        setQuery]       = useState("");
  const [typeFilter,   setType]        = useState("all");
  const [statusFilter, setStatus]      = useState("all");
  const [sortField,    setSortField]   = useState<SortField>("name");
  const [sortDir,      setSortDir]     = useState<SortDir>("asc");
  const [page,         setPage]        = useState(1);
  const [editingStaff, setEditingStaff]= useState<StaffMember | null>(null);
  const [showInvite,   setShowInvite]  = useState(false);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  function handlePermissionSaved(staffId: number, templateId: string, templateName: string) {
    setStaffList((prev) =>
      prev.map((s) =>
        s.id === staffId
          ? { ...s, permissionTemplateId: templateId, permissionTemplateName: templateName || undefined }
          : s
      )
    );
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return staffList.filter((s) => {
      const matchQ  = !q || s.name.toLowerCase().includes(q) || s.employeeId.toLowerCase().includes(q) || s.designation.toLowerCase().includes(q);
      const matchTy = typeFilter   === "all" || s.type   === typeFilter;
      const matchSt = statusFilter === "all" || s.status === statusFilter;
      return matchQ && matchTy && matchSt;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === "name")       cmp = a.name.localeCompare(b.name);
      if (sortField === "department") cmp = a.department.localeCompare(b.department);
      if (sortField === "joinedDate") cmp = a.joinedDate.localeCompare(b.joinedDate);
      if (sortField === "status")     cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [query, typeFilter, statusFilter, sortField, sortDir, staffList]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function clearFilters() { setQuery(""); setType("all"); setStatus("all"); setPage(1); }
  const hasFilter = query || typeFilter !== "all" || statusFilter !== "all";

  return (
    <div className="w-full px-6 py-6 space-y-5">

      <StatsRow />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by name, employee ID or designation…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all">All Types</option>
          <option value="teaching">Teaching</option>
          <option value="non_teaching">Non-Teaching</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="on_leave">On Leave</option>
          <option value="inactive">Inactive</option>
        </select>

        {hasFilter && (
          <button
            onClick={clearFilters}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}

        <div className="flex gap-2 sm:ml-auto">
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button
            onClick={() => setShowInvite(true)}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Invite Staff
          </button>
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-zinc-500">
          Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of{" "}
          <span className="font-medium text-gray-700 dark:text-zinc-300">{staffList.length}</span> staff members
        </p>
        {hasFilter && (
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Filters active</span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                <th className="py-3 pl-4 pr-3 text-left">
                  <button onClick={() => toggleSort("name")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                    Staff <SortIcon field="name" active={sortField === "name"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left">
                  <button onClick={() => toggleSort("department")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                    Department <SortIcon field="department" active={sortField === "department"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                  Contact
                </th>
                <th className="px-3 py-3 text-left">
                  <button onClick={() => toggleSort("joinedDate")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                    Joined <SortIcon field="joinedDate" active={sortField === "joinedDate"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left">
                  <button onClick={() => toggleSort("status")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                    Status <SortIcon field="status" active={sortField === "status"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                  Permission
                </th>
                <th className="py-3 pl-3 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Briefcase className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
                      <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No staff members found</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageData.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">

                    {/* Staff */}
                    <td className="py-3 pl-4 pr-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(s.id)}`}>
                          {initials(s.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{s.name}</p>
                          <p className="text-xs text-gray-400 dark:text-zinc-500">{s.employeeId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Designation & Department */}
                    <td className="px-3 py-3">
                      <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate max-w-[200px]">{s.designation}</p>
                      <span className={`mt-0.5 inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${deptColor(s.department)}`}>
                        {s.department}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="px-3 py-3">
                      <p className="text-sm text-gray-700 dark:text-zinc-300">{s.phone}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500 truncate max-w-[180px]">{s.email}</p>
                    </td>

                    {/* Joined */}
                    <td className="px-3 py-3 text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">
                      {formatJoinDate(s.joinedDate)}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[s.status]}`}>
                        {STATUS_LABEL[s.status]}
                      </span>
                    </td>

                    {/* Permission */}
                    <td className="px-3 py-3">
                      {s.type === "non_teaching"
                        ? <PermissionBadge name={s.permissionTemplateName} />
                        : <span className="text-xs text-gray-300 dark:text-zinc-600">N/A</span>
                      }
                    </td>

                    {/* Actions */}
                    <td className="py-3 pl-3 pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/staff/${s.id}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                        {s.type === "non_teaching" && (
                          <button
                            onClick={() => setEditingStaff(s)}
                            title="Edit permission"
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce<(number | "…")[]>((acc, n, i, arr) => {
                  if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push("…");
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) =>
                  n === "…" ? (
                    <span key={`e-${i}`} className="px-1 text-xs text-gray-400 dark:text-zinc-500">…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n as number)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                        page === n
                          ? "bg-indigo-500 text-white"
                          : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {n}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {editingStaff && (
        <EditPermissionModal
          staff={editingStaff}
          onClose={() => setEditingStaff(null)}
          onSave={handlePermissionSaved}
        />
      )}
      {showInvite && (
        <InviteStaffModal onClose={() => setShowInvite(false)} />
      )}
    </div>
  );
}
