"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap, Users, Mail, MapPin, Phone, BookOpen, IndianRupee, LayoutGrid, Award,
  CheckCircle2, AlertCircle, CalendarDays, CalendarOff, Clock, XCircle,
  Library, Printer, Plus, X, ChevronDown, Bus, BedDouble, FileBadge2,
  ClipboardList, MessagesSquare, FolderOpen, StickyNote, History as HistoryIcon,
  Siren, HeartPulse, Upload, Download, Trash2, Loader2, UserSquare2,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { StudentTimetableGrid } from "../../timetable/_components/StudentTimetableGrid";
import type { ClassTimetable, RowItem } from "../../timetable/_data/timetable";
import { STATUS_BADGE, LEAVE_TYPE_LABEL, LEAVE_TYPE_BADGE, formatDate as formatLeaveDate, type LeaveType } from "../../leaves/_data/leaves";
import { applyStudentLeave, updateStudentLeaveStatus, uploadStudentDocument, deleteStudentDocument, addStudentNote } from "../actions";
import { requestCertificate } from "../../certificates/actions";
import { CERT_TYPE_LABEL, STATUS_BADGE as CERT_STATUS_BADGE, type CertType } from "../../certificates/_data/certificates";
import { StudentHomeworkList, type StudentHomeworkItem } from "../../homework/_components/StudentHomeworkList";
import { BOOKING_STATUS_BADGE } from "../../ptm/_data/ptm";

export interface Guardian {
  relationship: string;
  name: string;
  phone: string;
  email: string;
  occupation: string;
}

export interface ExamRow {
  subject: string;
  examName: string;
  marks: number;
  max: number;
  grade: string | null;
  isAbsent: boolean;
}

export interface FeeRow {
  date: string;
  description: string;
  amountDue: number;
  amountPaid: number;
  status: string;
  receiptNo: string | null;
}

export interface LibraryIssueRow {
  title: string;
  author: string;
  category: string;
  issuedDate: string;
  dueDate: string;
  returnedDate: string | null;
  overdue: boolean;
}

export interface LeaveRow {
  id: string;
  leaveType: LeaveType;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  appliedOn: string;
  approvedBy?: string;
}

interface PersonalInfo {
  admissionNo: string;
  dob: string;
  gender: string;
  address: string;
  bloodGroup: string;
  religion: string;
  caste: string;
  motherTongue: string;
  language: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  medicalConditions: string;
  allergies: string;
}

export interface SiblingRow {
  id: string;
  name: string;
  rollNo: string;
  photoUrl: string | null;
  classLabel: string;
}

export interface TransportInfo {
  routeNo: string;
  routeName: string | null;
  stopName: string;
  morningDeparture: string | null;
  eveningDeparture: string | null;
  driverPhone: string | null;
  monthlyFee: number;
  feeStatus: string;
}

export interface HostelInfo {
  roomNo: string;
  block: string | null;
  floor: number | null;
  type: string;
  joinDate: string;
  monthlyFee: number;
  feeStatus: string;
  isActive: boolean;
}

export interface CertificateRow {
  id: string;
  certType: string;
  purpose: string;
  requestedOn: string;
  issuedOn: string | null;
  status: string;
}

export interface PtmRow {
  id: string;
  date: string;
  time: string;
  teacher: string;
  status: string;
}

