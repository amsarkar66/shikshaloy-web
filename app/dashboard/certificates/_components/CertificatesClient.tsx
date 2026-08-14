"use client";

import { useState, useMemo } from "react";
import {
  Award, Clock, CheckCircle2, FileText, Search, Plus,
  Download, X, Eye, Printer, XCircle,
  ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, ChevronDown,
} from "lucide-react";
import { STATUS_BADGE, CERT_TYPE_LABEL, CERT_TYPE_BADGE, formatDate } from "../_data/certificates";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";
import type { CertStatus, CertType } from "../_data/certificates";

export interface Cert {
  id: string;
  studentName: string;
  rollNo: string;
  class: string;
  section: string;
  certType: CertType;
  purpose: string;
  requestedOn: string;
  issuedOn?: string;
  status: CertStatus;
  issuedBy?: string;
}

const AVATAR_COLORS = ["bg-blue-500","bg-violet-500","bg-emerald-500","bg-rose-500","bg-amber-500","bg-teal-500","bg-indigo-500","bg-pink-500","bg-cyan-500","bg-orange-500"];
function avatarColor(id: string) { const n = id.split("").reduce((a,c)=>a+c.charCodeAt(0),0); return AVATAR_COLORS[n%AVATAR_COLORS.length]; }
function initials(name: string) { return name.split(" ").map((n)=>n[0]).slice(0,2).join("").toUpperCase(); }

type SortField = "studentName"|"class"|"certType"|"requestedOn"|"status";
type SortDir   = "asc"|"desc";
type TabFilter = "all"|CertStatus;

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40"/>;
  return dir==="asc"?<ArrowUp className="h-3 w-3"/>:<ArrowDown className="h-3 w-3"/>;
}

