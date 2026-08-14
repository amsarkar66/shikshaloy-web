"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, GraduationCap, UserPlus, UserMinus, Upload,
  Search, Plus, Download, ChevronLeft, ChevronRight, ChevronDown,
  Eye, Pencil, ArrowUpDown, ArrowUp, ArrowDown, X, Briefcase,
  Shield, CheckCircle2, Loader2,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";
import { deptColor, formatJoinDate } from "../_data/staff";
import { assignStaffTemplate, inviteStaffMember, bulkImportStaff, type BulkImportOutcome } from "../actions";
import { BulkImportModal, type ImportColumn } from "../../_components/bulk-import-modal";

const STAFF_IMPORT_COLUMNS: ImportColumn[] = [
  { key: "name",        label: "Name",        required: true },
  { key: "employeeId",  label: "Employee ID", required: true },
  { key: "type",        label: "Type" },
  { key: "designation", label: "Designation" },
  { key: "department",  label: "Department" },
  { key: "phone",       label: "Phone" },
  { key: "email",       label: "Email" },
];

export type StaffStatus = "active" | "on_leave" | "inactive";
export type StaffType   = "teaching" | "non_teaching";

export interface StaffMember {
  id: string;
  name: string;
  employeeId: string;
  type: StaffType;
  designation: string;
  department: string;
  phone: string;
  email: string;
  joinedDate: string;
  status: StaffStatus;
  permissionTemplateId?: string;
  permissionTemplateName?: string;
}