export interface DocumentRow {
  id: string;
  category: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface NoteRow {
  id: string;
  category: string;
  note: string;
  createdAt: string;
  author: string;
}

export interface HistoryRow {
  id: string;
  year: string;
  classLabel: string;
  rollNo: string;
  outcome: string;
  recordedAt: string;
}

const GRADE_COLOR: Record<string, string> = {
  "A+": "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  "A":  "text-blue-600    dark:text-blue-400    bg-blue-500/10",
  "B+": "text-sky-600     dark:text-sky-400     bg-sky-500/10",
  "B":  "text-amber-600   dark:text-amber-400   bg-amber-500/10",
  "C":  "text-orange-600  dark:text-orange-400  bg-orange-500/10",
};

const FEE_STYLE: Record<string, string> = {
  paid:    "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  partial: "text-amber-600   dark:text-amber-400   bg-amber-500/10  border-amber-500/20",
  overdue: "text-red-600     dark:text-red-400     bg-red-500/10    border-red-500/20",
};

const cardClass = "rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50";

type TabId =
  | "details" | "timetable" | "attendance" | "fees" | "exams" | "library"
  | "homework" | "transport" | "hostel" | "certificates" | "ptm" | "documents" | "notes" | "history";

const TABS: { id: TabId; label: string; icon: typeof GraduationCap }[] = [
  { id: "details",      label: "Student Details",   icon: GraduationCap },
  { id: "timetable",    label: "Time Table",        icon: LayoutGrid },
  { id: "attendance",   label: "Leave & Attendance", icon: CalendarDays },
  { id: "fees",         label: "Fees",              icon: IndianRupee },
  { id: "exams",        label: "Exam & Results",    icon: Award },
  { id: "homework",     label: "Homework",          icon: ClipboardList },
  { id: "library",      label: "Library",           icon: Library },
  { id: "transport",    label: "Transport",         icon: Bus },
  { id: "hostel",       label: "Hostel",            icon: BedDouble },
  { id: "certificates", label: "Certificates",      icon: FileBadge2 },
  { id: "ptm",          label: "PTM",               icon: MessagesSquare },
  { id: "documents",    label: "Documents",         icon: FolderOpen },
  { id: "notes",        label: "Notes",             icon: StickyNote },
  { id: "history",      label: "Academic History",  icon: HistoryIcon },
];

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500",
];

function guardianAvatarColor(name: string) {
  const n = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function guardianInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function printTimetable(studentName: string, classLabel: string, tt: ClassTimetable, rowItems: RowItem[]) {
  const win = window.open("", "_blank", "width=1000,height=750");
  if (!win) return;

  const rows = rowItems.map((row) => {
    if (row.type === "break") {
      return `<tr class="brk"><td colspan="8">${row.label} · ${row.time}</td></tr>`;
    }
    const p = row.period;
    const cells = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => {
      const slot = tt[day as keyof ClassTimetable]?.[p.num];
      return `<td>${slot ? `<div class="subj">${slot.name}</div><div class="meta">${slot.teacher}${slot.room && slot.room !== "—" ? " · " + slot.room : ""}</div>` : ""}</td>`;
    }).join("");
    return `<tr><td class="num">${p.num}</td><td class="time">${p.start}<br/>${p.end}</td>${cells}</tr>`;
  }).join("");

  win.document.write(`
    <!doctype html><html><head><title>Timetable — ${studentName}</title>
    <meta charset="utf-8" />
    <style>
      body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #111; }
      h1 { font-size: 18px; margin: 0 0 2px; }
      p.sub { font-size: 12px; color: #666; margin: 0 0 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; vertical-align: top; }
      th { background: #f3f4f6; text-transform: uppercase; font-size: 10px; letter-spacing: 0.05em; color: #555; }
      td.num, td.time { text-align: center; white-space: nowrap; color: #555; }
      tr.brk td { background: #fafafa; font-style: italic; color: #888; text-align: center; }
      .subj { font-weight: 600; }
      .meta { color: #777; font-size: 10px; }
      @media print { body { padding: 0; } }
    </style>
    </head><body>
      <h1>${studentName} — Weekly Timetable</h1>
      <p class="sub">Class ${classLabel}</p>
      <table>
        <thead><tr><th>Period</th><th>Time</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>
  `);
  win.document.close();
  win.focus();
  win.print();
}

