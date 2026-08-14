"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  UserCog, Search, Plus, ChevronDown, X, CheckCircle2, Loader2, Landmark,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";
import { invitePrincipal } from "../actions";

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

function InvitePrincipalModal({
  schools, onClose, onInvited,
}: { schools: SchoolOption[]; onClose: () => void; onInvited: () => void }) {
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

export default function PrincipalsClient({ principals, schools }: { principals: Principal[]; schools: SchoolOption[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [showInvite, setShowInvite] = useState(false);

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
        <div className="sm:ml-auto">
          <FancyButton onClick={() => setShowInvite(true)} size="sm">
            <Plus className="h-4 w-4" /> Invite Principal
          </FancyButton>
        </div>
      </div>

      <Table>
        <TableHead>
          <Th position="first">Principal</Th>
          <Th>School</Th>
          <Th>Contact</Th>
          <Th>Joined</Th>
          <Th position="last">Status</Th>
        </TableHead>
        <TableBody>
          {filtered.length === 0 ? (
            <TableEmptyRow colSpan={5} icon={UserCog} message="No principals found" />
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
                <Td position="last"><span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[p.status]}`}>{STATUS_LABEL[p.status]}</span></Td>
              </Tr>
            ))
          )}
        </TableBody>
      </Table>

      {showInvite && <InvitePrincipalModal schools={schools} onClose={() => setShowInvite(false)} onInvited={() => router.refresh()} />}
    </div>
  );
}
