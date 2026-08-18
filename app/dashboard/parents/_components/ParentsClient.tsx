"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users2, UserCheck, Users, AlertCircle,
  Search, Plus, Download, ChevronLeft, ChevronRight, ChevronDown,
  Eye, Pencil, ArrowUpDown, ArrowUp, ArrowDown,
  X, Phone, Mail,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";

export type FeeStatus = "paid" | "partial" | "overdue";

export interface Child {
  id: string;
  name: string;
  class: string;
  section: string;
  rollNo: string;
  feeStatus: FeeStatus;
}

export interface Parent {
  id: string;
  name: string;
  occupation: string;
  phone: string;
  email: string;
  active: boolean;
  children: Child[];
}

const AVATAR_COLORS = ["bg-blue-500","bg-violet-500","bg-emerald-500","bg-rose-500","bg-amber-500","bg-teal-500","bg-indigo-500","bg-pink-500","bg-cyan-500","bg-orange-500"];
function avatarColor(id: string) { const n = id.split("").reduce((a,c)=>a+c.charCodeAt(0),0); return AVATAR_COLORS[n%AVATAR_COLORS.length]; }
function initials(name: string) { return name.split(" ").map((n)=>n[0]).slice(0,2).join("").toUpperCase(); }

function worstFeeFromChildren(children: Child[]): FeeStatus {
  const statuses = children.map((c) => c.feeStatus);
  if (statuses.includes("overdue")) return "overdue";
  if (statuses.includes("partial")) return "partial";
  return "paid";
}

type SortField = "name"|"children"|"feeStatus";
type SortDir   = "asc"|"desc";

const FEE_BADGE: Record<FeeStatus, string> = {
  paid:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  partial: "bg-amber-500/10  text-amber-600   dark:text-amber-400   border-amber-500/20",
  overdue: "bg-red-500/10    text-red-600     dark:text-red-400     border-red-500/20",
};

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40"/>;
  return dir==="asc"?<ArrowUp className="h-3 w-3"/>:<ArrowDown className="h-3 w-3"/>;
}

const PAGE_SIZE = 10;

