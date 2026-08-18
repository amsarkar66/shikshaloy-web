"use server";

import { supabaseAdmin } from "@/lib/supabase/service";
import {
  BUILDER_ENTITIES, AGGREGATE_LABEL,
  type EntityKey, type CustomReportDefinition, type FieldType, type FilterOperator,
} from "./_data/report-builder-fields";
import type { ReportTable } from "./report-data";

function inRange(dateStr: string | null | undefined, from: string, to: string) {
  return !!dateStr && dateStr >= from && dateStr <= to;
}

function classLabel(level: number | null | undefined, section: string | null | undefined) {
  return level ? `${level}-${section ?? ""}` : (section ?? "—");
}

type Resolver = (row: Record<string, unknown>) => string | number | boolean | null;

interface EntityExecutor {
  fetchRows(schoolId: string): Promise<Record<string, unknown>[]>;
  resolvers: Record<string, Resolver>;
}

const ENTITY_EXECUTORS: Record<EntityKey, EntityExecutor> = {
  students: {
    async fetchRows(schoolId) {
      const { data } = await supabaseAdmin
        .from("students")
        .select("full_name, roll_no, admission_no, gender, dob, status, fee_status, attendance_pct, blood_group, phone, joined_date, sections ( name, grades ( level ) )")
        .eq("school_id", schoolId);
      return (data ?? []) as unknown as Record<string, unknown>[];
    },
    resolvers: {
      full_name: (r) => r.full_name as string,
      roll_no: (r) => r.roll_no as string,
      admission_no: (r) => r.admission_no as string,
      class: (r) => {
        const s = r.sections as { name: string | null; grades: { level: number | null } | null } | null;
        return classLabel(s?.grades?.level, s?.name);
      },
      gender: (r) => r.gender as string,
      dob: (r) => r.dob as string,
      status: (r) => r.status as string,
      fee_status: (r) => r.fee_status as string,
      attendance_pct: (r) => Number(r.attendance_pct ?? 0),
      blood_group: (r) => r.blood_group as string,
      phone: (r) => r.phone as string,
      joined_date: (r) => r.joined_date as string,
    },
  },

  staff: {
    async fetchRows(schoolId) {
      const { data } = await supabaseAdmin
        .from("staff_members")
        .select("full_name, employee_id, type, designation, department, status, phone, email, joined_date")
        .eq("school_id", schoolId);
      return (data ?? []) as unknown as Record<string, unknown>[];
    },
    resolvers: {
      full_name: (r) => r.full_name as string,
      employee_id: (r) => r.employee_id as string,
      type: (r) => r.type as string,
      designation: (r) => r.designation as string,
      department: (r) => r.department as string,
      status: (r) => r.status as string,
      phone: (r) => r.phone as string,
      email: (r) => r.email as string,
      joined_date: (r) => r.joined_date as string,
    },
  },

  fee_payments: {
    async fetchRows(schoolId) {
      const { data } = await supabaseAdmin
        .from("fee_payments")
        .select("month_str, category, amount_due, amount_paid, status, payment_mode, created_at, students ( full_name, sections ( name, grades ( level ) ) )")
        .eq("school_id", schoolId);
      return (data ?? []) as unknown as Record<string, unknown>[];
    },
    resolvers: {
      student_name: (r) => (r.students as { full_name: string | null } | null)?.full_name ?? "—",
      class: (r) => {
        const s = (r.students as { sections?: { name: string | null; grades: { level: number | null } | null } | null } | null)?.sections;
        return classLabel(s?.grades?.level, s?.name);
      },
      month_str: (r) => r.month_str as string,
      category: (r) => r.category as string,
      amount_due: (r) => Number(r.amount_due ?? 0),
      amount_paid: (r) => Number(r.amount_paid ?? 0),
      status: (r) => r.status as string,
      payment_mode: (r) => r.payment_mode as string,
      created_at: (r) => r.created_at as string,
    },
  },

  exam_results: {
    async fetchRows(schoolId) {
      const { data } = await supabaseAdmin
        .from("exam_results")
        .select("marks_obtained, max_marks, grade, is_absent, subjects ( name ), exams ( name, start_date ), students ( full_name, sections ( name, grades ( level ) ) )")
        .eq("school_id", schoolId);
      return (data ?? []) as unknown as Record<string, unknown>[];
    },
    resolvers: {
      student_name: (r) => (r.students as { full_name: string | null } | null)?.full_name ?? "—",
      class: (r) => {
        const s = (r.students as { sections?: { name: string | null; grades: { level: number | null } | null } | null } | null)?.sections;
        return classLabel(s?.grades?.level, s?.name);
      },
      exam_name: (r) => (r.exams as { name: string | null } | null)?.name ?? "—",
      exam_date: (r) => (r.exams as { start_date: string | null } | null)?.start_date ?? null,
      subject: (r) => (r.subjects as { name: string | null } | null)?.name ?? "—",
      marks_obtained: (r) => Number(r.marks_obtained ?? 0),
      max_marks: (r) => Number(r.max_marks ?? 0),
      grade: (r) => (r.grade as string) ?? "—",
      is_absent: (r) => !!r.is_absent,
    },
  },

  attendance: {
    async fetchRows(schoolId) {
      const { data } = await supabaseAdmin
        .from("student_attendance")
        .select("date, status, students ( full_name ), sections ( name, grades ( level ) )")
        .eq("school_id", schoolId);
      return (data ?? []) as unknown as Record<string, unknown>[];
    },
    resolvers: {
      student_name: (r) => (r.students as { full_name: string | null } | null)?.full_name ?? "—",
      class: (r) => {
        const s = r.sections as { name: string | null; grades: { level: number | null } | null } | null;
        return classLabel(s?.grades?.level, s?.name);
      },
      status: (r) => r.status as string,
      date: (r) => r.date as string,
    },
  },

  leaves: {
    async fetchRows(schoolId) {
      const { data } = await supabaseAdmin
        .from("leave_requests")
        .select("leave_type, from_date, to_date, days, status, applied_on, staff_members!leave_requests_staff_id_fkey ( full_name )")
        .eq("school_id", schoolId);
      return (data ?? []) as unknown as Record<string, unknown>[];
    },
    resolvers: {
      staff_name: (r) => (r.staff_members as { full_name: string | null } | null)?.full_name ?? "—",
      leave_type: (r) => r.leave_type as string,
      status: (r) => r.status as string,
      from_date: (r) => r.from_date as string,
      to_date: (r) => r.to_date as string,
      days: (r) => Number(r.days ?? 0),
      applied_on: (r) => r.applied_on as string,
    },
  },
};

