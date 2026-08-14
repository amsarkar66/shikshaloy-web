"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Pencil, Plus, Trash2, Users, BookOpen,
  CalendarClock, Layers, GraduationCap, Loader2,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { avatarColor, initials } from "../../_data/subjects";
import { EditSubjectModal } from "../../_components/EditSubjectModal";
import { AssignmentModal } from "./AssignmentModal";
import { removeSubjectAssignment } from "../../actions";

export interface SubjectDetail {
  id:            string;
  name:          string;
  code:          string;
  type:          "core" | "elective";
  status:        "active" | "inactive";
  weeklyPeriods: number;
}

export interface SubjectAssignment {
  id:             string;
  sectionId:      string;
  classNum:       string;
  sectionName:    string;
  teacherId:      string | null;
  teacherName:    string;
  weeklyPeriods:  number | null;
}

export interface SectionOption {
  id:       string;
  classNum: string;
  name:     string;
}

export interface TeacherOption {
  id:   string;
  name: string;
}

const TYPE_BADGE: Record<string, string> = {
  core:     "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
  elective: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20",
};
const STATUS_BADGE: Record<string, string> = {
  active:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  inactive: "bg-zinc-100       text-zinc-500    dark:bg-zinc-800      dark:text-zinc-400    border-zinc-200 dark:border-zinc-700",
};

const ACCENTS = [
  { text: "text-indigo-500",  bg: "bg-indigo-500/10"  },
  { text: "text-emerald-500", bg: "bg-emerald-500/10" },
  { text: "text-violet-500",  bg: "bg-violet-500/10"  },
  { text: "text-amber-500",   bg: "bg-amber-500/10"   },
];

function nameInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  return parts.slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

export default function SubjectDetailClient({
  subject, assignments, sections, teachers,
}: {
  subject:     SubjectDetail;
  assignments: SubjectAssignment[];
  sections:    SectionOption[];
  teachers:    TeacherOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<SubjectAssignment | null>(null);

  const teachersAssigned = useMemo(
    () => new Set(assignments.filter((a) => a.teacherId).map((a) => a.teacherId)).size,
    [assignments],
  );

  const availableSections = useMemo(() => {
    const taken = new Set(assignments.map((a) => a.sectionId));
    return sections.filter((s) => !taken.has(s.id));
  }, [assignments, sections]);

  function remove(assignmentId: string) {
    setRemovingId(assignmentId);
    startTransition(async () => {
      try {
        await removeSubjectAssignment(assignmentId, subject.id);
        router.refresh();
      } finally {
        setRemovingId(null);
      }
    });
  }

  const stats = [
    { label: "Classes Assigned",  value: assignments.length,   icon: Layers,        accent: ACCENTS[0] },
    { label: "Teachers Assigned", value: teachersAssigned,     icon: GraduationCap, accent: ACCENTS[1] },
    { label: "Periods / Week",    value: subject.weeklyPeriods, icon: CalendarClock, accent: ACCENTS[2] },
    { label: "Subject Type",      value: subject.type === "core" ? "Core" : "Elective", icon: BookOpen, accent: ACCENTS[3] },
  ];

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <Link
        href="/dashboard/subjects"
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Subjects
      </Link>

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-6">
        <div className={`absolute inset-x-0 top-0 h-1 ${avatarColor(subject.id)}`} />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm ${avatarColor(subject.id)}`}>
              {initials(subject.name)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">{subject.name}</h1>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${TYPE_BADGE[subject.type]}`}>{subject.type}</span>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_BADGE[subject.status]}`}>{subject.status}</span>
              </div>
              <p className="mt-0.5 text-xs font-mono text-gray-400 dark:text-zinc-500">{subject.code}</p>
            </div>
          </div>
          <button
            onClick={() => setEditingSubject(true)}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit Subject
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent.bg}`}><s.icon className={`h-5 w-5 ${s.accent.text}`}/></div>
            <div><p className="text-xl font-bold text-gray-900 dark:text-zinc-50 leading-tight">{s.value}</p><p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Classes & Teachers */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-700/50 px-5 py-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Classes & Teachers</p>
          <FancyButton onClick={() => setShowAssign(true)} disabled={availableSections.length === 0} size="xs">
            <Plus className="h-3.5 w-3.5" /> Assign to Class
          </FancyButton>
        </div>

        {assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <Users className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
            <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Not assigned to any class yet</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Assign this subject to a class to schedule teachers and periods</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                  <th className="py-3 pl-4 pr-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Class</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Teacher</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Periods/wk</th>
                  <th className="py-3 pl-3 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                    <td className="py-3 pl-4 pr-3">
                      <Link href={`/dashboard/classes/${a.sectionId}`} className="font-medium text-gray-900 dark:text-zinc-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                        Class {a.classNum}–{a.sectionName}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      {a.teacherName ? (
                        <div className="flex items-center gap-2">
                          <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ${avatarColor(a.teacherId ?? a.id)}`}>{nameInitials(a.teacherName)}</div>
                          <span className="text-sm text-gray-700 dark:text-zinc-300">{a.teacherName}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-zinc-500">Not assigned</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:text-zinc-300">
                        {a.weeklyPeriods ?? subject.weeklyPeriods}
                      </span>
                    </td>
                    <td className="py-3 pl-3 pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditingAssignment(a)} title="Edit assignment" className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => remove(a.id)}
                          disabled={isPending && removingId === a.id}
                          title="Remove assignment"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50 transition-colors"
                        >
                          {isPending && removingId === a.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingSubject && (
        <EditSubjectModal
          subject={subject}
          onClose={() => setEditingSubject(false)}
          onSaved={() => router.refresh()}
        />
      )}

      {showAssign && (
        <AssignmentModal
          subjectId={subject.id}
          defaultWeeklyPeriods={subject.weeklyPeriods}
          teachers={teachers}
          availableSections={availableSections}
          onClose={() => setShowAssign(false)}
          onSaved={() => router.refresh()}
        />
      )}

      {editingAssignment && (
        <AssignmentModal
          subjectId={subject.id}
          defaultWeeklyPeriods={subject.weeklyPeriods}
          teachers={teachers}
          assignment={editingAssignment}
          onClose={() => setEditingAssignment(null)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  );
}
