"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, GraduationCap, Loader2, CheckCircle2 } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, Th, TableBody, Tr, Td } from "@/components/ui/data-table";
import { promoteStudents, type PromotionDecision } from "../../actions";

export interface PromoteStudent {
  id: string;
  name: string;
  rollNo: string;
  sectionId: string;
  sectionName: string;
  gradeLevel: number;
}

export interface PromoteSection {
  id: string;
  name: string;
  gradeLevel: number;
  enrolled: number;
}

export interface PromoteYear {
  id: string;
  name: string;
  sections: PromoteSection[];
}

type RowAction = "promote" | "retain" | "graduate" | "skip";
interface RowState {
  action: RowAction;
  targetSectionId: string;
}

const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-xs text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

function autoPickSection(currentSectionName: string, candidates: PromoteSection[]): string {
  if (candidates.length === 0) return "";
  const nameMatch = candidates.find((c) => c.name.toLowerCase() === currentSectionName.toLowerCase());
  if (nameMatch) return nameMatch.id;
  return [...candidates].sort((a, b) => a.enrolled - b.enrolled)[0].id;
}

export default function PromoteStudentsClient({
  maxGradeLevel, students, years,
}: {
  maxGradeLevel: number;
  students: PromoteStudent[];
  years: PromoteYear[];
}) {
  const router = useRouter();
  const gradeLevels = useMemo(
    () => Array.from(new Set(students.map((s) => s.gradeLevel))).sort((a, b) => a - b),
    [students]
  );

  const [gradeLevel, setGradeLevel] = useState(gradeLevels[0] ?? 1);
  const [targetYearId, setTargetYearId] = useState(years[0]?.id ?? "");
  const [rows, setRows] = useState<Record<string, RowState>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ promoted: number; graduated: number } | null>(null);

  const targetYear = years.find((y) => y.id === targetYearId) ?? years[0];
  const isMaxGrade = gradeLevel === maxGradeLevel;
  const studentsInGrade = useMemo(
    () => students.filter((s) => s.gradeLevel === gradeLevel).sort((a, b) => a.sectionName.localeCompare(b.sectionName) || a.name.localeCompare(b.name)),
    [students, gradeLevel]
  );

  const promoteSections = targetYear?.sections.filter((s) => s.gradeLevel === gradeLevel + 1) ?? [];
  const retainSections = targetYear?.sections.filter((s) => s.gradeLevel === gradeLevel) ?? [];

  useEffect(() => {
    const next: Record<string, RowState> = {};
    for (const s of studentsInGrade) {
      if (isMaxGrade) {
        next[s.id] = { action: "graduate", targetSectionId: "" };
      } else {
        next[s.id] = { action: "promote", targetSectionId: autoPickSection(s.sectionName, promoteSections) };
      }
    }
    setRows(next);
    setResult(null);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeLevel, targetYearId]);

  function setRowAction(studentId: string, action: RowAction) {
    setRows((prev) => {
      const student = studentsInGrade.find((s) => s.id === studentId);
      const targetSectionId =
        action === "promote" ? autoPickSection(student?.sectionName ?? "", promoteSections)
        : action === "retain" ? autoPickSection(student?.sectionName ?? "", retainSections)
        : "";
      return { ...prev, [studentId]: { action, targetSectionId } };
    });
  }

  function setRowSection(studentId: string, targetSectionId: string) {
    setRows((prev) => ({ ...prev, [studentId]: { ...prev[studentId], targetSectionId } }));
  }

  const counts = useMemo(() => {
    const c = { promote: 0, retain: 0, graduate: 0, skip: 0 };
    for (const r of Object.values(rows)) c[r.action] += 1;
    return c;
  }, [rows]);

  const hasUnresolvedSection = Object.values(rows).some(
    (r) => (r.action === "promote" || r.action === "retain") && !r.targetSectionId
  );

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      const decisions: PromotionDecision[] = studentsInGrade.map((s) => ({
        studentId: s.id,
        action: rows[s.id]?.action ?? "skip",
        targetSectionId: rows[s.id]?.targetSectionId || undefined,
      }));
      const outcome = await promoteStudents(targetYearId, decisions);
      setResult(outcome);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to promote students");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div>
        <Link href="/dashboard/students" className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Students
        </Link>
        <h1 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-zinc-50">
          <GraduationCap className="h-5 w-5 text-primary-500" /> Promote Students
        </h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
          Move students into the next grade &amp; academic year, retain them for a repeat year, or graduate them out.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Grade</label>
          <div className="relative">
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(Number(e.target.value))}
              className="h-9 w-40 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            >
              {gradeLevels.map((g) => <option key={g} value={g}>Grade {g}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Target Academic Year</label>
          <div className="relative">
            <select
              value={targetYearId}
              onChange={(e) => setTargetYearId(e.target.value)}
              className="h-9 w-48 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            >
              {years.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
          </div>
        </div>
      </div>

      {result && (
        <div className="flex items-start gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 px-4 py-2.5 text-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
          <p className="text-gray-700 dark:text-zinc-300">
            {result.promoted > 0 && `Moved ${result.promoted} student${result.promoted === 1 ? "" : "s"} into ${targetYear?.name}. `}
            {result.graduated > 0 && `Graduated ${result.graduated} student${result.graduated === 1 ? "" : "s"}.`}
          </p>
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}

      {studentsInGrade.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <GraduationCap className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
          <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No active students in Grade {gradeLevel}</p>
        </div>
      ) : (
        <Table
          footer={
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                {counts.promote > 0 && `${counts.promote} promoting`}
                {counts.promote > 0 && (counts.retain > 0 || counts.graduate > 0 || counts.skip > 0) && ", "}
                {counts.retain > 0 && `${counts.retain} retained`}
                {counts.retain > 0 && (counts.graduate > 0 || counts.skip > 0) && ", "}
                {counts.graduate > 0 && `${counts.graduate} graduating`}
                {counts.graduate > 0 && counts.skip > 0 && ", "}
                {counts.skip > 0 && `${counts.skip} left as-is`}
              </p>
              <FancyButton
                disabled={busy || hasUnresolvedSection || (counts.promote + counts.retain + counts.graduate === 0)}
                onClick={handleSubmit}
                size="sm"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                Apply to {counts.promote + counts.retain + counts.graduate} student{counts.promote + counts.retain + counts.graduate === 1 ? "" : "s"}
              </FancyButton>
            </div>
          }
        >
          <TableHead>
            <Th position="first">Student</Th>
            <Th>Current Section</Th>
            <Th>Action</Th>
            <Th position="last">Target Section</Th>
          </TableHead>
          <TableBody>
            {studentsInGrade.map((s) => {
              const row = rows[s.id] ?? { action: "skip" as RowAction, targetSectionId: "" };
              const sectionOptions = row.action === "promote" ? promoteSections : row.action === "retain" ? retainSections : [];
              return (
                <Tr key={s.id}>
                  <Td position="first">
                    <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight">{s.name}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{s.rollNo}</p>
                  </Td>
                  <Td className="text-sm text-gray-600 dark:text-zinc-400">
                    Grade {gradeLevel}-{s.sectionName}
                  </Td>
                  <Td>
                    <div className="relative w-44">
                      <select
                        value={row.action}
                        onChange={(e) => setRowAction(s.id, e.target.value as RowAction)}
                        className={selectClass}
                      >
                        {!isMaxGrade && <option value="promote">Promote → Grade {gradeLevel + 1}</option>}
                        {!isMaxGrade && <option value="retain">Retain in Grade {gradeLevel}</option>}
                        {isMaxGrade && <option value="graduate">Graduate</option>}
                        <option value="skip">Leave as-is</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                    </div>
                  </Td>
                  <Td position="last">
                    {row.action === "promote" || row.action === "retain" ? (
                      sectionOptions.length === 0 ? (
                        <span className="text-xs text-red-500">No Grade {row.action === "promote" ? gradeLevel + 1 : gradeLevel} section in {targetYear?.name}</span>
                      ) : (
                        <div className="relative w-32">
                          <select
                            value={row.targetSectionId}
                            onChange={(e) => setRowSection(s.id, e.target.value)}
                            className={selectClass}
                          >
                            {sectionOptions.map((sec) => (
                              <option key={sec.id} value={sec.id}>Section {sec.name} ({sec.enrolled})</option>
                            ))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                        </div>
                      )
                    ) : row.action === "graduate" ? (
                      <span className="text-xs text-gray-400 dark:text-zinc-500">Leaves final-year record in place</span>
                    ) : (
                      <span className="text-xs text-amber-600 dark:text-amber-400">Needs manual follow-up after year switch</span>
                    )}
                  </Td>
                </Tr>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
