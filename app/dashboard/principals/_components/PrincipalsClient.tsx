"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  UserCog, Search, Plus, ChevronDown, X, CheckCircle2, Loader2, Landmark, ArrowUpCircle, ShieldOff, MoreHorizontal,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";
import { invitePrincipal, searchPromotableStaff, promoteExistingToAdmin, revokeAdminAccess, type PromotableStaff } from "../actions";

const SEARCH_MIN_CHARS = 2;

export type PrincipalStatus = "pending" | "active" | "rejected";

export interface Principal {
  id: string;
  name: string;
  email: string;
  phone: string;
  schoolId: string;
  schoolName: string;
  status: PrincipalStatus;
  joinedDate: string;
  // Only a grant-based admin (promoteExistingToAdmin) can be revoked — see
  // revokeAdminAccess in ../actions.ts.
  revokable: boolean;
  staffId: string | null;
}

export interface SchoolOption {
  id: string;
  name: string;
}

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

const STATUS_BADGE: Record<PrincipalStatus, string> = {
  active:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  pending:  "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  rejected: "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
};
const STATUS_LABEL: Record<PrincipalStatus, string> = {
  active: "Active", pending: "Pending", rejected: "Rejected",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function PromoteExistingTab({
  schoolId, onDone,
}: { schoolId: string; onDone: (name: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PromotableStaff[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<PromotableStaff | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState("");
  const requestId = useRef(0);

  useEffect(() => {
    setSelected(null);
    const q = query.trim();
    if (q.length < SEARCH_MIN_CHARS || !schoolId) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++requestId.current;
    const timer = window.setTimeout(() => {
      searchPromotableStaff(schoolId, q)
        .then((r) => {
          if (requestId.current !== id) return;
          setResults(r);
        })
        .finally(() => {
          if (requestId.current === id) setLoading(false);
        });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, schoolId]);

  async function handlePromote() {
    if (!selected) return;
    setStatus("saving");
    setError("");
    try {
      await promoteExistingToAdmin(selected.staffId);
      onDone(selected.fullName);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to promote. Please try again.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Search teacher or staff</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-8 pr-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6"><Loader2 className="h-4 w-4 animate-spin text-gray-400" /></div>
      ) : results.length > 0 ? (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-zinc-700 divide-y divide-gray-100 dark:divide-zinc-800">
          {results.map((r) => (
            <button
              key={r.staffId}
              onClick={() => setSelected(r)}
              className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${selected?.staffId === r.staffId ? "bg-indigo-50 dark:bg-indigo-500/10" : "hover:bg-gray-50 dark:hover:bg-zinc-800"}`}
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-zinc-100 truncate">{r.fullName}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500">{r.designation || (r.type === "teaching" ? "Teacher" : "Staff")}</p>
              </div>
              {selected?.staffId === r.staffId && <CheckCircle2 className="h-4 w-4 shrink-0 text-indigo-500" />}
            </button>
          ))}
        </div>
      ) : query.trim().length >= SEARCH_MIN_CHARS ? (
        <p className="py-4 text-center text-xs text-gray-400 dark:text-zinc-500">No matching teacher or staff found.</p>
      ) : null}

      {selected && (
        <p className="text-xs text-gray-500 dark:text-zinc-400">
          <strong className="text-gray-700 dark:text-zinc-300">{selected.fullName}</strong> keeps their existing login and staff record — this only grants admin access.
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          onClick={handlePromote}
          disabled={!selected || status === "saving"}
          className="flex items-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          {status === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          <ArrowUpCircle className="h-3.5 w-3.5" /> Promote to Admin
        </button>
      </div>
      {status === "error" && <p className="text-xs text-red-500 text-center -mt-2">{error}</p>}
    </div>
  );
}

function InvitePrincipalModal({
  schools, onClose, onInvited,
}: { schools: SchoolOption[]; onClose: () => void; onInvited: () => void }) {
  const [mode, setMode] = useState<"new" | "promote">("new");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [sentLabel, setSentLabel] = useState("");

  async function handleInvite() {
    if (!fullName.trim() || !email.trim() || !schoolId) return;
    setStatus("saving");
    setError("");
    try {
      await invitePrincipal({ fullName, email, schoolId });
      setSentLabel(`Invite sent to ${email}`);
      setStatus("sent");
      onInvited();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to send invite. Please try again.");
    }
  }

  function handlePromoted(name: string) {
    setSentLabel(`${name} is now an admin`);
    setStatus("sent");
    onInvited();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{mode === "new" ? "Invite Principal" : "Promote to Admin"}</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
              {mode === "new" ? "They will receive an email with login credentials." : "Give an existing teacher or staff member admin access."}
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"><X className="h-4 w-4" /></button>
        </div>
        {status === "sent" ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10"><CheckCircle2 className="h-6 w-6 text-emerald-500" /></div>
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-50">{sentLabel}</p>
            <button onClick={onClose} className="rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors">Done</button>
          </div>
        ) : schools.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400 dark:text-zinc-500">Add a school first before inviting a principal.</p>
        ) : (
          <>
            <div className="flex rounded-lg border border-gray-200 dark:border-zinc-700 p-0.5 text-xs font-medium">
              <button onClick={() => setMode("new")} className={`flex-1 rounded-md py-1.5 transition-colors ${mode === "new" ? "bg-indigo-500 text-white" : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200"}`}>New Person</button>
              <button onClick={() => setMode("promote")} className={`flex-1 rounded-md py-1.5 transition-colors ${mode === "promote" ? "bg-indigo-500 text-white" : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200"}`}>Promote Existing</button>
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

            {mode === "new" ? (
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
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button onClick={onClose} className="rounded-lg border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
                  <button onClick={handleInvite} disabled={!fullName.trim() || !email.trim() || status === "saving"} className="flex items-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors">
                    {status === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Send Invite
                  </button>
                </div>
                {status === "error" && <p className="text-xs text-red-500 text-center -mt-2">{error}</p>}
              </>
            ) : (
              <PromoteExistingTab schoolId={schoolId} onDone={handlePromoted} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function PrincipalRowMenu({
  principal, open, onToggle, onClose, onRevoke,
}: { principal: Principal; open: boolean; onToggle: () => void; onClose: () => void; onRevoke: () => void }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);

  function handleToggle() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    onToggle();
  }

  return (
    <div className="flex items-center justify-end">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        title="More actions"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>

      {open && pos && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <div
            style={{ top: pos.top, right: pos.right }}
            className="fixed z-50 w-48 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg shadow-black/10 py-1"
          >
            {principal.revokable ? (
              <button
                onClick={() => { onClose(); onRevoke(); }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <ShieldOff className="h-3.5 w-3.5 shrink-0" /> Revoke admin access
              </button>
            ) : (
              <p className="px-3.5 py-2 text-xs font-medium text-gray-400 dark:text-zinc-500">No actions available</p>
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

function RevokeConfirmModal({
  principal, onClose, onRevoked,
}: { principal: Principal; onClose: () => void; onRevoked: () => void }) {
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState("");

  async function handleConfirm() {
    if (!principal.staffId) return;
    setStatus("saving");
    setError("");
    try {
      await revokeAdminAccess(principal.staffId);
      onRevoked();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to revoke admin access.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={status === "saving" ? undefined : onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 text-red-500">
            <ShieldOff className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Revoke admin access?</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
              <strong className="text-gray-700 dark:text-zinc-300">{principal.name}</strong> keeps their existing login and staff record — only their admin access is removed.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} disabled={status === "saving"} className="rounded-lg border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={status === "saving"} className="flex items-center gap-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors">
            {status === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Revoke Access
          </button>
        </div>
        {status === "error" && <p className="text-xs text-red-500 text-center">{error}</p>}
      </div>
    </div>
  );
}

export default function PrincipalsClient({ principals, schools }: { principals: Principal[]; schools: SchoolOption[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [showInvite, setShowInvite] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<Principal | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return principals.filter((p) => {
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
      const matchSchool = schoolFilter === "all" || p.schoolId === schoolFilter;
      return matchQ && matchSchool;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [query, schoolFilter, principals]);

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Administrators</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Principals and school admins across your institution</p>
        </div>
        <div className="sm:ml-auto">
          <FancyButton onClick={() => setShowInvite(true)} size="sm">
            <Plus className="h-4 w-4" /> Invite Principal
          </FancyButton>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-violet-500 bg-violet-500/10">
          <UserCog className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{principals.length}</p>
          <p className="text-xs text-gray-500 dark:text-zinc-400">Principal{principals.length === 1 ? "" : "s"} across {schools.length} school{schools.length === 1 ? "" : "s"}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or email…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
        </div>
        <div className="relative">
          <select value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All Schools</option>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
      </div>

      <Table>
        <TableHead>
          <Th position="first">Principal</Th>
          <Th>School</Th>
          <Th>Contact</Th>
          <Th>Joined</Th>
          <Th>Status</Th>
          <Th position="last" className="w-px">&nbsp;</Th>
        </TableHead>
        <TableBody>
          {filtered.length === 0 ? (
            <TableEmptyRow colSpan={6} icon={UserCog} message="No principals found" />
          ) : (
            filtered.map((p) => (
              <Tr key={p.id}>
                <Td position="first">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(p.id)}`}>{initials(p.name)}</div>
                    <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{p.name}</p>
                  </div>
                </Td>
                <Td>
                  <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-zinc-300"><Landmark className="h-3.5 w-3.5 text-violet-400" />{p.schoolName}</span>
                </Td>
                <Td>
                  <p className="text-sm text-gray-700 dark:text-zinc-300 truncate max-w-[200px]">{p.email}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{p.phone}</p>
                </Td>
                <Td className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{formatDate(p.joinedDate)}</Td>
                <Td><span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[p.status]}`}>{STATUS_LABEL[p.status]}</span></Td>
                <Td position="last" className="w-px whitespace-nowrap">
                  <PrincipalRowMenu
                    principal={p}
                    open={openMenuId === p.id}
                    onToggle={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                    onClose={() => setOpenMenuId(null)}
                    onRevoke={() => setRevokeTarget(p)}
                  />
                </Td>
              </Tr>
            ))
          )}
        </TableBody>
      </Table>

      {showInvite && <InvitePrincipalModal schools={schools} onClose={() => setShowInvite(false)} onInvited={() => router.refresh()} />}
      {revokeTarget && (
        <RevokeConfirmModal
          principal={revokeTarget}
          onClose={() => setRevokeTarget(null)}
          onRevoked={() => {
            setRevokeTarget(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
