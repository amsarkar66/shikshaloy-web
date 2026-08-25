"use client";

import { useState, useMemo } from "react";
import {
  Users as UsersIcon, UserCheck, Clock, Building2,
  Search, ChevronLeft, ChevronRight, ChevronDown,
  ArrowUpDown, ArrowUp, ArrowDown, Phone,
  X,
} from "lucide-react";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";
import { ROLE_META } from "../../_lib/nav-data";
import type { DirectoryUser } from "@/lib/supabase/admin";

const AVATAR_COLORS = ["bg-blue-500","bg-violet-500","bg-emerald-500","bg-rose-500","bg-amber-500","bg-teal-500","bg-indigo-500","bg-pink-500","bg-cyan-500","bg-orange-500"];
function avatarColor(id: string) { const n = id.split("").reduce((a,c)=>a+c.charCodeAt(0),0); return AVATAR_COLORS[n%AVATAR_COLORS.length]; }
function initials(name: string) { return name.split(" ").filter(Boolean).map((n)=>n[0]).slice(0,2).join("").toUpperCase() || "?"; }

const ROLE_ORDER = ["kernel", "super_admin", "admin", "staff", "teacher", "parent", "student", "driver"] as const;

const STATUS_BADGE: Record<string, string> = {
  active:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  pending:  "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  rejected: "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
};

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role];
  if (!meta) return <span className="text-xs text-gray-400 dark:text-zinc-500">{role}</span>;
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.color}`}>
      <Icon className="h-3 w-3" /> {meta.label}
    </span>
  );
}

type SortField = "name" | "role" | "joined" | "lastActive";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40"/>;
  return dir==="asc"?<ArrowUp className="h-3 w-3"/>:<ArrowDown className="h-3 w-3"/>;
}

const PAGE_SIZE = 15;

function StatsRow({ users }: { users: DirectoryUser[] }) {
  const total     = users.length;
  const active    = users.filter((u) => u.status === "active").length;
  const pending   = users.filter((u) => u.status === "pending").length;
  const institutions = new Set(users.map((u) => u.institutionName).filter(Boolean)).size;
  const items = [
    { label: "Total Users",   value: total,        icon: UsersIcon,  accent: "text-blue-500    bg-blue-500/10"    },
    { label: "Active",        value: active,       icon: UserCheck,  accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Pending",       value: pending,       icon: Clock,      accent: "text-amber-500   bg-amber-500/10"   },
    { label: "Institutions",  value: institutions, icon: Building2,  accent: "text-indigo-500  bg-indigo-500/10"  },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s) => (
        <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}><s.icon className="h-5 w-5"/></div>
          <div><p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p><p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p></div>
        </div>
      ))}
    </div>
  );
}

export default function UsersClient({ users }: { users: DirectoryUser[] }) {
  const [query,      setQuery]      = useState("");
  const [roleFilter,  setRole]      = useState("all");
  const [statusFilter, setStatus]   = useState("all");
  const [sortField,  setSortField]  = useState<SortField>("joined");
  const [sortDir,    setSortDir]    = useState<SortDir>("desc");
  const [page,       setPage]       = useState(1);

  function toggleSort(field: SortField) {
    if (sortField===field) setSortDir((d)=>(d==="asc"?"desc":"asc"));
    else { setSortField(field); setSortDir(field==="joined"||field==="lastActive"?"desc":"asc"); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return users.filter((u) => {
      const matchQ = !q
        || (u.fullName ?? "").toLowerCase().includes(q)
        || (u.email ?? "").toLowerCase().includes(q)
        || (u.institutionName ?? "").toLowerCase().includes(q)
        || (u.schoolName ?? "").toLowerCase().includes(q);
      const matchRole   = roleFilter==="all"   || u.role===roleFilter;
      const matchStatus = statusFilter==="all" || u.status===statusFilter;
      return matchQ && matchRole && matchStatus;
    }).sort((a,b) => {
      let cmp=0;
      if (sortField==="name")       cmp=(a.fullName??"").localeCompare(b.fullName??"");
      if (sortField==="role")       cmp=ROLE_ORDER.indexOf(a.role as typeof ROLE_ORDER[number])-ROLE_ORDER.indexOf(b.role as typeof ROLE_ORDER[number]);
      if (sortField==="joined")     cmp=new Date(a.createdAt).getTime()-new Date(b.createdAt).getTime();
      if (sortField==="lastActive") cmp=new Date(a.lastSignInAt??0).getTime()-new Date(b.lastSignInAt??0).getTime();
      return sortDir==="asc"?cmp:-cmp;
    });
  }, [query, roleFilter, statusFilter, sortField, sortDir, users]);

  const totalPages = Math.max(1, Math.ceil(filtered.length/PAGE_SIZE));
  const pageData   = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  function clearFilters() { setQuery(""); setRole("all"); setStatus("all"); setPage(1); }
  const hasFilter = query||roleFilter!=="all"||statusFilter!=="all";

  function fmtDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Users</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Every account across every role and institution on the platform</p>
      </div>

      <StatsRow users={users} />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none"/>
          <input value={query} onChange={(e)=>{setQuery(e.target.value);setPage(1);}} placeholder="Search by name, email, or institution…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"/>
        </div>
        <div className="relative">
          <select value={roleFilter} onChange={(e)=>{setRole(e.target.value);setPage(1);}} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All Roles</option>
            {ROLE_ORDER.map((r) => <option key={r} value={r}>{ROLE_META[r]?.label ?? r}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e)=>{setStatus(e.target.value);setPage(1);}} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All Status</option><option value="active">Active</option><option value="pending">Pending</option><option value="rejected">Rejected</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        {hasFilter&&<button onClick={clearFilters} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><X className="h-3.5 w-3.5"/> Clear</button>}
      </div>

      <Table
        footer={totalPages>1&&(
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-zinc-400">Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{(page-1)*PAGE_SIZE+1}-{Math.min(page*PAGE_SIZE,filtered.length)}</span> of <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> users</p>
            <div className="flex items-center gap-1">
              <button onClick={()=>setPage((p)=>Math.max(1,p-1))} disabled={page===1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"><ChevronLeft className="h-3.5 w-3.5"/></button>
              {Array.from({length:totalPages},(_,i)=>i+1).filter((n)=>n===1||n===totalPages||Math.abs(n-page)<=1).reduce<(number|"…")[]>((acc,n,i,arr)=>{if(i>0&&n-(arr[i-1] as number)>1)acc.push("…");acc.push(n);return acc;},[]).map((n,i)=>n==="…"?<span key={`e${i}`} className="px-1 text-xs text-gray-400">…</span>:<button key={n} onClick={()=>setPage(n as number)} className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${page===n?"bg-primary-500 text-white":"border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"}`}>{n}</button>)}
              <button onClick={()=>setPage((p)=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"><ChevronRight className="h-3.5 w-3.5"/></button>
            </div>
          </div>
        )}
      >
        <TableHead>
          <Th position="first"><button onClick={()=>toggleSort("name")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">User <SortIcon active={sortField==="name"} dir={sortDir}/></button></Th>
          <Th><button onClick={()=>toggleSort("role")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Role <SortIcon active={sortField==="role"} dir={sortDir}/></button></Th>
          <Th>Institution / School</Th>
          <Th>Status</Th>
          <Th><button onClick={()=>toggleSort("joined")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Joined <SortIcon active={sortField==="joined"} dir={sortDir}/></button></Th>
          <Th position="last"><button onClick={()=>toggleSort("lastActive")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Last Active <SortIcon active={sortField==="lastActive"} dir={sortDir}/></button></Th>
        </TableHead>
        <TableBody>
          {pageData.length===0?(
            <TableEmptyRow colSpan={6} icon={UsersIcon} message="No users found" />
          ):pageData.map((u) => (
            <Tr key={u.id}>
              <Td position="first">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(u.id)}`}>{initials(u.fullName ?? u.email ?? "?")}</div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{u.fullName ?? "Unnamed"}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-zinc-500">
                      {u.email && <span className="truncate max-w-[180px]">{u.email}</span>}
                      {u.phone && <span className="flex items-center gap-1 shrink-0"><Phone className="h-3 w-3 shrink-0"/>{u.phone}</span>}
                    </div>
                  </div>
                </div>
              </Td>
              <Td><RoleBadge role={u.role} /></Td>
              <Td>
                <div className="min-w-0">
                  <p className="truncate text-sm text-gray-700 dark:text-zinc-300">{u.institutionName ?? "—"}</p>
                  {u.schoolName && u.schoolName !== u.institutionName && <p className="truncate text-xs text-gray-400 dark:text-zinc-500">{u.schoolName}</p>}
                </div>
              </Td>
              <Td><span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${STATUS_BADGE[u.status ?? "active"] ?? STATUS_BADGE.active}`}>{u.status ?? "active"}</span></Td>
              <Td><span className="text-xs text-gray-500 dark:text-zinc-400">{fmtDate(u.createdAt)}</span></Td>
              <Td position="last"><span className="text-xs text-gray-500 dark:text-zinc-400">{fmtDate(u.lastSignInAt)}</span></Td>
            </Tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
