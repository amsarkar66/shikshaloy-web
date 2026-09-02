"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, ChevronDown, Users, GraduationCap, Briefcase, UserCog, Landmark,
  Plus, Upload, X, CheckCircle2, Loader2,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";
import { BulkImportModal, type ImportColumn } from "../../_components/bulk-import-modal";
import { inviteStaffMember, bulkImportStaff, getStaffTemplatesForSchool, type BulkImportOutcome } from "../../staff/actions";
import { invitePrincipal } from "../../principals/actions";

export interface SchoolOption {
  id: string;
  name: string;
}

export interface StudentRow {
  id: string;
  name: string;
  rollNo: string;
  class: string;
  gender: string | null;
  phone: string;
  status: "active" | "inactive" | "graduated";
  schoolId: string;
  schoolName: string;
}

export interface StaffRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: "teaching" | "non_teaching";
  designation: string;
  department: string;
  status: "active" | "on_leave" | "inactive";
  schoolId: string;
  schoolName: string;
}

export interface ParentRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: "active" | "inactive";
  schoolId: string;
  schoolName: string;
}

export interface AdminRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "pending" | "rejected";
  joinedDate: string;
  schoolId: string;
  schoolName: string;
}

type TabKey = "students" | "staff" | "parents" | "admins";

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500",
];
function avatarColor(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "—";
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_BADGE: Record<string, string> = {
  active:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  on_leave:  "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  pending:   "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  inactive:  "bg-gray-500/10    text-gray-600    dark:text-zinc-400    border-gray-500/20",
  rejected:  "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
  graduated: "bg-sky-500/10     text-sky-600     dark:text-sky-400     border-sky-500/20",
};
const STATUS_LABEL: Record<string, string> = {
  active: "Active", on_leave: "On leave", pending: "Pending",
  inactive: "Inactive", rejected: "Rejected", graduated: "Graduated",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[status] ?? STATUS_BADGE.inactive}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function SchoolCell({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-zinc-300">
      <Landmark className="h-3.5 w-3.5 shrink-0 text-violet-400" />{name}
    </span>
  );
}

function NameCell({ id, name }: { id: string; name: string }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(id)}`}>
        {initials(name)}
      </div>
      <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{name}</p>
    </div>
  );
}

const STAFF_IMPORT_COLUMNS: ImportColumn[] = [
  { key: "name",        label: "Name",        required: true },
  { key: "employeeId",  label: "Employee ID", required: true },
  { key: "type",        label: "Type" },
  { key: "designation", label: "Designation" },
  { key: "department",  label: "Department" },
  { key: "phone",       label: "Phone" },
  { key: "email",       label: "Email" },
];

function InviteStaffModal({ schools, onClose, onInvited }: { schools: SchoolOption[]; onClose: () => void; onInvited: () => void }) {
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? "");
  const [templates, setTemplates] = useState<{ id: string; name: string }[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [type, setType] = useState<"teaching" | "non_teaching">("teaching");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setTemplateId("");
    if (!schoolId) return;
    getStaffTemplatesForSchool(schoolId).then((t) => { if (!cancelled) setTemplates(t); });
    return () => { cancelled = true; };
  }, [schoolId]);

  async function handleInvite() {
    if (!fullName.trim() || !email.trim() || !schoolId) return;
    setStatus("saving");
    setError("");
    try {
      const template = templates.find((t) => t.id === templateId);
      await inviteStaffMember({
        fullName, email, employeeId, type, designation, department,
        templateId, templateName: template?.name ?? "", schoolId,
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
        ) : schools.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400 dark:text-zinc-500">Add a school first before inviting staff.</p>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">School</label>
                <div className="relative">
                  <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                    {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                </div>
              </div>
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
                    <select value={type} onChange={(e) => setType(e.target.value as "teaching" | "non_teaching")} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
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

function BulkImportSchoolPickerModal({ schools, onClose, onContinue }: { schools: SchoolOption[]; onClose: () => void; onContinue: (schoolId: string) => void }) {
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl p-6 space-y-5">
        <div className="flex items-start justify-between">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Import staff into which school?</p>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="relative">
          <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
          <button onClick={() => onContinue(schoolId)} disabled={!schoolId} className="rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors">Continue</button>
        </div>
      </div>
    </div>
  );
}

function InvitePrincipalModal({ schools, onClose, onInvited }: { schools: SchoolOption[]; onClose: () => void; onInvited: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleInvite() {
    if (!fullName.trim() || !email.trim() || !schoolId) return;
    setStatus("saving");
    setError("");
    try {
      await invitePrincipal({ fullName, email, schoolId });
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
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Invite Principal</p>
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
        ) : schools.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400 dark:text-zinc-500">Add a school first before inviting a principal.</p>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Full Name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="principal@school.edu" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">School</label>
                <div className="relative">
                  <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                    {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                </div>
              </div>
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

export default function PeopleClient({
  schools, students, staff, parents, admins,
}: {
  schools: SchoolOption[];
  students: StudentRow[];
  staff: StaffRow[];
  parents: ParentRow[];
  admins: AdminRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("students");
  const [query, setQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [showInviteStaff, setShowInviteStaff] = useState(false);
  const [showInvitePrincipal, setShowInvitePrincipal] = useState(false);
  const [bulkPickerOpen, setBulkPickerOpen] = useState(false);
  const [bulkSchoolId, setBulkSchoolId] = useState<string | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportOutcome | null>(null);

  async function handleImport(rows: Record<string, string>[]) {
    if (!bulkSchoolId) return;
    setImportBusy(true);
    setImportResult(null);
    try {
      const outcome = await bulkImportStaff(
        rows.map((r) => ({
          name: r.name || "", employeeId: r.employeeId || "", type: r.type || "",
          designation: r.designation || "", department: r.department || "",
          phone: r.phone || "", email: r.email || "",
        })),
        bulkSchoolId
      );
      setImportResult(outcome);
      router.refresh();
    } finally {
      setImportBusy(false);
    }
  }

  const tabs: { key: TabKey; label: string; icon: React.ElementType; count: number }[] = [
    { key: "students", label: "Students", icon: GraduationCap, count: students.length },
    { key: "staff",    label: "Staff",    icon: Briefcase,     count: staff.length },
    { key: "parents",  label: "Parents",  icon: Users,         count: parents.length },
    { key: "admins",   label: "Admins",   icon: UserCog,       count: admins.length },
  ];

  const filteredStudents = useMemo(() => {
    const q = query.toLowerCase();
    return students.filter((s) => {
      const matchQ = !q || s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q) || s.phone.toLowerCase().includes(q);
      const matchSchool = schoolFilter === "all" || s.schoolId === schoolFilter;
      return matchQ && matchSchool;
    });
  }, [students, query, schoolFilter]);

  const filteredStaff = useMemo(() => {
    const q = query.toLowerCase();
    return staff.filter((s) => {
      const matchQ = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.designation.toLowerCase().includes(q);
      const matchSchool = schoolFilter === "all" || s.schoolId === schoolFilter;
      return matchQ && matchSchool;
    });
  }, [staff, query, schoolFilter]);

  const filteredParents = useMemo(() => {
    const q = query.toLowerCase();
    return parents.filter((p) => {
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.phone.toLowerCase().includes(q);
      const matchSchool = schoolFilter === "all" || p.schoolId === schoolFilter;
      return matchQ && matchSchool;
    });
  }, [parents, query, schoolFilter]);

  const filteredAdmins = useMemo(() => {
    const q = query.toLowerCase();
    return admins.filter((a) => {
      const matchQ = !q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
      const matchSchool = schoolFilter === "all" || a.schoolId === schoolFilter;
      return matchQ && matchSchool;
    });
  }, [admins, query, schoolFilter]);

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">People</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
            Students, staff, parents, and admins across {schools.length} school{schools.length === 1 ? "" : "s"} in your institution
          </p>
        </div>
        {tab === "staff" && (
          <div className="flex gap-2 sm:ml-auto">
            <button
              onClick={() => setBulkPickerOpen(true)}
              disabled={importBusy}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            >
              {importBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Bulk Import
            </button>
            <FancyButton onClick={() => setShowInviteStaff(true)} size="sm">
              <Plus className="h-4 w-4" /> Invite Staff
            </FancyButton>
          </div>
        )}
        {tab === "admins" && (
          <div className="sm:ml-auto">
            <FancyButton onClick={() => setShowInvitePrincipal(true)} size="sm">
              <Plus className="h-4 w-4" /> Invite Principal
            </FancyButton>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {tabs.map((t) => (
          <div key={t.key} className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-violet-500 bg-violet-500/10">
              <t.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight text-gray-900 dark:text-zinc-50">{t.count.toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{t.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-zinc-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex shrink-0 items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === t.key
                ? "border-violet-500 text-violet-600 dark:text-violet-400"
                : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${tabs.find((t) => t.key === tab)?.label.toLowerCase()}…`}
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-violet-400 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
        <div className="relative">
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
          >
            <option value="all">All Schools</option>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
      </div>

      {tab === "students" && (
        <Table>
          <TableHead>
            <Th position="first">Student</Th>
            <Th>School</Th>
            <Th>Class</Th>
            <Th>Roll No.</Th>
            <Th>Phone</Th>
            <Th position="last">Status</Th>
          </TableHead>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableEmptyRow colSpan={6} icon={GraduationCap} message="No students found" />
            ) : (
              filteredStudents.map((s) => (
                <Tr key={s.id} onClick={() => router.push(`/dashboard/students/${s.id}`)}>
                  <Td position="first"><NameCell id={s.id} name={s.name} /></Td>
                  <Td><SchoolCell name={s.schoolName} /></Td>
                  <Td className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{s.class}</Td>
                  <Td className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{s.rollNo}</Td>
                  <Td className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{s.phone}</Td>
                  <Td position="last"><StatusBadge status={s.status} /></Td>
                </Tr>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {tab === "staff" && (
        <Table>
          <TableHead>
            <Th position="first">Staff</Th>
            <Th>School</Th>
            <Th>Designation</Th>
            <Th>Department</Th>
            <Th>Contact</Th>
            <Th position="last">Status</Th>
          </TableHead>
          <TableBody>
            {filteredStaff.length === 0 ? (
              <TableEmptyRow colSpan={6} icon={Briefcase} message="No staff found" />
            ) : (
              filteredStaff.map((s) => (
                <Tr key={s.id} onClick={() => router.push(`/dashboard/staff/${s.id}`)}>
                  <Td position="first"><NameCell id={s.id} name={s.name} /></Td>
                  <Td><SchoolCell name={s.schoolName} /></Td>
                  <Td className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{s.designation}</Td>
                  <Td className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{s.department}</Td>
                  <Td>
                    <p className="text-sm text-gray-700 dark:text-zinc-300 truncate max-w-[200px]">{s.email}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{s.phone}</p>
                  </Td>
                  <Td position="last"><StatusBadge status={s.status} /></Td>
                </Tr>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {tab === "parents" && (
        <Table>
          <TableHead>
            <Th position="first">Parent</Th>
            <Th>School</Th>
            <Th>Contact</Th>
            <Th position="last">Status</Th>
          </TableHead>
          <TableBody>
            {filteredParents.length === 0 ? (
              <TableEmptyRow colSpan={4} icon={Users} message="No parents found" />
            ) : (
              filteredParents.map((p) => (
                <Tr key={p.id} onClick={() => router.push(`/dashboard/parents/${p.id}`)}>
                  <Td position="first"><NameCell id={p.id} name={p.name} /></Td>
                  <Td><SchoolCell name={p.schoolName} /></Td>
                  <Td>
                    <p className="text-sm text-gray-700 dark:text-zinc-300 truncate max-w-[200px]">{p.email}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{p.phone}</p>
                  </Td>
                  <Td position="last"><StatusBadge status={p.status} /></Td>
                </Tr>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {tab === "admins" && (
        <Table>
          <TableHead>
            <Th position="first">Admin</Th>
            <Th>School</Th>
            <Th>Contact</Th>
            <Th>Joined</Th>
            <Th position="last">Status</Th>
          </TableHead>
          <TableBody>
            {filteredAdmins.length === 0 ? (
              <TableEmptyRow colSpan={5} icon={UserCog} message="No admins found" />
            ) : (
              filteredAdmins.map((a) => (
                <Tr key={a.id}>
                  <Td position="first"><NameCell id={a.id} name={a.name} /></Td>
                  <Td><SchoolCell name={a.schoolName} /></Td>
                  <Td>
                    <p className="text-sm text-gray-700 dark:text-zinc-300 truncate max-w-[200px]">{a.email}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{a.phone}</p>
                  </Td>
                  <Td className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{formatDate(a.joinedDate)}</Td>
                  <Td position="last"><StatusBadge status={a.status} /></Td>
                </Tr>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {importResult && (
        <div className="flex items-start gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 px-4 py-2.5 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
          <div>
            <p className="text-gray-900 dark:text-zinc-100">
              Imported {importResult.succeeded} staff member{importResult.succeeded === 1 ? "" : "s"}
              {importResult.failed.length > 0 && `, ${importResult.failed.length} failed`}
            </p>
            {importResult.failed.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-xs text-gray-500 dark:text-zinc-400">
                {importResult.failed.map((f, i) => <li key={i}>{f.row}: {f.reason}</li>)}
              </ul>
            )}
          </div>
        </div>
      )}

      {showInviteStaff && (
        <InviteStaffModal
          schools={schools}
          onClose={() => setShowInviteStaff(false)}
          onInvited={() => router.refresh()}
        />
      )}

      {showInvitePrincipal && (
        <InvitePrincipalModal
          schools={schools}
          onClose={() => setShowInvitePrincipal(false)}
          onInvited={() => router.refresh()}
        />
      )}

      {bulkPickerOpen && (
        <BulkImportSchoolPickerModal
          schools={schools}
          onClose={() => setBulkPickerOpen(false)}
          onContinue={(schoolId) => {
            setBulkSchoolId(schoolId);
            setBulkPickerOpen(false);
          }}
        />
      )}

      <BulkImportModal
        open={bulkSchoolId !== null}
        onClose={() => setBulkSchoolId(null)}
        title="Staff"
        columns={STAFF_IMPORT_COLUMNS}
        onImport={handleImport}
      />
    </div>
  );
}
