"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, ChevronDown, Loader2, Pencil, Trash2, Sparkles, CheckCircle2,
} from "lucide-react";
import { formatCurrency, formatMonth, type FeeStructure, type GradeOption } from "../_data/fees";
import { createFeeStructure, updateFeeStructure, deleteFeeStructure, generateMonthlyFees } from "../actions";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";
import { MonthPicker } from "@/components/ui/date-picker";

// ── Fee structure management ──────────────────────────────────────────────────

const FREQUENCIES: FeeStructure["frequency"][] = ["monthly", "quarterly", "annual"];

interface StructureFormState {
  category: string;
  amount: string;
  gradeId: string; // "" = all grades
  frequency: FeeStructure["frequency"];
  isOptional: boolean;
  isOneTime: boolean;
}

const EMPTY_STRUCTURE_FORM: StructureFormState = {
  category: "", amount: "", gradeId: "", frequency: "monthly", isOptional: false, isOneTime: false,
};

function StructureRowForm({
  initial, grades, busy, onSave, onCancel,
}: {
  initial: StructureFormState;
  grades: GradeOption[];
  busy: boolean;
  onSave: (form: StructureFormState) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<StructureFormState>(initial);

  return (
    <Tr className="bg-primary-50/40 dark:bg-primary-500/5">
      <Td position="first">
        <input
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          placeholder="e.g. Tuition Fee"
          className="h-8 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
        />
      </Td>
      <Td>
        <div className="relative">
          <select
            value={form.gradeId}
            onChange={(e) => setForm((f) => ({ ...f, gradeId: e.target.value }))}
            className="h-8 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2.5 pr-7 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="">All Grades</option>
            {grades.map((g) => <option key={g.id} value={g.id}>Class {g.level}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        </div>
      </Td>
      <Td>
        <input
          type="number"
          value={form.amount}
          onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
          placeholder="0"
          className="h-8 w-24 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
        />
      </Td>
      <Td>
        <div className="space-y-1.5">
          {form.isOneTime ? (
            <p className="h-8 flex items-center text-xs italic text-gray-500 dark:text-zinc-400">Once, at admission</p>
          ) : (
            <div className="relative">
              <select
                value={form.frequency}
                onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value as FeeStructure["frequency"] }))}
                className="h-8 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2.5 pr-7 text-sm capitalize text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
              >
                {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            </div>
          )}
          <label className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isOneTime}
              onChange={(e) => setForm((f) => ({ ...f, isOneTime: e.target.checked }))}
              className="h-3 w-3 rounded border-gray-300 dark:border-zinc-600 accent-primary-500 cursor-pointer"
            />
            One-time
          </label>
        </div>
      </Td>
      <Td className="text-center">
        <input
          type="checkbox"
          checked={form.isOptional}
          onChange={(e) => setForm((f) => ({ ...f, isOptional: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 dark:border-zinc-600 accent-primary-500 cursor-pointer"
        />
      </Td>
      <Td position="last" align="right" className="whitespace-nowrap">
        <FancyButton
          onClick={() => onSave(form)}
          disabled={busy || !form.category.trim() || !form.amount}
          size="xs"
          className="mr-1.5"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
        </FancyButton>
        <button onClick={onCancel} className="inline-flex h-7 items-center rounded-lg px-2 text-xs font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 transition-colors">
          Cancel
        </button>
      </Td>
    </Tr>
  );
}

export default function FeeStructureClient({
  structures, grades, backHref,
}: {
  structures: FeeStructure[];
  grades: GradeOption[];
  backHref: string;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<FeeStructure[]>(structures);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [genBusy, setGenBusy] = useState(false);
  const [genResult, setGenResult] = useState<string | null>(null);
  const [genError, setGenError] = useState("");

  function gradeLevelFor(gradeId: string): number | null {
    return gradeId ? grades.find((g) => g.id === gradeId)?.level ?? null : null;
  }

  async function handleCreate(form: StructureFormState) {
    setBusyId("new");
    setError("");
    try {
      const { id } = await createFeeStructure({
        category: form.category.trim(),
        amount: Number(form.amount),
        gradeId: form.gradeId || null,
        frequency: form.frequency,
        isOptional: form.isOptional,
        isOneTime: form.isOneTime,
      });
      setRows((prev) => [
        ...prev,
        { id, category: form.category.trim(), amount: Number(form.amount), gradeId: form.gradeId || null, gradeLevel: gradeLevelFor(form.gradeId), frequency: form.frequency, isOptional: form.isOptional, isOneTime: form.isOneTime },
      ]);
      setAdding(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add fee category");
    } finally {
      setBusyId(null);
    }
  }

  async function handleUpdate(id: string, form: StructureFormState) {
    setBusyId(id);
    setError("");
    try {
      await updateFeeStructure(id, {
        category: form.category.trim(),
        amount: Number(form.amount),
        gradeId: form.gradeId || null,
        frequency: form.frequency,
        isOptional: form.isOptional,
        isOneTime: form.isOneTime,
      });
      setRows((prev) => prev.map((r) => (r.id === id
        ? { ...r, category: form.category.trim(), amount: Number(form.amount), gradeId: form.gradeId || null, gradeLevel: gradeLevelFor(form.gradeId), frequency: form.frequency, isOptional: form.isOptional, isOneTime: form.isOneTime }
        : r)));
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update fee category");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    setError("");
    try {
      await deleteFeeStructure(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete fee category");
    } finally {
      setBusyId(null);
    }
  }

  async function handleGenerate() {
    setGenBusy(true);
    setGenError("");
    setGenResult(null);
    try {
      const { created } = await generateMonthlyFees(month);
      setGenResult(
        created > 0
          ? `Generated ${created} fee record${created === 1 ? "" : "s"} for ${formatMonth(month)}.`
          : `All students already have fee records for ${formatMonth(month)}.`
      );
      router.refresh();
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Failed to generate fees");
    } finally {
      setGenBusy(false);
    }
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <Link
        href={backHref}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors w-fit"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Fees
      </Link>

      <Table
        header={
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-700/50">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Fee Structure</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">What&rsquo;s charged, per category, per grade.</p>
              </div>
              {!adding && (
                <FancyButton
                  onClick={() => setAdding(true)}
                  size="xs"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Category
                </FancyButton>
              )}
            </div>
            {error && <p className="px-4 pt-3 text-xs text-red-500">{error}</p>}
          </>
        }
      >
        <TableHead>
          <Th position="first">Category</Th>
          <Th>Grade</Th>
          <Th>Amount</Th>
          <Th>Frequency</Th>
          <Th>Optional</Th>
          <Th position="last" align="right"></Th>
        </TableHead>
        <TableBody>
          {rows.length === 0 && !adding && (
            <TableEmptyRow colSpan={6} message="No fee categories configured yet. Add one to start generating monthly fees." />
          )}
          {rows.map((r) => editingId === r.id ? (
            <StructureRowForm
              key={r.id}
              initial={{ category: r.category, amount: String(r.amount), gradeId: r.gradeId ?? "", frequency: r.frequency, isOptional: r.isOptional, isOneTime: r.isOneTime }}
              grades={grades}
              busy={busyId === r.id}
              onSave={(form) => handleUpdate(r.id, form)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <Tr key={r.id}>
              <Td position="first" className="text-sm font-medium text-gray-800 dark:text-zinc-200">{r.category}</Td>
              <Td className="text-sm text-gray-600 dark:text-zinc-400">{r.gradeLevel ? `Class ${r.gradeLevel}` : "All Grades"}</Td>
              <Td className="text-sm font-semibold tabular-nums text-gray-900 dark:text-zinc-100">{formatCurrency(r.amount)}</Td>
              <Td className="text-sm capitalize text-gray-600 dark:text-zinc-400">
                {r.isOneTime
                  ? <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium normal-case text-amber-600 dark:text-amber-400">One-time</span>
                  : r.frequency}
              </Td>
              <Td className="text-sm text-gray-500 dark:text-zinc-500">{r.isOptional ? "Optional" : "Required"}</Td>
              <Td position="last" align="right" className="whitespace-nowrap">
                <button onClick={() => setEditingId(r.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mr-1">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={busyId === r.id}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 transition-colors"
                >
                  {busyId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </Td>
            </Tr>
          ))}
          {adding && (
            <StructureRowForm
              initial={EMPTY_STRUCTURE_FORM}
              grades={grades}
              busy={busyId === "new"}
              onSave={handleCreate}
              onCancel={() => setAdding(false)}
            />
          )}
        </TableBody>
      </Table>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-primary-500" />
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Generate Monthly Fees</p>
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mb-4">
          Creates fee records for every active student for the selected month. Monthly categories bill every month, quarterly every 3rd month, and annual only once — all relative to the academic year&rsquo;s start month. Students who already have a record for a category are skipped. One-time categories (e.g. Admission Fee) are never included here — they bill automatically when a student enrolls.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1">Month</label>
            <MonthPicker value={month} onChange={setMonth} className="w-auto" />
          </div>
          <button
            onClick={handleGenerate}
            disabled={genBusy || rows.length === 0}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 px-4 text-sm font-medium text-white transition-colors"
          >
            {genBusy ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</> : "Generate Fees"}
          </button>
        </div>
        {genResult && <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {genResult}</p>}
        {genError && <p className="mt-3 text-xs text-red-500">{genError}</p>}
      </div>
    </div>
  );
}
