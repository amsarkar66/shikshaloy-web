"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bus, UserCheck, UserMinus, Car,
  Search, Plus, ChevronLeft, ChevronRight, ChevronDown,
  Pencil, Eye, ArrowUpDown, ArrowUp, ArrowDown, X, Loader2, CheckCircle2,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";
import {
  type Driver, type DriverStatus, avatarColor, initials,
  STATUS_BADGE, STATUS_LABEL, formatJoinDate,
} from "../_data/drivers";
import { inviteDriver, updateDriver } from "../actions";

type SortField = "name" | "joinedDate" | "status";
type SortDir   = "asc" | "desc";

const PAGE_SIZE = 10;

function StatsRow({ drivers }: { drivers: Driver[] }) {
  const total      = drivers.length;
  const active     = drivers.filter((d) => d.status === "active").length;
  const onLeave    = drivers.filter((d) => d.status === "on_leave").length;
  const unassigned = drivers.filter((d) => !d.assignedVehicle && d.assignedRoutes.length === 0).length;
  const items = [
    { label: "Total Drivers", value: total,      icon: UserCheck, accent: "text-blue-500    bg-blue-500/10"    },
    { label: "Active",        value: active,     icon: Car,       accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "On Leave",      value: onLeave,     icon: UserMinus, accent: "text-amber-500   bg-amber-500/10"   },
    { label: "Unassigned",    value: unassigned, icon: Bus,       accent: "text-rose-500    bg-rose-500/10"    },
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

function AssignmentCell({ driver }: { driver: Driver }) {
  if (!driver.assignedVehicle && driver.assignedRoutes.length === 0) {
    return <span className="text-xs text-gray-400 dark:text-zinc-500">Unassigned</span>;
  }
  return (
    <div className="space-y-0.5">
      {driver.assignedVehicle && (
        <p className="text-sm text-gray-700 dark:text-zinc-300">{driver.assignedVehicle}</p>
      )}
      {driver.assignedRoutes.length > 0 && (
        <p className="text-xs text-gray-400 dark:text-zinc-500">Route {driver.assignedRoutes.join(", ")}</p>
      )}
    </div>
  );
}

function InviteDriverModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleInvite() {
    if (!fullName.trim() || !email.trim()) return;
    setStatus("saving");
    setError("");
    try {
      await inviteDriver({ fullName, email, phone, employeeId });
      setStatus("sent");
      onInvited();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to add driver. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Add Driver</p>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Full Name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Ramesh Kumar" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="driver@school.edu" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Phone</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Employee ID</label>
                <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="DRV004" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button onClick={onClose} className="rounded-lg border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
              <button onClick={handleInvite} disabled={!fullName.trim() || !email.trim() || status === "saving"} className="flex items-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors">
                {status === "saving" && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Add Driver
              </button>
            </div>
            {status === "error" && <p className="text-xs text-red-500 text-center -mt-2">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}

function EditDriverModal({ driver, onClose, onSaved }: { driver: Driver; onClose: () => void; onSaved: (d: Driver) => void }) {
  const [fullName, setFullName] = useState(driver.name);
  const [phone, setPhone] = useState(driver.phone);
  const [employeeId, setEmployeeId] = useState(driver.employeeId);
  const [driverStatus, setDriverStatus] = useState<DriverStatus>(driver.status);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSave() {
    if (!fullName.trim()) return;
    setStatus("saving");
    setError("");
    try {
      await updateDriver({
        profileId: driver.id,
        staffId: driver.staffId,
        fullName,
        phone,
        employeeId,
        status: driverStatus,
      });
      setStatus("saved");
      onSaved({ ...driver, name: fullName.trim(), phone: phone.trim(), employeeId: employeeId.trim(), status: driverStatus });
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
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Edit Driver</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">{driver.email || driver.name}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 col-span-2">
            <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Employee ID</label>
            <input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div className="space-y-1.5 col-span-2">
            <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Status</label>
            <div className="relative">
              <select value={driverStatus} onChange={(e) => setDriverStatus(e.target.value as DriverStatus)} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 pt-1">
          <button onClick={onClose} className="rounded-lg border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!fullName.trim() || status === "saving" || status === "saved"} className="flex items-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 px-4 py-2 text-sm font-medium text-white transition-colors">
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

export default function DriversClient({ initialDrivers }: { initialDrivers: Driver[] }) {
  const router = useRouter();
  const [drivers,      setDrivers]      = useState<Driver[]>(initialDrivers);
  const [query,        setQuery]        = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField,    setSortField]    = useState<SortField>("name");
  const [sortDir,      setSortDir]      = useState<SortDir>("asc");
  const [page,         setPage]         = useState(1);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [showInvite,    setShowInvite]    = useState(false);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  function handleSaved(updated: Driver) {
    setDrivers((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return drivers.filter((d) => {
      const matchQ  = !q || d.name.toLowerCase().includes(q) || d.employeeId.toLowerCase().includes(q) || d.phone.toLowerCase().includes(q);
      const matchSt = statusFilter === "all" || d.status === statusFilter;
      return matchQ && matchSt;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === "name")       cmp = a.name.localeCompare(b.name);
      if (sortField === "joinedDate") cmp = a.joinedDate.localeCompare(b.joinedDate);
      if (sortField === "status")     cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [query, statusFilter, sortField, sortDir, drivers]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  function clearFilters() { setQuery(""); setStatusFilter("all"); setPage(1); }
  const hasFilter = query || statusFilter !== "all";

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Drivers</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Manage driver accounts and vehicle/route assignments</p>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <FancyButton onClick={() => setShowInvite(true)} size="sm">
            <Plus className="h-4 w-4" /> Add Driver
          </FancyButton>
        </div>
      </div>

      <StatsRow drivers={drivers} />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search by name, employee ID or phone…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
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
      </div>

      <Table
        footer={totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
              <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> drivers
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
          <Th position="first"><button onClick={() => toggleSort("name")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Driver <SortIcon field="name" active={sortField==="name"} dir={sortDir} /></button></Th>
          <Th>Contact</Th>
          <Th>Assigned To</Th>
          <Th><button onClick={() => toggleSort("joinedDate")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Joined <SortIcon field="joinedDate" active={sortField==="joinedDate"} dir={sortDir} /></button></Th>
          <Th><button onClick={() => toggleSort("status")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Status <SortIcon field="status" active={sortField==="status"} dir={sortDir} /></button></Th>
          <Th position="last" align="right">Actions</Th>
        </TableHead>
        <TableBody>
          {pageData.length === 0 ? (
            <TableEmptyRow colSpan={6} icon={Bus} message="No drivers found" />
          ) : (
            pageData.map((d) => (
              <Tr key={d.id}>
                <Td position="first">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(d.id)}`}>{initials(d.name)}</div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{d.name}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">{d.employeeId || "—"}</p>
                    </div>
                  </div>
                </Td>
                <Td>
                  <p className="text-sm text-gray-700 dark:text-zinc-300">{d.phone || "—"}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 truncate max-w-[180px]">{d.email}</p>
                </Td>
                <Td><AssignmentCell driver={d} /></Td>
                <Td className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{formatJoinDate(d.joinedDate)}</Td>
                <Td><span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[d.status]}`}>{STATUS_LABEL[d.status]}</span></Td>
                <Td position="last">
                  <div className="flex items-center justify-end gap-1">
                    {d.staffId && (
                      <Link href={`/dashboard/staff/${d.staffId}`} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"><Eye className="h-3.5 w-3.5" /></Link>
                    )}
                    <button onClick={() => setEditingDriver(d)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </TableBody>
      </Table>

      {editingDriver && <EditDriverModal driver={editingDriver} onClose={() => setEditingDriver(null)} onSaved={handleSaved} />}
      {showInvite && <InviteDriverModal onClose={() => setShowInvite(false)} onInvited={() => router.refresh()} />}
    </div>
  );
}
