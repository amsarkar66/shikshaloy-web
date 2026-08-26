"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserPlus, Users, CheckCircle2, GraduationCap,
  Search, Plus, Download, X,
  ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, ChevronDown,
  Phone, Clock, Loader2, MoreHorizontal, Eye,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";
import {
  ACADEMIC_YEARS,
  STATUS_LABEL, STATUS_BADGE, formatDate, calcAge,
  TRANSITIONS, MENU_ITEM_COLOR,
  type AdmissionStatus,
} from "../_data/admissions";
import { updateApplicationStatus, enrollApplication, type EnrollResult } from "../actions";
import { CredentialsDialog } from "./CredentialsDialog";

export interface Application {
  id:               string;
  applicationNo:    string;
  applicantName:    string;
  dob:              string;
  gender:           "Male" | "Female";
  applyingForClass: string;
  parentName:       string;
  parentPhone:      string;
  parentEmail:      string;
  previousSchool?:  string;
  submittedDate:    string;
  updatedAt?:       string;
  statusReason?:    string;
  status:           AdmissionStatus;
  academicYear:     string;
  academicYearId:   string;
  notes?:           string;

  address?:               string;
  bloodGroup?:            string;
  category?:              string;
  nationality?:           string;
  fatherName?:            string;
  fatherOccupation?:      string;
  fatherPhone?:           string;
  fatherEmail?:           string;
  motherName?:            string;
  motherOccupation?:      string;
  motherPhone?:           string;
  motherEmail?:           string;
  guardianName?:          string;
  guardianRelation?:      string;
  guardianPhone?:         string;
  siblingStudying?:       boolean;
  siblingName?:           string;
  emergencyContactName?:  string;
  emergencyContactPhone?: string;
  photoUrl?:              string;
}

const PAGE_SIZE = 10;

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "all",          label: "All"          },
  { value: "pending",      label: "Pending"      },
  { value: "under_review", label: "Under Review" },
  { value: "approved",     label: "Approved"     },
  { value: "waitlisted",   label: "Waitlisted"   },
  { value: "rejected",     label: "Rejected"     },
  { value: "enrolled",     label: "Enrolled"     },
];

type SortField = "applicationNo"|"applicantName"|"applyingForClass"|"submittedDate"|"status";
type SortDir   = "asc"|"desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40"/>;
  return dir==="asc"?<ArrowUp className="h-3 w-3"/>:<ArrowDown className="h-3 w-3"/>;
}

