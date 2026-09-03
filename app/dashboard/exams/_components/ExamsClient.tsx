"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ClipboardCheck, Trophy, CheckCircle2, Clock, Plus, Loader2,
  CalendarDays, BookOpen, Download, ChevronDown, ChevronRight, ListChecks,
} from "lucide-react";
import {
  formatDate, formatDateShort,
  TYPE_LABEL, TYPE_STYLE, STATUS_LABEL, STATUS_STYLE,
  type Exam, type ExamType,
} from "../_data/exams";
import { createExam } from "../actions";
import { FancyButton } from "@/components/ui/fancy-button";
import { SchoolFilterSelect, SchoolCell, matchesSchoolFilter } from "../../_components/school-filter";
import type { InstitutionSchool } from "@/lib/supabase/institution-context";

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

function AddExamModal({
  onClose, onCreated, schools = [],
}: {
  onClose: () => void;
  onCreated: (examId: string) => void;
  schools?: InstitutionSchool[];
}) {
  const multiSchool = schools.length > 1;
  const [form, setForm] = useState({ name: "", type: "unit_test" as ExamType, startDate: "", endDate: "", schoolId: schools[0]?.id ?? "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Exam name is required."); return; }
    setBusy(true);
    setError(null);
    try {
      const id = await createExam({ ...form, schoolId: multiSchool ? form.schoolId : undefined });
      onCreated(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create exam");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">New Exam</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {multiSchool && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">School</label>
              <select className={inputClass} value={form.schoolId} onChange={(e) => update("schoolId", e.target.value)}>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Exam Name *</label>
            <input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Mid-Term Exam" required autoFocus />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Type</label>
            <select className={inputClass} value={form.type} onChange={(e) => update("type", e.target.value as ExamType)}>
              {(Object.keys(TYPE_LABEL) as ExamType[]).map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Start Date *</label>
              <input type="date" className={inputClass} value={form.startDate} onChange={(e) => update("startDate", e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">End Date *</label>
              <input type="date" className={inputClass} value={form.endDate} onChange={(e) => update("endDate", e.target.value)} min={form.startDate} required />
            </div>
          </div>
          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">{error}</div>
          )}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">Cancel</button>
            <FancyButton type="submit" disabled={busy} size="sm">
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create Exam
            </FancyButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function ExamStatsRow({ exams }: { exams: Exam[] }) {
  const total = exams.length;
  const upcoming = exams.filter((e) => e.status === "upcoming" || e.status === "ongoing").length;
  const completed = exams.filter((e) => e.status === "completed" || e.status === "published").length;
  const published = exams.filter((e) => e.status === "published").length;

  const items = [
    { label: "Total Exams",       value: total,     icon: ClipboardCheck, accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Upcoming",          value: upcoming,  icon: Clock,          accent: "text-amber-500   bg-amber-500/10"   },
    { label: "Completed",         value: completed, icon: CheckCircle2,   accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Results Published", value: published, icon: Trophy,         accent: "text-violet-500  bg-violet-500/10"  },
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

function ExamCard({ exam }: { exam: Exam }) {
  return (
    <Link
      href={`/dashboard/exams/${exam.id}`}
      className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 flex flex-col gap-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLE[exam.type]}`}>{TYPE_LABEL[exam.type]}</span>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[exam.status]}`}>{STATUS_LABEL[exam.status]}</span>
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">{exam.name}</h3>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1">
          {exam.academicYear}
          {exam.schoolName && <> · <SchoolCell name={exam.schoolName} /></>}
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
        <span>{formatDateShort(exam.startDate)} – {formatDate(exam.endDate)}</span>
      </div>
      <div className="flex items-start gap-1.5">
        <BookOpen className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-zinc-500 mt-0.5" />
        <div className="flex flex-wrap gap-1">
          {exam.subjects.length === 0 ? (
            <span className="text-[10px] text-gray-400 dark:text-zinc-500">No subjects recorded yet</span>
          ) : exam.subjects.map((s) => (
            <span key={s} className="rounded-md bg-gray-100 dark:bg-zinc-700 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:text-zinc-300">{s}</span>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-zinc-700/50">
        <span className="text-xs text-gray-400 dark:text-zinc-500">Timetable · Results · Admit Cards</span>
        <ChevronRight className="h-4 w-4 text-gray-300 dark:text-zinc-600" />
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "published", label: "Results Published" },
];

export default function ExamsClient({ exams, schools = [] }: { exams: Exam[]; schools?: InstitutionSchool[] }) {
  const router = useRouter();
  const academicYears = useMemo(() => Array.from(new Set(exams.map((e) => e.academicYear))), [exams]);
  const [yearFilter, setYearFilter] = useState(academicYears[0] ?? "");
  const [statusFilter, setStatusFilter] = useState("all");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [addOpen, setAddOpen] = useState(false);

  const yearExams = useMemo(() => exams.filter((e) => e.academicYear === yearFilter), [exams, yearFilter]);
  const filteredExams = useMemo(() => yearExams
    .filter((e) => statusFilter === "all" || e.status === statusFilter)
    .filter((e) => matchesSchoolFilter(schoolFilter, e.schoolId)), [yearExams, statusFilter, schoolFilter]);

  function exportCsv() {
    const header = ["Name", "Type", "Status", "Start Date", "End Date", "Academic Year", "Subjects"];
    const rows = filteredExams.map((e) => [e.name, TYPE_LABEL[e.type], STATUS_LABEL[e.status], formatDate(e.startDate), formatDate(e.endDate), e.academicYear, e.subjects.join("; ")]);
    const csv = [header, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `exams-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Exams &amp; Results</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Manage examinations and publish student results</p>
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          {academicYears.length > 0 && (
            <div className="relative">
              <select value={yearFilter} onChange={(e) => { setYearFilter(e.target.value); setStatusFilter("all"); }} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                {academicYears.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            </div>
          )}
          <SchoolFilterSelect schools={schools} value={schoolFilter} onChange={setSchoolFilter} />
          <Link href="/dashboard/exams/preferences" className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><ListChecks className="h-3.5 w-3.5" /> Exam Preference</Link>
          <button onClick={exportCsv} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><Download className="h-3.5 w-3.5" /> Export</button>
          <FancyButton size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> New Exam</FancyButton>
        </div>
      </div>

      <ExamStatsRow exams={yearExams} />

      <div className="flex items-center gap-1.5 flex-wrap">
        {STATUS_FILTER_OPTIONS.map((f) => {
          const count = f.value === "all" ? yearExams.length : yearExams.filter((e) => e.status === f.value).length;
          return (
            <button key={f.value} onClick={() => setStatusFilter(f.value)} className={`flex items-center gap-1.5 h-8 rounded-lg px-3 text-xs font-medium transition-colors ${statusFilter === f.value ? "bg-primary-500 text-white shadow-sm" : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}>
              {f.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${statusFilter === f.value ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-zinc-400"}`}>{count}</span>
            </button>
          );
        })}
      </div>
      {filteredExams.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 py-20">
          <ClipboardCheck className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
          <p className="text-sm text-gray-500 dark:text-zinc-400">No exams match this filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExams.map((exam) => <ExamCard key={exam.id} exam={exam} />)}
        </div>
      )}

      {addOpen && (
        <AddExamModal
          onClose={() => setAddOpen(false)}
          onCreated={(examId) => router.push(`/dashboard/exams/${examId}`)}
          schools={schools}
        />
      )}
    </div>
  );
}