function matchFilter(value: string | number | boolean | null, operator: FilterOperator, filterValue: string, type: FieldType): boolean {
  if (value === null || value === undefined || filterValue === "") return true;
  switch (type) {
    case "number": {
      const n = Number(value);
      const fv = Number(filterValue);
      if (operator === "gt") return n > fv;
      if (operator === "lt") return n < fv;
      return n === fv;
    }
    case "date": {
      const v = String(value);
      if (operator === "before") return v < filterValue;
      if (operator === "after") return v > filterValue;
      return v === filterValue;
    }
    case "boolean":
      return Boolean(value) === (filterValue === "true");
    default: {
      const v = String(value).toLowerCase();
      const fv = filterValue.toLowerCase();
      return operator === "contains" ? v.includes(fv) : v === fv;
    }
  }
}

export async function runCustomReportQuery(
  def: CustomReportDefinition,
  dateFrom: string,
  dateTo: string,
  schoolId: string
): Promise<ReportTable> {
  const entity = BUILDER_ENTITIES[def.entity];
  if (!entity) throw new Error("Unknown report data source");

  const validFieldKeys = new Set(entity.fields.map((f) => f.key));
  const columns = def.columns.filter((c) => validFieldKeys.has(c));
  if (columns.length === 0) throw new Error("Select at least one column");

  const executor = ENTITY_EXECUTORS[def.entity];
  const rawRows = await executor.fetchRows(schoolId);
  const dateResolve = executor.resolvers[entity.dateField];

  let rows = dateResolve
    ? rawRows.filter((r) => inRange(dateResolve(r) as string | null, dateFrom, dateTo))
    : rawRows;

  for (const f of def.filters) {
    if (!validFieldKeys.has(f.field)) continue;
    const fieldMeta = entity.fields.find((x) => x.key === f.field)!;
    const resolve = executor.resolvers[f.field];
    if (!resolve) continue;
    rows = rows.filter((r) => matchFilter(resolve(r), f.operator, f.value, fieldMeta.type));
  }

  if (def.groupBy && validFieldKeys.has(def.groupBy) && def.aggregate) {
    const groupResolve = executor.resolvers[def.groupBy];
    const aggResolve = def.aggregate.fn === "count" ? null : executor.resolvers[def.aggregate.field];
    const groupLabel = entity.fields.find((f) => f.key === def.groupBy)?.label ?? def.groupBy;
    const aggFieldLabel = entity.fields.find((f) => f.key === def.aggregate!.field)?.label ?? "";
    const aggLabel = def.aggregate.fn === "count" ? "Count" : `${AGGREGATE_LABEL[def.aggregate.fn]} of ${aggFieldLabel}`;

    const groups = new Map<string, { count: number; sum: number }>();
    for (const r of rows) {
      const key = String(groupResolve?.(r) ?? "—");
      const bucket = groups.get(key) ?? { count: 0, sum: 0 };
      bucket.count += 1;
      if (aggResolve) bucket.sum += Number(aggResolve(r) ?? 0);
      groups.set(key, bucket);
    }

    const result: [string, number][] = Array.from(groups.entries()).map(([key, b]) => {
      const value = def.aggregate!.fn === "count" ? b.count : def.aggregate!.fn === "sum" ? b.sum : (b.count ? Math.round((b.sum / b.count) * 100) / 100 : 0);
      return [key, value];
    });
    result.sort((a, b) => (def.sortDir === "asc" ? a[1] - b[1] : b[1] - a[1]));

    return { columns: [groupLabel, aggLabel], rows: result };
  }

  const sortField = def.sortBy && validFieldKeys.has(def.sortBy) ? def.sortBy : columns[0];
  const sortResolve = executor.resolvers[sortField];
  if (sortResolve) {
    rows = [...rows].sort((a, b) => {
      const av = sortResolve(a);
      const bv = sortResolve(b);
      const cmp = av === bv ? 0 : (av as string | number) > (bv as string | number) ? 1 : -1;
      return def.sortDir === "desc" ? -cmp : cmp;
    });
  }

  const outColumns = columns.map((key) => entity.fields.find((f) => f.key === key)!.label);
  const outRows = rows.map((r) => columns.map((key) => {
    const v = executor.resolvers[key]?.(r) ?? "";
    return typeof v === "boolean" ? (v ? "Yes" : "No") : v;
  }));

  return { columns: outColumns, rows: outRows };
}