function ApplyLeaveModal({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const [leaveType, setLeaveType] = useState<LeaveType>("casual");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!from || !to || !reason) return;
    startTransition(async () => {
      await applyStudentLeave({ studentId, leaveType, from, to, reason });
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Apply for Leave</p>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 p-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Leave Type</label>
            <div className="relative">
              <select value={leaveType} onChange={(e) => setLeaveType(e.target.value as LeaveType)} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                {(Object.keys(LEAVE_TYPE_LABEL) as LeaveType[]).map((t) => <option key={t} value={t}>{LEAVE_TYPE_LABEL[t]}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">From</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} required className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">To</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} required className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Reason</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} required rows={3} className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Cancel</button>
          <FancyButton type="submit" disabled={isPending} size="sm">{isPending ? "Submitting…" : "Submit Request"}</FancyButton>
        </div>
      </form>
    </div>
  );
}

function LeaveRow({ leave, studentId }: { leave: LeaveRow; studentId: string }) {
  const [isPending, startTransition] = useTransition();

  function act(status: "approved" | "rejected") {
    startTransition(async () => { await updateStudentLeaveStatus(leave.id, studentId, status); });
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${LEAVE_TYPE_BADGE[leave.leaveType]}`}>{LEAVE_TYPE_LABEL[leave.leaveType]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-900 dark:text-zinc-100">
          {formatLeaveDate(leave.from)} – {formatLeaveDate(leave.to)} <span className="text-gray-400 dark:text-zinc-500">({leave.days} day{leave.days !== 1 ? "s" : ""})</span>
        </p>
        <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">{leave.reason}</p>
      </div>
      <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[leave.status].cls}`}>{STATUS_BADGE[leave.status].label}</span>
      {leave.status === "pending" && (
        <div className="flex shrink-0 items-center gap-1">
          <button
            disabled={isPending}
            onClick={() => act("approved")}
            className="flex h-7 items-center gap-1 rounded-lg bg-emerald-500/10 px-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
          </button>
          <button
            disabled={isPending}
            onClick={() => act("rejected")}
            className="flex h-7 items-center gap-1 rounded-lg bg-red-500/10 px-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition-colors"
          >
            <XCircle className="h-3.5 w-3.5" /> Reject
          </button>
        </div>
      )}
    </div>
  );
}