function StatsRow({ parents }: { parents: Parent[] }) {
  const total   = parents.length;
  const active  = parents.filter((p) => p.active).length;
  const multi   = parents.filter((p) => p.children.length > 1).length;
  const overdue = parents.filter((p) => worstFeeFromChildren(p.children) === "overdue").length;
  const items = [
    { label: "Total Parents",     value: total,   icon: Users2,      accent: "text-blue-500    bg-blue-500/10"    },
    { label: "Active",            value: active,  icon: UserCheck,   accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Multiple Children", value: multi,   icon: Users,       accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Fee Overdue",       value: overdue, icon: AlertCircle, accent: "text-red-500     bg-red-500/10"     },
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

export default function ParentsClient({ initialParents }: { initialParents: Parent[] }) {
  const [query,     setQuery]     = useState("");
  const [feeFilter, setFee]       = useState("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir,   setSortDir]   = useState<SortDir>("asc");
  const [page,      setPage]      = useState(1);

  function toggleSort(field: SortField) {
    if (sortField===field) setSortDir((d)=>(d==="asc"?"desc":"asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return initialParents.filter((p) => {
      const childText = p.children.map((c) => c.name).join(" ").toLowerCase();
      const matchQ    = !q||p.name.toLowerCase().includes(q)||p.phone.includes(q)||childText.includes(q);
      const fee       = worstFeeFromChildren(p.children);
      const matchFee  = feeFilter==="all"||fee===feeFilter;
      return matchQ&&matchFee;
    }).sort((a,b) => {
      let cmp=0;
      if (sortField==="name")      cmp=a.name.localeCompare(b.name);
      if (sortField==="children")  cmp=a.children.length-b.children.length;
      if (sortField==="feeStatus") cmp=worstFeeFromChildren(a.children).localeCompare(worstFeeFromChildren(b.children));
      return sortDir==="asc"?cmp:-cmp;
    });
  }, [query, feeFilter, sortField, sortDir, initialParents]);

  const totalPages = Math.max(1, Math.ceil(filtered.length/PAGE_SIZE));
  const pageData   = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  function clearFilters() { setQuery(""); setFee("all"); setPage(1); }
  const hasFilter = query||feeFilter!=="all";

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Parents</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Manage parent accounts and linked students</p>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><Download className="h-3.5 w-3.5"/> Export</button>
          <FancyButton size="sm"><Plus className="h-4 w-4"/> Add Parent</FancyButton>
        </div>
      </div>

      <StatsRow parents={initialParents} />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none"/>
          <input value={query} onChange={(e)=>{setQuery(e.target.value);setPage(1);}} placeholder="Search by name, phone or child name…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"/>
        </div>
        <div className="relative">
          <select value={feeFilter} onChange={(e)=>{setFee(e.target.value);setPage(1);}} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All Fee Status</option><option value="paid">Paid</option><option value="partial">Partial</option><option value="overdue">Overdue</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        {hasFilter&&<button onClick={clearFilters} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><X className="h-3.5 w-3.5"/> Clear</button>}
      </div>

      {hasFilter&&(
        <div className="flex items-center justify-end">
          <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">Filters active</span>
        </div>
      )}

      <Table
        footer={totalPages>1&&(
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-zinc-400">Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{(page-1)*PAGE_SIZE+1}-{Math.min(page*PAGE_SIZE,filtered.length)}</span> of <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> parents</p>
            <div className="flex items-center gap-1">
              <button onClick={()=>setPage((p)=>Math.max(1,p-1))} disabled={page===1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"><ChevronLeft className="h-3.5 w-3.5"/></button>
              {Array.from({length:totalPages},(_,i)=>i+1).filter((n)=>n===1||n===totalPages||Math.abs(n-page)<=1).reduce<(number|"…")[]>((acc,n,i,arr)=>{if(i>0&&n-(arr[i-1] as number)>1)acc.push("…");acc.push(n);return acc;},[]).map((n,i)=>n==="…"?<span key={`e${i}`} className="px-1 text-xs text-gray-400">…</span>:<button key={n} onClick={()=>setPage(n as number)} className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${page===n?"bg-primary-500 text-white":"border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"}`}>{n}</button>)}
              <button onClick={()=>setPage((p)=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"><ChevronRight className="h-3.5 w-3.5"/></button>
            </div>
          </div>
        )}
      >
        <TableHead>
          <Th position="first"><button onClick={()=>toggleSort("name")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Parent <SortIcon active={sortField==="name"} dir={sortDir}/></button></Th>
          <Th>Contact</Th>
          <Th><button onClick={()=>toggleSort("children")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Children <SortIcon active={sortField==="children"} dir={sortDir}/></button></Th>
          <Th><button onClick={()=>toggleSort("feeStatus")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Fee Status <SortIcon active={sortField==="feeStatus"} dir={sortDir}/></button></Th>
          <Th position="last" align="right">Actions</Th>
        </TableHead>
        <TableBody>
          {pageData.length===0?(
            <TableEmptyRow colSpan={5} icon={Users2} message="No parents found" />
          ):pageData.map((p) => {
            const fee = worstFeeFromChildren(p.children);
            return (
              <Tr key={p.id}>
                <Td position="first">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(p.id)}`}>{initials(p.name)}</div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{p.name}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">{p.occupation}</p>
                    </div>
                    {!p.active&&<span className="ml-1 shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400">Inactive</span>}
                  </div>
                </Td>
                <Td>
                  <div className="space-y-0.5">
                    <p className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-zinc-300"><Phone className="h-3 w-3 shrink-0 text-gray-400 dark:text-zinc-500"/> {p.phone}</p>
                    <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 truncate max-w-[180px]"><Mail className="h-3 w-3 shrink-0 text-gray-400 dark:text-zinc-500"/> {p.email}</p>
                  </div>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {p.children.map((c) => (
                      <Link key={c.id} href={`/dashboard/students/${c.id}`} className="inline-flex items-center gap-1 rounded-lg bg-primary-500/10 hover:bg-primary-500/20 px-2 py-0.5 text-xs font-semibold text-primary-700 dark:text-primary-300 transition-colors">
                        {c.name.split(" ")[0]} · {c.class}–{c.section}
                      </Link>
                    ))}
                    {p.children.length===0&&<span className="text-xs text-gray-400 dark:text-zinc-500">—</span>}
                  </div>
                </Td>
                <Td><span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${FEE_BADGE[fee]}`}>{fee}</span></Td>
                <Td position="last">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/dashboard/parents/${p.id}`} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"><Eye className="h-3.5 w-3.5"/></Link>
                    <button className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"><Pencil className="h-3.5 w-3.5"/></button>
                  </div>
                </Td>
              </Tr>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