function StatsRow({ certs }: { certs: Cert[] }) {
  const total   = certs.length;
  const pending = certs.filter((c)=>c.status==="pending").length;
  const ready   = certs.filter((c)=>c.status==="ready").length;
  const issued  = certs.filter((c)=>c.status==="issued").length;
  const items = [
    { label: "Total Requests",   value: total,   icon: FileText,     accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Pending",          value: pending,  icon: Clock,        accent: "text-amber-500   bg-amber-500/10"   },
    { label: "Ready to Collect", value: ready,   icon: Award,        accent: "text-blue-500    bg-blue-500/10"    },
    { label: "Issued",           value: issued,   icon: CheckCircle2, accent: "text-emerald-500 bg-emerald-500/10" },
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

const PAGE_SIZE = 10;
const TABS: { id: TabFilter; label: string }[] = [
  { id: "all", label: "All" }, { id: "pending", label: "Pending" }, { id: "ready", label: "Ready" }, { id: "issued", label: "Issued" },
];

export default function CertificatesClient({ initialCerts }: { initialCerts: Cert[] }) {
  const [tab,        setTab]       = useState<TabFilter>("all");
  const [query,      setQuery]     = useState("");
  const [typeFilter, setType]      = useState<"all"|CertType>("all");
  const [sortField,  setSortField] = useState<SortField>("requestedOn");
  const [sortDir,    setSortDir]   = useState<SortDir>("desc");
  const [page,       setPage]      = useState(1);

  function toggleSort(field: SortField) {
    if (sortField===field) setSortDir((d)=>(d==="asc"?"desc":"asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return initialCerts.filter((c) => {
      const matchTab  = tab==="all"||c.status===tab;
      const matchType = typeFilter==="all"||c.certType===typeFilter;
      const matchQ    = !q||c.studentName.toLowerCase().includes(q)||c.rollNo.toLowerCase().includes(q)||c.purpose.toLowerCase().includes(q);
      return matchTab&&matchType&&matchQ;
    }).sort((a,b) => {
      let cmp=0;
      if (sortField==="studentName") cmp=a.studentName.localeCompare(b.studentName);
      if (sortField==="class")       cmp=Number(a.class)-Number(b.class)||a.section.localeCompare(b.section);
      if (sortField==="certType")    cmp=a.certType.localeCompare(b.certType);
      if (sortField==="requestedOn") cmp=a.requestedOn.localeCompare(b.requestedOn);
      if (sortField==="status")      cmp=a.status.localeCompare(b.status);
      return sortDir==="asc"?cmp:-cmp;
    });
  }, [tab, query, typeFilter, sortField, sortDir, initialCerts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length/PAGE_SIZE));
  const pageData   = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const hasFilter  = query||typeFilter!=="all";
  function clearFilters() { setQuery(""); setType("all"); setPage(1); }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div><h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Certificates</h1><p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Issue bonafide, transfer, character, and study certificates</p></div>
        <div className="flex gap-2 sm:ml-auto">
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><Download className="h-3.5 w-3.5"/> Export</button>
          <FancyButton size="sm"><Plus className="h-4 w-4"/> New Request</FancyButton>
        </div>
      </div>

      <StatsRow certs={initialCerts} />

      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
        {TABS.map(({id,label}) => (
          <button key={id} onClick={()=>{setTab(id);setPage(1);}} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab===id?"border-primary-500 text-primary-600 dark:text-primary-400":"border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:border-gray-300 dark:hover:border-zinc-600"}`}>
            {label}
            <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tab===id?"bg-primary-500/15 text-primary-600 dark:text-primary-400":"bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500"}`}>
              {id==="all"?initialCerts.length:initialCerts.filter((c)=>c.status===id).length}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none"/>
          <input value={query} onChange={(e)=>{setQuery(e.target.value);setPage(1);}} placeholder="Search student name, roll no or purpose…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"/>
        </div>
        <div className="relative">
          <select value={typeFilter} onChange={(e)=>{setType(e.target.value as "all"|CertType);setPage(1);}} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All Types</option><option value="bonafide">Bonafide</option><option value="transfer">Transfer (TC)</option><option value="character">Character</option><option value="study">Study Certificate</option>
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
            <p className="text-xs text-gray-500 dark:text-zinc-400">Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{(page-1)*PAGE_SIZE+1}-{Math.min(page*PAGE_SIZE,filtered.length)}</span> of <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> requests</p>
            <div className="flex items-center gap-1">
              <button onClick={()=>setPage((p)=>Math.max(1,p-1))} disabled={page===1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"><ChevronLeft className="h-3.5 w-3.5"/></button>
              {Array.from({length:totalPages},(_,i)=>i+1).filter((n)=>n===1||n===totalPages||Math.abs(n-page)<=1).reduce<(number|"…")[]>((acc,n,i,arr)=>{if(i>0&&n-(arr[i-1] as number)>1)acc.push("…");acc.push(n);return acc;},[]).map((n,i)=>n==="…"?<span key={`e${i}`} className="px-1 text-xs text-gray-400">…</span>:<button key={n} onClick={()=>setPage(n as number)} className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${page===n?"bg-primary-500 text-white":"border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"}`}>{n}</button>)}
              <button onClick={()=>setPage((p)=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"><ChevronRight className="h-3.5 w-3.5"/></button>
            </div>
          </div>
        )}
      >
        <TableHead>
          <Th position="first"><button onClick={()=>toggleSort("studentName")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Student <SortIcon active={sortField==="studentName"} dir={sortDir}/></button></Th>
          <Th><button onClick={()=>toggleSort("class")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Class <SortIcon active={sortField==="class"} dir={sortDir}/></button></Th>
          <Th><button onClick={()=>toggleSort("certType")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Certificate <SortIcon active={sortField==="certType"} dir={sortDir}/></button></Th>
          <Th>Purpose</Th>
          <Th><button onClick={()=>toggleSort("requestedOn")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Requested <SortIcon active={sortField==="requestedOn"} dir={sortDir}/></button></Th>
          <Th>Issued On</Th>
          <Th><button onClick={()=>toggleSort("status")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Status <SortIcon active={sortField==="status"} dir={sortDir}/></button></Th>
          <Th position="last" align="right">Actions</Th>
        </TableHead>
        <TableBody>
          {pageData.length===0?(
            <TableEmptyRow colSpan={8} icon={Award} message="No certificates found" />
          ):pageData.map((cert) => {
            const stBadge   = STATUS_BADGE[cert.status];
            const certBadge = CERT_TYPE_BADGE[cert.certType];
            return (
              <Tr key={cert.id}>
                <Td position="first">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(cert.id)}`}>{initials(cert.studentName)}</div>
                    <div className="min-w-0"><p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{cert.studentName}</p><p className="text-xs text-gray-400 dark:text-zinc-500">{cert.rollNo}</p></div>
                  </div>
                </Td>
                <Td><span className="inline-flex items-center rounded-lg bg-primary-500/10 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300">{cert.class}–{cert.section}</span></Td>
                <Td><span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold ${certBadge}`}>{CERT_TYPE_LABEL[cert.certType]}</span></Td>
                <Td className="max-w-[200px]"><p className="text-sm text-gray-600 dark:text-zinc-400 truncate">{cert.purpose}</p></Td>
                <Td className="text-sm text-gray-600 dark:text-zinc-400 whitespace-nowrap">{formatDate(cert.requestedOn)}</Td>
                <Td className="text-sm whitespace-nowrap">{cert.issuedOn?<span className="text-gray-600 dark:text-zinc-400">{formatDate(cert.issuedOn)}</span>:<span className="text-gray-300 dark:text-zinc-600">—</span>}</Td>
                <Td>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${stBadge.cls}`}>{stBadge.label}</span>
                  {cert.issuedBy&&<p className="mt-0.5 text-[10px] text-gray-400 dark:text-zinc-500">by {cert.issuedBy}</p>}
                </Td>
                <Td position="last">
                  <div className="flex items-center justify-end gap-1">
                    <button className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors" title="View"><Eye className="h-3.5 w-3.5"/></button>
                    {(cert.status==="pending"||cert.status==="ready")&&<button className="flex h-7 w-7 items-center justify-center rounded-lg text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors" title="Print"><Printer className="h-3.5 w-3.5"/></button>}
                    {cert.status==="pending"&&<button className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Reject"><XCircle className="h-3.5 w-3.5"/></button>}
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