function RequestCertificateModal({ studentId, onClose, onRequested }: { studentId: string; onClose: () => void; onRequested: () => void }) {
  const [certType, setCertType] = useState<CertType>("bonafide");
  const [purpose, setPurpose] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await requestCertificate(studentId, certType, purpose);
      onRequested();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Request Certificate</p>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 p-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Certificate Type</label>
            <div className="relative">
              <select value={certType} onChange={(e) => setCertType(e.target.value as CertType)} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                {(Object.keys(CERT_TYPE_LABEL) as CertType[]).map((t) => <option key={t} value={t}>{CERT_TYPE_LABEL[t]}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Purpose</label>
            <textarea value={purpose} onChange={(e) => setPurpose(e.target.value)} required rows={3} className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Cancel</button>
          <FancyButton type="submit" disabled={isPending} size="sm">{isPending ? "Submitting…" : "Submit Request"}</FancyButton>
        </div>
      </form>
    </div>
  );
}

const DOC_CATEGORIES = ["Birth Certificate", "Transfer Certificate", "ID Proof", "Previous Marksheet", "Photo", "Other"];

function DocumentUploadForm({ studentId, onDone }: { studentId: string; onDone: () => void }) {
  const [category, setCategory] = useState(DOC_CATEGORIES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await uploadStudentDocument(studentId, category, formData);
      setFile(null);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 px-5 py-4 border-b border-gray-100 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/30">
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
        <div className="relative">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            {DOC_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-xs text-gray-500 dark:text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 dark:file:bg-zinc-700 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-600 dark:file:text-zinc-300"
        />
        <FancyButton onClick={handleUpload} disabled={!file || busy} size="sm" className="shrink-0">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Upload
        </FancyButton>
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
    </div>
  );
}

function DocumentItem({ doc, studentId, onDeleted }: { doc: DocumentRow; studentId: string; onDeleted: () => void }) {
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    setBusy(true);
    await deleteStudentDocument(doc.id, studentId);
    onDeleted();
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
        <FolderOpen className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">{doc.fileName}</p>
        <p className="text-xs text-gray-400 dark:text-zinc-500">{doc.category} · {doc.uploadedAt}</p>
      </div>
      <a
        href={doc.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="Download"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
      </a>
      <button
        onClick={handleDelete}
        disabled={busy}
        title="Delete"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

const NOTE_CATEGORIES = ["general", "academic", "behavioral", "achievement"];
const NOTE_CATEGORY_BADGE: Record<string, string> = {
  general:     "bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-300",
  academic:    "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  behavioral:  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  achievement: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

function AddNoteForm({ studentId, onAdded }: { studentId: string; onAdded: () => void }) {
  const [category, setCategory] = useState(NOTE_CATEGORIES[0]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    if (!note.trim()) return;
    setBusy(true);
    try {
      await addStudentNote(studentId, category, note.trim());
      setNote("");
      onAdded();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2 px-5 py-4 border-b border-gray-100 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/30">
      <div className="flex gap-2">
        <div className="relative shrink-0">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 capitalize">
            {NOTE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Add a note about this student…" className="flex-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
      </div>
      <div className="flex justify-end">
        <FancyButton onClick={handleAdd} disabled={!note.trim() || busy} size="xs">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add Note
        </FancyButton>
      </div>
    </div>
  );
}

export function StudentSidebar({
  personal, studentPhone, siblings,
}: {
  personal: PersonalInfo;
  studentPhone: string;
  siblings: SiblingRow[];
}) {
  const languages = personal.language && personal.language !== "—"
    ? personal.language.split(",").map((l) => l.trim()).filter(Boolean)
    : [];

  return (
    <div className="space-y-6">
      <div className={`${cardClass} p-5`}>
        <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50">Basic Information</p>
        <dl className="space-y-3 text-sm">
          {[
            ["Admission No.", personal.admissionNo],
            ["Date of Birth", personal.dob],
            ["Gender",        personal.gender],
            ["Blood Group",   personal.bloodGroup],
            ["Religion",      personal.religion],
            ["Caste",         personal.caste],
            ["Mother Tongue", personal.motherTongue],
          ].map(([label, value]) => (
            <div key={label} className="flex items-center justify-between gap-3">
              <dt className="text-gray-400 dark:text-zinc-500 shrink-0">{label}</dt>
              <dd className="font-medium text-gray-800 dark:text-zinc-200 text-right">{value}</dd>
            </div>
          ))}
          {languages.length > 0 && (
            <div className="flex items-start justify-between gap-3">
              <dt className="text-gray-400 dark:text-zinc-500 shrink-0">Language</dt>
              <dd className="flex flex-wrap justify-end gap-1">
                {languages.map((l) => (
                  <span key={l} className="rounded-md bg-gray-100 dark:bg-zinc-700 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:text-zinc-300">{l}</span>
                ))}
              </dd>
            </div>
          )}
          <div className="border-t border-gray-100 dark:border-zinc-700/50 pt-3">
            <dt className="text-gray-400 dark:text-zinc-500 flex items-center gap-1 mb-1"><MapPin className="h-3.5 w-3.5" /> Address</dt>
            <dd className="font-medium text-gray-800 dark:text-zinc-200">{personal.address}</dd>
          </div>
        </dl>
      </div>

      <div className={`${cardClass} p-5`}>
        <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50">Contact Info</p>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
              <Phone className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-zinc-500">Phone Number</p>
              <p className="font-medium text-gray-800 dark:text-zinc-200">{studentPhone}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`${cardClass} p-5`}>
        <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
          <Siren className="h-4 w-4 text-red-500" /> Emergency Contact
        </p>
        {personal.emergencyContactPhone === "—" && personal.emergencyContactName === "—" ? (
          <p className="text-sm text-gray-400 dark:text-zinc-500">No emergency contact on file.</p>
        ) : (
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-400 dark:text-zinc-500 shrink-0">Name</dt>
              <dd className="font-medium text-gray-800 dark:text-zinc-200 text-right">{personal.emergencyContactName}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-400 dark:text-zinc-500 shrink-0">Relation</dt>
              <dd className="font-medium text-gray-800 dark:text-zinc-200 text-right">{personal.emergencyContactRelation}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-gray-400 dark:text-zinc-500 shrink-0">Phone</dt>
              <dd className="font-medium text-gray-800 dark:text-zinc-200 text-right">{personal.emergencyContactPhone}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className={`${cardClass} p-5`}>
        <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-rose-500" /> Health Info
        </p>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-gray-400 dark:text-zinc-500 mb-1">Medical Conditions</dt>
            <dd className="font-medium text-gray-800 dark:text-zinc-200">{personal.medicalConditions}</dd>
          </div>
          <div className="border-t border-gray-100 dark:border-zinc-700/50 pt-3">
            <dt className="text-gray-400 dark:text-zinc-500 mb-1">Allergies</dt>
            <dd className="font-medium text-gray-800 dark:text-zinc-200">{personal.allergies}</dd>
          </div>
        </dl>
      </div>

      {siblings.length > 0 && (
        <div className={`${cardClass} p-5`}>
          <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
            <UserSquare2 className="h-4 w-4 text-indigo-500" /> Siblings at this School
          </p>
          <div className="space-y-2">
            {siblings.map((sib) => (
              <Link
                key={sib.id}
                href={`/dashboard/students/${sib.id}`}
                className="flex items-center gap-2.5 rounded-lg border border-gray-100 dark:border-zinc-700/50 px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors"
              >
                {sib.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={sib.photoUrl} alt={sib.name} className="h-8 w-8 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-[11px] font-bold text-white">
                    {sib.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{sib.name}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">Roll {sib.rollNo} · Class {sib.classLabel}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentDetailTabs({
  studentId, studentName, classLabel, guardians,
  overallAtt, totalPresent, totalDays, monthly, chartMax, attColorText,
  avgScore, exams,
  totalFees, paidFees, fees,
  timetable, library, leaves,
  transport, hostel, certificates, homework, ptm, documents, notes, academicHistory,
}: {
  studentId: string;
  studentName: string;
  classLabel: string;
  guardians: Guardian[];
  overallAtt: number;
  totalPresent: number;
  totalDays: number;
  monthly: { month: string; present: number; total: number }[];
  chartMax: number;
  attColorText: string;
  avgScore: number | null;
  exams: ExamRow[];
  totalFees: number;
  paidFees: number;
  fees: FeeRow[];
  timetable: { tt: ClassTimetable; rowItems: RowItem[] };
  library: LibraryIssueRow[];
  leaves: LeaveRow[];
  transport: TransportInfo | null;
  hostel: HostelInfo | null;
  certificates: CertificateRow[];
  homework: StudentHomeworkItem[];
  ptm: PtmRow[];
  documents: DocumentRow[];
  notes: NoteRow[];
  academicHistory: HistoryRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("details");
  const [applyOpen, setApplyOpen] = useState(false);
  const [certOpen, setCertOpen] = useState(false);

  function attPct(m: { present: number; total: number }) {
    return m.total ? Math.round((m.present / m.total) * 100) : 0;
  }

  return (
    <>
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-zinc-800">
        {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                tab === t.id
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          ))}
        </div>

      {/* Student Details (Parent / Guardian) */}
      {tab === "details" && (
        <div className={`${cardClass} p-5`}>
          <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary-500" /> Parents Information
          </p>
          {guardians.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500">No parent or guardian linked yet.</p>
          ) : (
            <div className="space-y-3">
              {guardians.map((g, i) => (
                <div key={i} className="rounded-lg border border-gray-100 dark:border-zinc-700/50 px-3.5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${guardianAvatarColor(g.name)}`}>
                      {guardianInitials(g.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-zinc-100">{g.name}</p>
                      <p className="text-xs font-medium text-primary-600 dark:text-primary-400 capitalize">{g.relationship}{g.occupation && g.occupation !== "—" ? ` · ${g.occupation}` : ""}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400 dark:text-zinc-500 flex items-center justify-end gap-1"><Phone className="h-3 w-3" /> Phone</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{g.phone}</p>
                    </div>
                    <div className="text-right shrink-0 hidden sm:block">
                      <p className="text-xs text-gray-400 dark:text-zinc-500 flex items-center justify-end gap-1"><Mail className="h-3 w-3" /> Email</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate max-w-[160px]">{g.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timetable */}
      {tab === "timetable" && (
        <StudentTimetableGrid
          tt={timetable.tt}
          rowItems={timetable.rowItems}
          classLabel={classLabel}
          action={
            <button
              onClick={() => printTimetable(studentName, classLabel, timetable.tt, timetable.rowItems)}
              className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
          }
        />
      )}

      {/* Attendance & Leave */}
      {tab === "attendance" && (
        <div className="space-y-6">
          <div className={`${cardClass} p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-indigo-500" /> Monthly Attendance
              </p>
              {monthly.length > 0 && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${attColorText} bg-emerald-500/10`}>
                  {overallAtt}% overall
                </span>
              )}
            </div>
            {monthly.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-zinc-500 py-6 text-center">No attendance records yet.</p>
            ) : (
              <div className="flex items-end gap-2" style={{ height: 100 }}>
                {monthly.map((m) => {
                  const pct = attPct(m);
                  const barH = Math.round((m.present / chartMax) * 72);
                  return (
                    <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] font-semibold tabular-nums text-gray-600 dark:text-zinc-300">{pct}%</span>
                      <div className="w-full flex flex-col justify-end" style={{ height: 72 }}>
                        <div className="w-full rounded-t-md bg-primary-500" style={{ height: barH || 3 }} />
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">{m.month}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="mt-3 text-xs text-gray-400 dark:text-zinc-500">{totalPresent}/{totalDays} days recorded</p>
          </div>

          <div className={`${cardClass} overflow-hidden`}>
            <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary-500" /> Leave Requests
              </p>
              <FancyButton onClick={() => setApplyOpen(true)} size="xs">
                <Plus className="h-3.5 w-3.5" /> Apply for Leave
              </FancyButton>
            </div>
            {leaves.length === 0 ? (
              <div className="py-10 text-center">
                <CalendarOff className="h-8 w-8 text-gray-300 dark:text-zinc-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-zinc-400">No leave requests yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
                {leaves.map((l) => <LeaveRow key={l.id} leave={l} studentId={studentId} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fees */}
      {tab === "fees" && (
        <div className={`${cardClass} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-indigo-500" />
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Fee History</p>
            </div>
            {totalFees > 0 && (
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-zinc-400">Paid</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{paidFees.toLocaleString("en-IN")}</p>
              </div>
            )}
          </div>

          {fees.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500 py-10 text-center">No fee records yet.</p>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700">
                <div className="flex justify-between text-xs text-gray-500 dark:text-zinc-400 mb-1.5">
                  <span>Total: ₹{totalFees.toLocaleString("en-IN")}</span>
                  <span>{totalFees ? Math.round((paidFees / totalFees) * 100) : 0}% paid</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-zinc-700">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${totalFees ? (paidFees / totalFees) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
                {fees.map((f, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      f.status === "paid" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                      f.status === "partial" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" :
                      "bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}>
                      {f.status === "paid" ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">{f.description}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">{f.date}{f.receiptNo ? ` · ${f.receiptNo}` : ""}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">₹{f.amountDue.toLocaleString("en-IN")}</p>
                      <span className={`text-[10px] font-semibold capitalize px-1.5 py-0.5 rounded-full border ${FEE_STYLE[f.status] ?? FEE_STYLE.overdue}`}>
                        {f.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Exams & Results */}
      {tab === "exams" && (
        <div className={`${cardClass} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-500" />
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Subject-wise Performance</p>
            </div>
            {avgScore !== null && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-blue-600 dark:text-blue-400 bg-blue-500/10">
                {avgScore}% average
              </span>
            )}
          </div>
          {exams.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500 py-10 text-center">No exam results recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                  <th className="py-2.5 pl-5 pr-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Subject</th>
                  <th className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Score</th>
                  <th className="py-2.5 pl-3 pr-5 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Progress</th>
                  <th className="py-2.5 pl-3 pr-5 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
                {exams.map((sub, i) => {
                  const pct = sub.isAbsent ? 0 : Math.round((sub.marks / sub.max) * 100);
                  const gc = (sub.grade && GRADE_COLOR[sub.grade]) ?? "text-gray-600 bg-gray-100";
                  return (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                      <td className="py-3 pl-5 pr-3 font-medium text-gray-800 dark:text-zinc-200">{sub.subject}</td>
                      <td className="px-3 py-3 text-center text-gray-600 dark:text-zinc-400 tabular-nums">
                        {sub.isAbsent ? (
                          <span className="text-xs font-semibold text-red-500">Absent</span>
                        ) : (
                          <><span className="font-semibold text-gray-900 dark:text-zinc-50">{sub.marks}</span>/{sub.max}</>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
                            <div className="h-1.5 rounded-full bg-primary-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs tabular-nums text-gray-500 dark:text-zinc-400 w-7 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="py-3 pl-3 pr-5 text-center">
                        <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold ${gc}`}>
                          {sub.grade ?? "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>
      )}

      {/* Library */}
      {tab === "library" && (
        <div className={`${cardClass} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center gap-2">
            <Library className="h-4 w-4 text-primary-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Library — Issued Books</p>
          </div>
          {library.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500 py-10 text-center">No books issued yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {library.map((b, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">{b.title}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{b.author} · {b.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Issued {b.issuedDate}</p>
                    {b.returnedDate ? (
                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Returned {b.returnedDate}</span>
                    ) : (
                      <span className={`text-[11px] font-medium ${b.overdue ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-zinc-400"}`}>
                        Due {b.dueDate}{b.overdue ? " · Overdue" : ""}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Homework */}
      {tab === "homework" && <StudentHomeworkList items={homework} studentId={studentId} />}

      {/* Transport */}
      {tab === "transport" && (
        <div className={`${cardClass} p-5`}>
          <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
            <Bus className="h-4 w-4 text-blue-500" /> Transport
          </p>
          {!transport ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500 py-6 text-center">Not assigned to a transport route yet.</p>
          ) : (
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-gray-400 dark:text-zinc-500">Route</dt>
                <dd className="font-medium text-gray-800 dark:text-zinc-200 text-right">{transport.routeNo}{transport.routeName ? ` — ${transport.routeName}` : ""}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-gray-400 dark:text-zinc-500">Pickup Stop</dt>
                <dd className="font-medium text-gray-800 dark:text-zinc-200 text-right">{transport.stopName}</dd>
              </div>
              {(transport.morningDeparture || transport.eveningDeparture) && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-gray-400 dark:text-zinc-500">Timing</dt>
                  <dd className="font-medium text-gray-800 dark:text-zinc-200 text-right">
                    {transport.morningDeparture?.slice(0, 5) ?? "—"} / {transport.eveningDeparture?.slice(0, 5) ?? "—"}
                  </dd>
                </div>
              )}
              {transport.driverPhone && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-gray-400 dark:text-zinc-500">Driver Phone</dt>
                  <dd className="font-medium text-gray-800 dark:text-zinc-200 text-right">{transport.driverPhone}</dd>
                </div>
              )}
              <div className="border-t border-gray-100 dark:border-zinc-700/50 pt-3 flex items-center justify-between gap-3">
                <dt className="text-gray-400 dark:text-zinc-500">Monthly Fee</dt>
                <dd className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-zinc-50">₹{transport.monthlyFee.toLocaleString("en-IN")}</span>
                  <span className={`text-[10px] font-semibold capitalize px-1.5 py-0.5 rounded-full border ${FEE_STYLE[transport.feeStatus] ?? FEE_STYLE.overdue}`}>{transport.feeStatus}</span>
                </dd>
              </div>
            </dl>
          )}
        </div>
      )}

      {/* Hostel */}
      {tab === "hostel" && (
        <div className={`${cardClass} p-5`}>
          <p className="mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-violet-500" /> Hostel
          </p>
          {!hostel ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500 py-6 text-center">Not allotted a hostel room.</p>
          ) : (
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-gray-400 dark:text-zinc-500">Room</dt>
                <dd className="font-medium text-gray-800 dark:text-zinc-200 text-right">
                  {hostel.roomNo}{hostel.block ? ` · Block ${hostel.block}` : ""}{hostel.floor != null ? ` · Floor ${hostel.floor}` : ""}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-gray-400 dark:text-zinc-500">Room Type</dt>
                <dd className="font-medium text-gray-800 dark:text-zinc-200 text-right capitalize">{hostel.type}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-gray-400 dark:text-zinc-500">Joined</dt>
                <dd className="font-medium text-gray-800 dark:text-zinc-200 text-right">{hostel.joinDate}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-gray-400 dark:text-zinc-500">Status</dt>
                <dd className={`text-xs font-semibold px-2 py-0.5 rounded-full ${hostel.isActive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"}`}>
                  {hostel.isActive ? "Active" : "Checked out"}
                </dd>
              </div>
              <div className="border-t border-gray-100 dark:border-zinc-700/50 pt-3 flex items-center justify-between gap-3">
                <dt className="text-gray-400 dark:text-zinc-500">Monthly Fee</dt>
                <dd className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 dark:text-zinc-50">₹{hostel.monthlyFee.toLocaleString("en-IN")}</span>
                  <span className={`text-[10px] font-semibold capitalize px-1.5 py-0.5 rounded-full border ${FEE_STYLE[hostel.feeStatus] ?? FEE_STYLE.overdue}`}>{hostel.feeStatus}</span>
                </dd>
              </div>
            </dl>
          )}
        </div>
      )}

      {/* Certificates */}
      {tab === "certificates" && (
        <div className={`${cardClass} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50 flex items-center gap-2">
              <FileBadge2 className="h-4 w-4 text-primary-500" /> Certificates
            </p>
            <FancyButton onClick={() => setCertOpen(true)} size="xs">
              <Plus className="h-3.5 w-3.5" /> Request Certificate
            </FancyButton>
          </div>
          {certificates.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500 py-10 text-center">No certificate requests yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {certificates.map((c) => (
                <div key={c.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{CERT_TYPE_LABEL[c.certType as CertType] ?? c.certType}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">{c.purpose}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-500 dark:text-zinc-400">Requested {c.requestedOn}</p>
                    {c.issuedOn && <p className="text-[11px] text-emerald-600 dark:text-emerald-400">Issued {c.issuedOn}</p>}
                  </div>
                  <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${CERT_STATUS_BADGE[c.status as keyof typeof CERT_STATUS_BADGE]?.cls ?? ""}`}>
                    {CERT_STATUS_BADGE[c.status as keyof typeof CERT_STATUS_BADGE]?.label ?? c.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Parent-Teacher Meetings */}
      {tab === "ptm" && (
        <div className={`${cardClass} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center gap-2">
            <MessagesSquare className="h-4 w-4 text-primary-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Parent-Teacher Meetings</p>
          </div>
          {ptm.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500 py-10 text-center">No PTM bookings yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {ptm.map((p) => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{p.date} · {p.time}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">with {p.teacher}</p>
                  </div>
                  <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${BOOKING_STATUS_BADGE[p.status as keyof typeof BOOKING_STATUS_BADGE]?.cls ?? ""}`}>
                    {BOOKING_STATUS_BADGE[p.status as keyof typeof BOOKING_STATUS_BADGE]?.label ?? p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Documents */}
      {tab === "documents" && (
        <div className={`${cardClass} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-primary-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Documents</p>
          </div>
          <DocumentUploadForm studentId={studentId} onDone={() => router.refresh()} />
          {documents.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500 py-10 text-center">No documents uploaded yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {documents.map((d) => (
                <DocumentItem key={d.id} doc={d} studentId={studentId} onDeleted={() => router.refresh()} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {tab === "notes" && (
        <div className={`${cardClass} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-primary-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Notes & Remarks</p>
          </div>
          <AddNoteForm studentId={studentId} onAdded={() => router.refresh()} />
          {notes.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500 py-10 text-center">No notes yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {notes.map((n) => (
                <div key={n.id} className="px-5 py-3.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${NOTE_CATEGORY_BADGE[n.category] ?? NOTE_CATEGORY_BADGE.general}`}>{n.category}</span>
                    <span className="text-xs text-gray-400 dark:text-zinc-500">{n.author} · {n.createdAt}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-zinc-300">{n.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Academic History */}
      {tab === "history" && (
        <div className={`${cardClass} overflow-hidden`}>
          <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700 flex items-center gap-2">
            <HistoryIcon className="h-4 w-4 text-primary-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Academic History</p>
          </div>
          {academicHistory.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-zinc-500 py-10 text-center">No academic history recorded yet.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {academicHistory.map((h) => (
                <div key={h.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{h.year} · Class {h.classLabel}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">Roll No. {h.rollNo} · Recorded {h.recordedAt}</p>
                  </div>
                  <span className="shrink-0 inline-flex items-center rounded-full bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 text-xs font-medium capitalize text-gray-600 dark:text-zinc-300">
                    {h.outcome}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>

      {applyOpen && <ApplyLeaveModal studentId={studentId} onClose={() => setApplyOpen(false)} />}
      {certOpen && <RequestCertificateModal studentId={studentId} onClose={() => setCertOpen(false)} onRequested={() => router.refresh()} />}
    </>
  );
}