function StatsRow({ apps }: { apps: Application[] }) {
  const total      = apps.length;
  const needReview = apps.filter((a) => a.status==="pending"||a.status==="under_review").length;
  const approved   = apps.filter((a) => a.status==="approved").length;
  const enrolled   = apps.filter((a) => a.status==="enrolled").length;
  const items = [
    { label: "Total Applications", value: total,      icon: UserPlus,      accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Pending Review",     value: needReview,  icon: Clock,         accent: "text-amber-500   bg-amber-500/10"   },
    { label: "Approved",           value: approved,    icon: CheckCircle2,  accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Enrolled",           value: enrolled,    icon: GraduationCap, accent: "text-blue-500    bg-blue-500/10"    },
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

function RowActionsMenu({
  app, open, onToggle, onClose, onEnrolled,
}: {
  app: Application;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onEnrolled: (app: Application, result: EnrollResult) => void;
}) {
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transitions = TRANSITIONS[app.status] ?? [];

  function handleToggle() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    onToggle();
  }

  async function handleTransition(next: AdmissionStatus) {
    setBusy(true);
    setError(null);
    try {
      if (next === "enrolled") {
        const result = await enrollApplication(app.id);
        onEnrolled(app, result);
      } else {
        await updateApplicationStatus(app.id, next);
      }
      onClose();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Link
        href={`/dashboard/admissions/${app.id}`}
        title="View application"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <Eye className="h-4 w-4" />
      </Link>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        title="More actions"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && pos && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <div
            style={{ top: pos.top, right: pos.right }}
            className="fixed z-50 w-48 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg shadow-black/10 py-1"
          >
            {error && <p className="px-3.5 py-1.5 text-[11px] text-red-500">{error}</p>}
            <a
              href={`tel:${app.parentPhone}`}
              className="flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors"
            >
              <Phone className="h-3.5 w-3.5 shrink-0" /> Call Parent
            </a>
            {transitions.length > 0 && <div className="my-1 border-t border-gray-100 dark:border-zinc-700/50" />}
            {transitions.map((t) => (
              <button
                key={t.status}
                disabled={busy}
                onClick={() => handleTransition(t.status)}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium disabled:opacity-50 transition-colors ${MENU_ITEM_COLOR[t.status]}`}
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" /> : <t.icon className="h-3.5 w-3.5 shrink-0" />}
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ApplicationList({
  apps, onEnrolled,
}: {
  apps: Application[];
  onEnrolled: (app: Application, result: EnrollResult) => void;
}) {
  const [sortField, setSortField] = useState<SortField>("submittedDate");
  const [sortDir,   setSortDir]   = useState<SortDir>("desc");
  const [page,      setPage]      = useState(1);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  function toggleSort(field: SortField) {
    if (sortField===field) setSortDir((d)=>(d==="asc"?"desc":"asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  const sorted = useMemo(() => [...apps].sort((a,b) => {
    let cmp=0;
    if (sortField==="applyingForClass") cmp=parseInt(a.applyingForClass)-parseInt(b.applyingForClass);
    else cmp=(a[sortField] as string).localeCompare(b[sortField] as string);
    return sortDir==="asc"?cmp:-cmp;
  }), [apps, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length/PAGE_SIZE));
  const pageApps   = sorted.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  function SortableTh({ field, position, children }: { field: SortField; position?: "first" | "last"; children: React.ReactNode }) {
    return (
      <Th position={position}>
        <button onClick={()=>toggleSort(field)} className="flex items-center gap-1 cursor-pointer select-none hover:text-gray-800 dark:hover:text-zinc-200 transition-colors">
          {children}<SortIcon active={sortField===field} dir={sortDir}/>
        </button>
      </Th>
    );
  }

  return (
    <Table
      footer={
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
          <span className="text-xs text-gray-500 dark:text-zinc-400">{sorted.length===0?"No results":`Showing ${(page-1)*PAGE_SIZE+1}–${Math.min(page*PAGE_SIZE,sorted.length)} of ${sorted.length}`}</span>
          {totalPages>1&&(
            <div className="flex items-center gap-1">
              <button onClick={()=>setPage((p)=>Math.max(1,p-1))} disabled={page===1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"><ChevronLeft className="h-3.5 w-3.5"/></button>
              {Array.from({length:totalPages},(_,i)=>i+1).map((p)=><button key={p} onClick={()=>setPage(p)} className={`flex h-7 w-7 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${page===p?"bg-primary-500 border-primary-500 text-white":"border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700"}`}>{p}</button>)}
              <button onClick={()=>setPage((p)=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"><ChevronRight className="h-3.5 w-3.5"/></button>
            </div>
          )}
        </div>
      }
    >
      <TableHead>
        <SortableTh field="applicationNo" position="first">App No</SortableTh>
        <SortableTh field="applicantName">Applicant</SortableTh>
        <SortableTh field="applyingForClass">Class</SortableTh>
        <Th>Parent / Guardian</Th>
        <SortableTh field="submittedDate">Submitted</SortableTh>
        <SortableTh field="status">Status</SortableTh>
        <Th position="last" align="right">Action</Th>
      </TableHead>
      <TableBody>
        {pageApps.length===0?(
          <TableEmptyRow colSpan={7} icon={Users} message="No applications found" />
        ):pageApps.map((app) => (
          <Tr key={app.id}>
            <Td position="first" className="font-mono text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">{app.applicationNo}</Td>
            <Td>
              <div className="flex items-center gap-2.5">
                {app.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={app.photoUrl} alt={app.applicantName} className="h-8 w-8 shrink-0 rounded-full object-cover border border-gray-200 dark:border-zinc-700" />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-700 text-xs font-semibold text-gray-500 dark:text-zinc-400">
                    {app.applicantName.split(" ").map((n)=>n[0]).slice(0,2).join("").toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900 dark:text-zinc-100 whitespace-nowrap">{app.applicantName}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">{app.gender} · Age {calcAge(app.dob, app.academicYear)}</p>
                </div>
              </div>
            </Td>
            <Td><span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-primary-500/10 text-xs font-bold text-primary-600 dark:text-primary-400">{app.applyingForClass}</span></Td>
            <Td><p className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{app.parentName}</p><p className="text-xs text-gray-400 dark:text-zinc-500">{app.parentPhone}</p></Td>
            <Td className="text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">{formatDate(app.submittedDate)}</Td>
            <Td><span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS_BADGE[app.status]}`}>{STATUS_LABEL[app.status]}</span></Td>
            <Td position="last" align="right">
              <RowActionsMenu
                app={app}
                open={openMenuId === app.id}
                onToggle={() => setOpenMenuId(openMenuId === app.id ? null : app.id)}
                onClose={() => setOpenMenuId(null)}
                onEnrolled={onEnrolled}
              />
            </Td>
          </Tr>
        ))}
      </TableBody>
    </Table>
  );
}

export default function AdmissionsClient({ initialApps }: { initialApps: Application[] }) {
  const [query,        setQuery]    = useState("");
  const [statusFilter, setStatus]   = useState("all");
  const [classFilter,  setClass]    = useState("all");
  const [yearFilter,   setYear]     = useState("2026-27");
  const [credentials,  setCredentials] = useState<{ result: EnrollResult; studentName: string } | null>(null);

  const yearApps = useMemo(() => initialApps.filter((a) => a.academicYear===yearFilter), [yearFilter, initialApps]);

  const classOptions = useMemo(
    () => Array.from(new Set(initialApps.map((a) => a.applyingForClass))).sort((a, b) => parseInt(a) - parseInt(b)),
    [initialApps]
  );

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return yearApps.filter((a) => {
      const matchQ   = !q||a.applicantName.toLowerCase().includes(q)||a.applicationNo.toLowerCase().includes(q)||a.parentName.toLowerCase().includes(q)||a.parentPhone.includes(q);
      const matchSt  = statusFilter==="all"||a.status===statusFilter;
      const matchCls = classFilter==="all"||a.applyingForClass===classFilter;
      return matchQ&&matchSt&&matchCls;
    });
  }, [yearApps, query, statusFilter, classFilter]);

  const hasFilter = query||statusFilter!=="all"||classFilter!=="all";
  const clearFilters = useCallback(() => { setQuery(""); setStatus("all"); setClass("all"); }, []);

  function exportCsv() {
    const header = ["Application No", "Applicant", "Class", "Status", "Parent", "Phone", "Email", "Submitted"];
    const rows = filtered.map((a) => [
      a.applicationNo, a.applicantName, a.applyingForClass, STATUS_LABEL[a.status],
      a.parentName, a.parentPhone, a.parentEmail, formatDate(a.submittedDate),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g,'""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admissions-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      {credentials && (
        <CredentialsDialog
          result={credentials.result}
          studentName={credentials.studentName}
          onClose={() => setCredentials(null)}
        />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div><h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Admissions</h1><p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Manage student applications and enrolments</p></div>
        <div className="flex gap-2 sm:ml-auto">
          <button onClick={exportCsv} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><Download className="h-3.5 w-3.5"/> Export</button>
          <FancyButton href="/dashboard/admissions/new" size="sm" className="shrink-0"><Plus className="h-4 w-4"/> New Application</FancyButton>
        </div>
      </div>

      <StatsRow apps={yearApps}/>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none"/>
          <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search name, app no, parent…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"/>
        </div>
        <div className="relative">
          <select value={yearFilter} onChange={(e)=>setYear(e.target.value)} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            {ACADEMIC_YEARS.map((y)=><option key={y} value={y}>{y}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e)=>setStatus(e.target.value)} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            {STATUS_FILTERS.map((f)=><option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        <div className="relative">
          <select value={classFilter} onChange={(e)=>setClass(e.target.value)} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All Classes</option>
            {classOptions.map((c)=><option key={c} value={c}>Class {c}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        {hasFilter&&<button onClick={clearFilters} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><X className="h-3.5 w-3.5"/> Clear</button>}
      </div>
      <ApplicationList
        apps={filtered}
        onEnrolled={(app, result) => setCredentials({ result, studentName: app.applicantName })}
      />
    </div>
  );
}