const AVATAR_COLORS = [
  "bg-blue-500","bg-violet-500","bg-emerald-500","bg-rose-500",
  "bg-amber-500","bg-teal-500","bg-indigo-500","bg-pink-500",
  "bg-cyan-500","bg-orange-500",
];
function avatarColor(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export interface PermissionTemplate {
  id: string;
  name: string;
}

type SortField = "name" | "department" | "joinedDate" | "status";
type SortDir   = "asc" | "desc";

const STATUS_BADGE: Record<StaffStatus, string> = {
  active:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  on_leave: "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  inactive: "bg-zinc-100       text-zinc-500    dark:bg-zinc-800      dark:text-zinc-400    border-zinc-200 dark:border-zinc-700",
};
const STATUS_LABEL: Record<StaffStatus, string> = {
  active: "Active", on_leave: "On Leave", inactive: "Inactive",
};

const PAGE_SIZE = 10;

function StatsRow({ staff }: { staff: StaffMember[] }) {
  const total       = staff.length;
  const teaching    = staff.filter((s) => s.type === "teaching").length;
  const onLeave     = staff.filter((s) => s.status === "on_leave").length;
  const newThisYear = staff.filter((s) => s.joinedDate >= "2026-01-01").length;
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

function SortIcon({ field, active, dir }: { field: string; active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

function PermissionBadge({ name }: { name?: string }) {
  if (!name) return <span className="text-xs text-gray-400 dark:text-zinc-500">—</span>;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 px-2 py-0.5 text-[11px] font-medium text-primary-600 dark:text-primary-400">
      <Shield className="h-2.5 w-2.5" /> {name}
    </span>
  );
}

function EditPermissionModal({ staff, templates, onClose, onSave }: { staff: StaffMember; templates: PermissionTemplate[]; onClose: () => void; onSave: (id: string, tid: string, tname: string) => void }) {
  const [templateId, setTemplateId] = useState(staff.permissionTemplateId ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSave() {
    setStatus("saving");
    setError("");
    try {
      const template = templates.find((t) => t.id === templateId);
      await assignStaffTemplate(staff.id, templateId, template?.name ?? "");
      setStatus("saved");
      onSave(staff.id, templateId, template?.name ?? "");
      setTimeout(onClose, 800);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to save. Please try again.");
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
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Permission Template</label>
          <div className="relative">
            <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
              <option value="">— None —</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded-lg border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={status === "saving" || status === "saved"} className="flex items-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 px-4 py-2 text-sm font-medium text-white transition-colors">
            {status === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {status === "saved"  && <CheckCircle2 className="h-3.5 w-3.5" />}
            {status === "error" ? "Retry" : status === "saved" ? "Saved" : "Save"}
          </button>
        </div>
        {status === "error" && <p className="text-xs text-red-500 text-center -mt-2">{error}</p>}
      </div>
    </div>
  );
}

function InviteStaffModal({ templates, onClose, onInvited }: { templates: PermissionTemplate[]; onClose: () => void; onInvited: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [type, setType] = useState<StaffType>("teaching");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleInvite() {
    if (!fullName.trim() || !email.trim()) return;
    setStatus("saving");
    setError("");
    try {
      const template = templates.find((t) => t.id === templateId);
      await inviteStaffMember({
        fullName,
        email,
        employeeId,
        type,
        designation,
        department,
        templateId,
        templateName: template?.name ?? "",
      });
      setStatus("sent");
      onInvited();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to send invite. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Invite Staff Member</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">They will receive an email with login credentials.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"><X className="h-4 w-4" /></button>
        </div>
        {status === "sent" ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10"><CheckCircle2 className="h-6 w-6 text-emerald-500" /></div>
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-50">Invite sent to {email}</p>
            <button onClick={onClose} className="rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors">Done</button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5 col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Full Name</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="staff@school.edu" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Employee ID</label>
                  <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="EMP021" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Staff Type</label>
                  <div className="relative">
                    <select value={type} onChange={(e) => setType(e.target.value as StaffType)} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                      <option value="teaching">Teaching</option>
                      <option value="non_teaching">Non-Teaching</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Designation</label>
                  <input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Mathematics Teacher" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Department</label>
                  <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Mathematics" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
                </div>
              </div>
              {type === "non_teaching" && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Permission Template</label>
                  <div className="relative">
                    <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                      <option value="">— None —</option>
                      {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button onClick={onClose} className="rounded-lg border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
              <button onClick={handleInvite} disabled={!fullName.trim() || !email.trim() || status === "saving"} className="flex items-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors">
                {status === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Send Invite
              </button>
            </div>
            {status === "error" && <p className="text-xs text-red-500 text-center -mt-2">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}

export default function StaffClient({ initialStaff, permissionTemplates }: { initialStaff: StaffMember[]; permissionTemplates: PermissionTemplate[] }) {
  const router = useRouter();
  const [staffList,    setStaffList]    = useState<StaffMember[]>(initialStaff);
  const [query,        setQuery]        = useState("");
  const [typeFilter,   setType]         = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField,    setSortField]    = useState<SortField>("name");
  const [sortDir,      setSortDir]      = useState<SortDir>("asc");
  const [page,         setPage]         = useState(1);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [showInvite,   setShowInvite]   = useState(false);
  const [importOpen,   setImportOpen]   = useState(false);
  const [importBusy,   setImportBusy]   = useState(false);
  const [importResult, setImportResult] = useState<BulkImportOutcome | null>(null);

  async function handleImport(rows: Record<string, string>[]) {
    setImportBusy(true);
    setImportResult(null);
    try {
      const outcome = await bulkImportStaff(
        rows.map((r) => ({
          name: r.name || "", employeeId: r.employeeId || "", type: r.type || "",
          designation: r.designation || "", department: r.department || "",
          phone: r.phone || "", email: r.email || "",
        }))
      );
      setImportResult(outcome);
      router.refresh();
    } finally {
      setImportBusy(false);
    }
  }

  function handleExport() {
    const header = ["Employee ID", "Name", "Type", "Designation", "Department", "Phone", "Email", "Joined", "Status"];
    const csvRows = filtered.map((s) => [
      s.employeeId, s.name, s.type, s.designation, s.department, s.phone, s.email, s.joinedDate, s.status,
    ]);
    const csv = [header, ...csvRows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  function handlePermissionSaved(id: string, templateId: string, templateName: string) {
    setStaffList((prev) =>
      prev.map((s) => s.id === id ? { ...s, permissionTemplateId: templateId, permissionTemplateName: templateName || undefined } : s)
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
  function clearFilters() { setQuery(""); setType("all"); setStatusFilter("all"); setPage(1); }
  const hasFilter = query || typeFilter !== "all" || statusFilter !== "all";

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <StatsRow staff={staffList} />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search by name, employee ID or designation…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </div>
        <div className="relative">
          <select value={typeFilter} onChange={(e) => { setType(e.target.value); setPage(1); }} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All Types</option>
            <option value="teaching">Teaching</option>
            <option value="non_teaching">Non-Teaching</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        {hasFilter && (
          <button onClick={clearFilters} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
        <div className="flex gap-2 sm:ml-auto">
          <button onClick={handleExport} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button
            onClick={() => setImportOpen(true)}
            disabled={importBusy}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-50"
          >
            {importBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Import
          </button>
          <FancyButton onClick={() => setShowInvite(true)} size="sm">
            <Plus className="h-4 w-4" /> Invite Staff
          </FancyButton>
        </div>
      </div>

      <BulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Staff"
        columns={STAFF_IMPORT_COLUMNS}
        onImport={handleImport}
      />

      {importResult && (
        <div className="flex items-start gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 px-4 py-2.5 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
          <div>
            <p className="text-gray-700 dark:text-zinc-300">
              Imported {importResult.succeeded} staff member{importResult.succeeded === 1 ? "" : "s"}
              {importResult.failed.length > 0 && `, ${importResult.failed.length} failed`}.
            </p>
            {importResult.failed.length > 0 && (
              <ul className="mt-1 text-xs text-red-600 dark:text-red-400 space-y-0.5">
                {importResult.failed.map((f, i) => <li key={i}>{f.row}: {f.reason}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}

      {hasFilter && (
        <div className="flex items-center justify-end">
          <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">Filters active</span>
        </div>
      )}

      <Table
        footer={totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
              <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> staff members
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p-1))} disabled={page===1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"><ChevronLeft className="h-3.5 w-3.5" /></button>
              {Array.from({length:totalPages},(_,i)=>i+1).filter((n)=>n===1||n===totalPages||Math.abs(n-page)<=1).reduce<(number|"…")[]>((acc,n,i,arr)=>{if(i>0&&n-(arr[i-1] as number)>1)acc.push("…");acc.push(n);return acc;},[]).map((n,i)=>n==="…"?<span key={`e${i}`} className="px-1 text-xs text-gray-400">…</span>:<button key={n} onClick={()=>setPage(n as number)} className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${page===n?"bg-primary-500 text-white":"border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"}`}>{n}</button>)}
              <button onClick={() => setPage((p) => Math.min(totalPages, p+1))} disabled={page===totalPages} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"><ChevronRight className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        )}
      >
        <TableHead>
          <Th position="first"><button onClick={() => toggleSort("name")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Staff <SortIcon field="name" active={sortField==="name"} dir={sortDir} /></button></Th>
          <Th><button onClick={() => toggleSort("department")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Department <SortIcon field="department" active={sortField==="department"} dir={sortDir} /></button></Th>
          <Th>Contact</Th>
          <Th><button onClick={() => toggleSort("joinedDate")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Joined <SortIcon field="joinedDate" active={sortField==="joinedDate"} dir={sortDir} /></button></Th>
          <Th><button onClick={() => toggleSort("status")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Status <SortIcon field="status" active={sortField==="status"} dir={sortDir} /></button></Th>
          <Th>Permission</Th>
          <Th position="last" align="right">Actions</Th>
        </TableHead>
        <TableBody>
          {pageData.length === 0 ? (
            <TableEmptyRow colSpan={7} icon={Briefcase} message="No staff members found" />
          ) : (
            pageData.map((s) => (
              <Tr key={s.id}>
                <Td position="first">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(s.id)}`}>{initials(s.name)}</div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{s.name}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">{s.employeeId}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate max-w-[200px]">{s.designation}</p>
                  <span className={`mt-0.5 inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${deptColor(s.department)}`}>{s.department}</span>
                </Td>
                <Td>
                  <p className="text-sm text-gray-700 dark:text-zinc-300">{s.phone}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 truncate max-w-[180px]">{s.email}</p>
                </Td>
                <Td className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{formatJoinDate(s.joinedDate)}</Td>
                <Td><span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[s.status]}`}>{STATUS_LABEL[s.status]}</span></Td>
                <Td>{s.type === "non_teaching" ? <PermissionBadge name={s.permissionTemplateName} /> : <span className="text-xs text-gray-300 dark:text-zinc-600">N/A</span>}</Td>
                <Td position="last">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/dashboard/staff/${s.id}`} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"><Eye className="h-3.5 w-3.5" /></Link>
                    {s.type === "non_teaching" && (
                      <button onClick={() => setEditingStaff(s)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                    )}
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </TableBody>
      </Table>

      {editingStaff && <EditPermissionModal staff={editingStaff} templates={permissionTemplates} onClose={() => setEditingStaff(null)} onSave={handlePermissionSaved} />}
      {showInvite && <InviteStaffModal templates={permissionTemplates} onClose={() => setShowInvite(false)} onInvited={() => router.refresh()} />}
    </div>
  );
}
