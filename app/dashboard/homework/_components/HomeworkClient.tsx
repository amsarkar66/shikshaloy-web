"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ClipboardList, CheckCircle2, Clock, AlertTriangle,
  Search, Plus, ChevronLeft, ChevronRight, ChevronDown, X,
  ArrowUpDown, ArrowUp, ArrowDown, BookOpen,
} from "lucide-react";
import {
  submissionRate, isOverdue, formatDate,
  type Homework, type HomeworkStatus,
} from "../_data/homework";
import { assignHomework } from "../actions";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr } from "@/components/ui/data-table";

type SortField = "title" | "dueDate" | "submission";
type SortDir = "asc" | "desc";
const PAGE_SIZE = 8;

interface Subject { id: string; name: string }
interface Section { id: string; label: string }
interface Teacher { id: string; name: string; designation: string }

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

function StatsRow({ items }: { items: Homework[] }) {
  const active = items.filter((h) => h.status === "active").length;
  const overdue = items.filter(isOverdue).length;
  const avgRate = items.length === 0 ? 0 : Math.round(items.reduce((s, h) => s + submissionRate(h), 0) / items.length);

  const stats = [
    { label: "Total Assignments", value: String(items.length), icon: ClipboardList, accent: "text-indigo-500  bg-indigo-500/10" },
    { label: "Active",            value: String(active),       icon: Clock,         accent: "text-blue-500    bg-blue-500/10" },
    { label: "Overdue",           value: String(overdue),      icon: AlertTriangle, accent: "text-red-500     bg-red-500/10" },
    { label: "Avg. Submission",   value: `${avgRate}%`,        icon: CheckCircle2,  accent: "text-emerald-500 bg-emerald-500/10" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
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

function NewAssignmentModal({
  open, onClose, subjects, sections, teachers,
}: {
  open: boolean;
  onClose: () => void;
  subjects: Subject[];
  sections: Section[];
  teachers: Teacher[];
}) {
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? "");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !dueDate || !subjectId || !sectionId || !teacherId) return;
    startTransition(async () => {
      await assignHomework({ title, subjectId, sectionId, teacherId, dueDate, description });
      setTitle(""); setDueDate(""); setDescription("");
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">New Assignment</p>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Title</label>
            <input
              value={title} onChange={(e) => setTitle(e.target.value)} required
              placeholder="e.g. Algebra worksheet — Chapter 4"
              className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Subject</label>
              <div className="relative">
                <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Class</label>
              <div className="relative">
                <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                  {sections.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Teacher</label>
            <div className="relative">
              <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.designation})</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Due date</label>
            <input
              type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required
              className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Instructions</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="What should students do?"
              className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
            Cancel
          </button>
          <FancyButton type="submit" disabled={isPending} size="sm">
            <Plus className="h-4 w-4" /> {isPending ? "Assigning…" : "Assign"}
          </FancyButton>
        </div>
      </form>
    </div>
  );
}

export default function HomeworkClient({
  homework, subjects, sections, teachers,
}: {
  homework: Homework[];
  subjects: Subject[];
  sections: Section[];
  teachers: Teacher[];
}) {
  const [query, setQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | HomeworkStatus>("all");
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const subjectNames = useMemo(() => Array.from(new Set(homework.map((h) => h.subject))).sort(), [homework]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return homework.filter((h) => {
      const matchQ = !q || h.title.toLowerCase().includes(q) || h.teacher.toLowerCase().includes(q);
      const matchSubject = subjectFilter === "all" || h.subject === subjectFilter;
      const matchStatus = statusFilter === "all" || h.status === statusFilter;
      return matchQ && matchSubject && matchStatus;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === "title") cmp = a.title.localeCompare(b.title);
      if (sortField === "dueDate") cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      if (sortField === "submission") cmp = submissionRate(a) - submissionRate(b);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [homework, query, subjectFilter, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilter = query || subjectFilter !== "all" || statusFilter !== "all";

  function clearFilters() { setQuery(""); setSubjectFilter("all"); setStatusFilter("all"); setPage(1); }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Homework</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Assignments and submissions</p>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <FancyButton onClick={() => setModalOpen(true)} size="sm">
            <Plus className="h-4 w-4" /> New Assignment
          </FancyButton>
        </div>
      </div>

      <StatsRow items={homework} />

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by title or teacher…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div className="relative">
          <select
            value={subjectFilter}
            onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}
            className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
          >
          <option value="all">All Subjects</option>
          {subjectNames.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        <div className="relative">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as "all" | HomeworkStatus); setPage(1); }}
          className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        {hasFilter && (
          <button onClick={clearFilters} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {hasFilter && (
        <div className="flex items-center justify-end">
          <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">Filters active</span>
        </div>
      )}

      <Table
        footer={totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
              <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> assignments
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                    page === n ? "bg-primary-500 text-white" : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      >
        <TableHead>
          <Th position="first">
            <button onClick={() => toggleSort("title")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
              Assignment <SortIcon active={sortField === "title"} dir={sortDir} />
            </button>
          </Th>
          <Th>Class</Th>
          <Th>
            <button onClick={() => toggleSort("dueDate")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
              Due Date <SortIcon active={sortField === "dueDate"} dir={sortDir} />
            </button>
          </Th>
          <Th>
            <button onClick={() => toggleSort("submission")} className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
              Submissions <SortIcon active={sortField === "submission"} dir={sortDir} />
            </button>
          </Th>
          <Th>Status</Th>
        </TableHead>
        <TableBody>
          {pageData.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-20 text-center">
                <div className="flex flex-col items-center gap-2">
                  <BookOpen className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
                  <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No assignments found</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">Try adjusting your search or filters</p>
                </div>
              </td>
            </tr>
          ) : (
            pageData.map((hw) => {
              const rate = submissionRate(hw);
              const overdue = isOverdue(hw);
              return (
                <Tr key={hw.id}>
                  <Td position="first">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate max-w-[260px]">{hw.title}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500 truncate max-w-[260px]">{hw.subject} · {hw.teacher}</p>
                    </div>
                  </Td>
                  <Td>
                    <span className="text-sm text-gray-700 dark:text-zinc-300">Class {hw.sectionLabel}</span>
                  </Td>
                  <Td>
                    <span className={`text-sm tabular-nums ${overdue ? "text-red-600 dark:text-red-400 font-semibold" : "text-gray-700 dark:text-zinc-300"}`}>
                      {formatDate(hw.dueDate)}
                    </span>
                    {overdue && <span className="ml-1.5 text-[10px] font-semibold uppercase text-red-500">overdue</span>}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
                        <div
                          className={`h-1.5 rounded-full transition-all ${rate >= 80 ? "bg-emerald-500" : rate >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${rate}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-gray-600 dark:text-zinc-400">
                        {hw.submitted}/{hw.totalStudents}
                      </span>
                    </div>
                  </Td>
                  <Td>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                      hw.status === "closed"
                        ? "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20"
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                    }`}>
                      {hw.status === "closed" ? "Closed" : "Active"}
                    </span>
                  </Td>
                </Tr>
              );
            })
          )}
        </TableBody>
      </Table>

      <NewAssignmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        subjects={subjects}
        sections={sections}
        teachers={teachers}
      />
    </div>
  );
}
