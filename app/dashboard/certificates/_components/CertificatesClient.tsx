"use client";

import { useState, useMemo, useRef, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  Award, Clock, CheckCircle2, FileText, Search, Plus,
  Download, X, Eye, Printer, XCircle, PackageCheck,
  ArrowUpDown, ArrowUp, ArrowDown,
  ChevronLeft, ChevronRight, ChevronDown, Loader2,
} from "lucide-react";
import { STATUS_BADGE, CERT_TYPE_LABEL, CERT_TYPE_BADGE, formatDate } from "../_data/certificates";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";
import { SimpleSelect } from "@/components/ui/select";
import { requestCertificate, rejectCertificateRequest, markCertificateReady, markCertificateIssued, searchActiveStudents } from "../actions";
import { CertificateDocument } from "./certificate-document";
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

export interface StudentOption {
  id: string;
  name: string;
  rollNo: string;
  class: string;
  section: string;
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

const CERT_TYPE_OPTIONS = (Object.keys(CERT_TYPE_LABEL) as CertType[]).map((t) => ({ value: t, label: CERT_TYPE_LABEL[t] }));

function StudentSearchField({
  student, onSelect,
}: {
  student: StudentOption | null;
  onSelect: (student: StudentOption | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentOption[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (!open) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const id = ++requestId.current;
    setLoading(true);
    searchTimer.current = setTimeout(async () => {
      const page = await searchActiveStudents(query, 0);
      if (id !== requestId.current) return;
      setResults(page.students);
      setHasMore(page.hasMore);
      setLoading(false);
    }, 250);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => searchInputRef.current?.focus());

    function updatePosition() {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (rect) setPanelStyle({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  async function loadMore() {
    if (loading || loadingMore || !hasMore) return;
    const id = requestId.current;
    setLoadingMore(true);
    const page = await searchActiveStudents(query, results.length);
    if (id !== requestId.current) return;
    setResults((prev) => [...prev, ...page.students]);
    setHasMore(page.hasMore);
    setLoadingMore(false);
  }

  function handleListScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) loadMore();
  }

  function openDropdown() {
    setQuery("");
    setResults([]);
    setOpen(true);
  }

  function pick(s: StudentOption) {
    onSelect(s);
    setOpen(false);
  }

  if (student) {
    return (
      <div className="flex h-9 w-full items-center gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-1.5 text-sm">
        <span className="min-w-0 flex-1 truncate text-gray-900 dark:text-zinc-100">
          {student.name} <span className="text-gray-400 dark:text-zinc-500">— Class {student.class}{student.section} ({student.rollNo})</span>
        </span>
        <button
          type="button"
          onClick={() => onSelect(null)}
          title="Change student"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        className={`flex h-9 w-full items-center justify-between rounded-lg border bg-white dark:bg-zinc-800 px-3 text-sm outline-none ${open ? "border-primary-400" : "border-gray-200 dark:border-zinc-700"}`}
      >
        <span className="text-gray-400 dark:text-zinc-500">Select a student…</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && panelStyle && createPortal(
        <div
          ref={panelRef}
          style={{ position: "fixed", top: panelStyle.top, left: panelStyle.left, width: panelStyle.width }}
          className="z-[70] overflow-hidden rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg"
        >
          <div className="relative border-b border-gray-200 dark:border-zinc-700 p-1.5">
            <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
              placeholder="Search by name or roll no…"
              autoComplete="off"
              className="h-8 w-full rounded-md border-0 bg-gray-50 dark:bg-zinc-900 pl-7 pr-7 text-sm text-gray-900 dark:text-zinc-100 outline-none"
            />
            {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-gray-400 dark:text-zinc-500" />}
          </div>
          <div onScroll={handleListScroll} className="max-h-56 overflow-auto">
            {results.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => pick(s)}
                className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              >
                <span className="text-sm text-gray-900 dark:text-zinc-100">{s.name}</span>
                <span className="text-xs text-gray-400 dark:text-zinc-500">Class {s.class}{s.section} · {s.rollNo}</span>
              </button>
            ))}
            {loadingMore && (
              <div className="flex items-center justify-center gap-1.5 py-2 text-xs text-gray-400 dark:text-zinc-500">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading more…
              </div>
            )}
            {!loading && results.length === 0 && (
              <p className="px-3 py-2 text-[11px] text-gray-400 dark:text-zinc-500">
                {query.trim() ? "No matching students." : "No active students found."}
              </p>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

function NewRequestModal({
  onClose, onCreated,
}: {
  onClose: () => void;
  onCreated: (cert: Cert) => void;
}) {
  const [student,   setStudent]   = useState<StudentOption | null>(null);
  const [certType,  setCertType]  = useState<CertType>("bonafide");
  const [purpose,   setPurpose]   = useState("");
  const [error,     setError]     = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!student) { setError("Please select a student."); return; }
    if (!purpose.trim()) { setError("Please enter a purpose."); return; }
    setError(null);
    startTransition(async () => {
      try {
        const result = await requestCertificate(student.id, certType, purpose.trim());
        onCreated({
          id: result.id,
          studentName: student.name,
          rollNo: student.rollNo,
          class: student.class,
          section: student.section,
          certType,
          purpose: purpose.trim(),
          requestedOn: result.requestedOn,
          status: "pending",
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit request");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">New Certificate Request</p>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-4 p-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Student</label>
            <StudentSearchField student={student} onSelect={setStudent} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Certificate Type</label>
            <SimpleSelect value={certType} onValueChange={(v) => setCertType(v as CertType)} options={CERT_TYPE_OPTIONS} className="h-9 py-0" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Purpose</label>
            <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} required rows={3} placeholder="e.g. Passport application" className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
          </div>
          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Cancel</button>
          <FancyButton type="submit" disabled={isPending} size="sm">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {isPending ? "Submitting…" : "Submit Request"}
          </FancyButton>
        </div>
      </form>
    </div>
  );
}

function CertificateViewModal({
  cert, schoolInfo, onClose,
}: {
  cert: Cert;
  schoolInfo: { schoolName: string; schoolAddress: string; schoolLogoUrl: string | null; schoolSignatureUrl: string | null; academicYear: string };
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);

  function handlePrint() { window.print(); }

  async function handleDownload() {
    if (downloading) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      const node = document.getElementById("certificate-preview");
      if (!node) return;
      const canvas = await html2canvas(node, { scale: 2, backgroundColor: "#ffffff" });
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      doc.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 210, 297);
      doc.save(`${CERT_TYPE_LABEL[cert.certType].replace(/\s+/g, "-").toLowerCase()}-${cert.studentName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:hidden" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()} className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{CERT_TYPE_LABEL[cert.certType]} — {cert.studentName}</p>
            <button onClick={onClose} className="shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex-1 overflow-auto bg-gray-100 dark:bg-zinc-950 p-6">
            <div className="origin-top scale-[0.8] shadow-lg sm:scale-90 lg:scale-100">
              <div id="certificate-preview">
                <CertificateDocument cert={cert} {...schoolInfo} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
            <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Close</button>
            <button type="button" onClick={handleDownload} disabled={downloading} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 disabled:opacity-50 transition-colors">
              {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} {downloading ? "Generating…" : "Download PDF"}
            </button>
            <FancyButton type="button" onClick={handlePrint} size="sm"><Printer className="h-4 w-4" /> Print</FancyButton>
          </div>
        </div>
      </div>

      {/* Print-only full-size copy — the browser's print engine shows/hides this natively via CSS, so no
          html2canvas capture trickery is needed here (that's only for the Download PDF button above, which
          captures the already-visible on-screen preview instead). */}
      <div className="hidden print:block">
        <CertificateDocument cert={cert} {...schoolInfo} />
      </div>

      <style>{`@media print { @page { size: A4; margin: 0; } }`}</style>
    </>
  );
}

const PAGE_SIZE = 10;
const TABS: { id: TabFilter; label: string }[] = [
  { id: "all", label: "All" }, { id: "pending", label: "Pending" }, { id: "ready", label: "Ready" }, { id: "issued", label: "Issued" },
];

export default function CertificatesClient({
  initialCerts, schoolName, schoolAddress, schoolLogoUrl, schoolSignatureUrl, academicYear,
}: {
  initialCerts: Cert[];
  schoolName: string;
  schoolAddress: string;
  schoolLogoUrl: string | null;
  schoolSignatureUrl: string | null;
  academicYear: string;
}) {
  const [certs,      setCerts]     = useState(initialCerts);
  const [tab,        setTab]       = useState<TabFilter>("all");
  const [query,      setQuery]     = useState("");
  const [typeFilter, setType]      = useState<"all"|CertType>("all");
  const [sortField,  setSortField] = useState<SortField>("requestedOn");
  const [sortDir,    setSortDir]   = useState<SortDir>("desc");
  const [page,       setPage]      = useState(1);
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [viewCert,   setViewCert]  = useState<Cert | null>(null);
  const [, startTransition] = useTransition();
  const schoolInfo = { schoolName, schoolAddress, schoolLogoUrl, schoolSignatureUrl, academicYear };

  function toggleSort(field: SortField) {
    if (sortField===field) setSortDir((d)=>(d==="asc"?"desc":"asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  function reject(id: string) {
    setCerts((prev) => prev.map((c) => (c.id === id ? { ...c, status: "rejected" } : c)));
    startTransition(async () => { await rejectCertificateRequest(id); });
  }

  function markReady(id: string) {
    setCerts((prev) => prev.map((c) => (c.id === id ? { ...c, status: "ready" } : c)));
    startTransition(async () => { await markCertificateReady(id); });
  }

  function markIssued(id: string) {
    const today = new Date().toISOString().slice(0, 10);
    setCerts((prev) => prev.map((c) => (c.id === id ? { ...c, status: "issued", issuedOn: today } : c)));
    startTransition(async () => { await markCertificateIssued(id); });
  }

  function exportCsv() {
    const header = ["Student", "Roll No", "Class", "Section", "Certificate", "Purpose", "Requested On", "Issued On", "Status", "Issued By"];
    const rows = filtered.map((c) => [c.studentName, c.rollNo, c.class, c.section, CERT_TYPE_LABEL[c.certType], c.purpose, formatDate(c.requestedOn), c.issuedOn ? formatDate(c.issuedOn) : "", STATUS_BADGE[c.status].label, c.issuedBy ?? ""]);
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificates-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return certs.filter((c) => {
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
  }, [tab, query, typeFilter, sortField, sortDir, certs]);

  const totalPages = Math.max(1, Math.ceil(filtered.length/PAGE_SIZE));
  const pageData   = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const hasFilter  = query||typeFilter!=="all";
  function clearFilters() { setQuery(""); setType("all"); setPage(1); }

  return (
    <div className="w-full px-6 py-6 space-y-5 print:p-0">
    <div className="print:hidden space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div><h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Certificates</h1><p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Generate and issue student certificates</p></div>
        <div className="flex gap-2 sm:ml-auto">
          <button onClick={exportCsv} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><Download className="h-3.5 w-3.5"/> Export</button>
          <FancyButton size="sm" onClick={()=>setNewRequestOpen(true)}><Plus className="h-4 w-4"/> New Request</FancyButton>
        </div>
      </div>

      <StatsRow certs={certs} />

      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
        {TABS.map(({id,label}) => (
          <button key={id} onClick={()=>{setTab(id);setPage(1);}} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${tab===id?"border-primary-500 text-primary-600 dark:text-primary-400":"border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:border-gray-300 dark:hover:border-zinc-600"}`}>
            {label}
            <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${tab===id?"bg-primary-500/15 text-primary-600 dark:text-primary-400":"bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-500"}`}>
              {id==="all"?certs.length:certs.filter((c)=>c.status===id).length}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none"/>
          <input value={query} onChange={(e)=>{setQuery(e.target.value);setPage(1);}} placeholder="Search student name, roll no or purpose…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"/>
        </div>
        <SimpleSelect
          value={typeFilter}
          onValueChange={(v)=>{setType(v as "all"|CertType);setPage(1);}}
          options={[{ value: "all", label: "All Types" }, ...CERT_TYPE_OPTIONS]}
          className="h-9 w-auto min-w-[9.5rem] py-0"
        />
        {hasFilter&&<button onClick={clearFilters} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><X className="h-3.5 w-3.5"/> Clear</button>}
      </div>

      {hasFilter&&(
        <div className="flex items-center justify-end">
          <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">Filters active</span>
        </div>
      )}

      <Table
        footer={
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-zinc-400">Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length===0?0:(page-1)*PAGE_SIZE+1}-{Math.min(page*PAGE_SIZE,filtered.length)}</span> of <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> requests</p>
            {totalPages>1&&(
              <div className="flex items-center gap-1">
                <button onClick={()=>setPage((p)=>Math.max(1,p-1))} disabled={page===1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"><ChevronLeft className="h-3.5 w-3.5"/></button>
                {Array.from({length:totalPages},(_,i)=>i+1).filter((n)=>n===1||n===totalPages||Math.abs(n-page)<=1).reduce<(number|"…")[]>((acc,n,i,arr)=>{if(i>0&&n-(arr[i-1] as number)>1)acc.push("…");acc.push(n);return acc;},[]).map((n,i)=>n==="…"?<span key={`e${i}`} className="px-1 text-xs text-gray-400">…</span>:<button key={n} onClick={()=>setPage(n as number)} className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${page===n?"bg-primary-500 text-white":"border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"}`}>{n}</button>)}
                <button onClick={()=>setPage((p)=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"><ChevronRight className="h-3.5 w-3.5"/></button>
              </div>
            )}
          </div>
        }
      >
        <TableHead>
          <Th position="first"><button onClick={()=>toggleSort("studentName")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Student <SortIcon active={sortField==="studentName"} dir={sortDir}/></button></Th>
          <Th><button onClick={()=>toggleSort("class")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Class <SortIcon active={sortField==="class"} dir={sortDir}/></button></Th>
          <Th><button onClick={()=>toggleSort("certType")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Certificate <SortIcon active={sortField==="certType"} dir={sortDir}/></button></Th>
          <Th>Purpose</Th>
          <Th><button onClick={()=>toggleSort("requestedOn")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Requested <SortIcon active={sortField==="requestedOn"} dir={sortDir}/></button></Th>
          <Th>Issued On</Th>
          <Th><button onClick={()=>toggleSort("status")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Status <SortIcon active={sortField==="status"} dir={sortDir}/></button></Th>
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
                    <button onClick={()=>setViewCert(cert)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors" title="View"><Eye className="h-3.5 w-3.5"/></button>
                    {(cert.status==="pending"||cert.status==="ready")&&<button onClick={()=>setViewCert(cert)} className="flex h-7 w-7 items-center justify-center rounded-lg text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors" title="Print"><Printer className="h-3.5 w-3.5"/></button>}
                    {cert.status==="pending"&&<button onClick={()=>markReady(cert.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-500 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors" title="Mark ready"><CheckCircle2 className="h-3.5 w-3.5"/></button>}
                    {cert.status==="ready"&&<button onClick={()=>markIssued(cert.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-emerald-500 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors" title="Mark issued"><PackageCheck className="h-3.5 w-3.5"/></button>}
                    {cert.status==="pending"&&<button onClick={()=>reject(cert.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors" title="Reject"><XCircle className="h-3.5 w-3.5"/></button>}
                  </div>
                </Td>
              </Tr>
            );
          })}
        </TableBody>
      </Table>

      {newRequestOpen && (
        <NewRequestModal
          onClose={()=>setNewRequestOpen(false)}
          onCreated={(cert)=>{ setCerts((prev)=>[cert, ...prev]); setPage(1); }}
        />
      )}
    </div>

      {viewCert && (
        <CertificateViewModal
          cert={viewCert}
          schoolInfo={schoolInfo}
          onClose={()=>setViewCert(null)}
        />
      )}
    </div>
  );
}
