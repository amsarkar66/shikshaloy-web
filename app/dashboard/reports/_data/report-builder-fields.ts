// Whitelisted data sources for the custom report builder. Purely descriptive —
// no queries here — so this file is safe to import from client components.
// The server-side executor (report-builder-data.ts) validates every builder
// payload against this same registry before touching the database.

export type FieldType = "text" | "number" | "date" | "boolean" | "select";

export interface BuilderField {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
}

export type EntityKey = "students" | "staff" | "fee_payments" | "exam_results" | "attendance" | "leaves";

export interface BuilderEntity {
  key: EntityKey;
  label: string;
  description: string;
  fields: BuilderField[];
  /** Field used for the report's date-range filter. */
  dateField: string;
}

export const BUILDER_ENTITIES: Record<EntityKey, BuilderEntity> = {
  students: {
    key: "students",
    label: "Students",
    description: "Student profiles, enrolment status, and class placement.",
    dateField: "joined_date",
    fields: [
      { key: "full_name",       label: "Name",           type: "text" },
      { key: "roll_no",         label: "Roll No",        type: "text" },
      { key: "admission_no",    label: "Admission No",   type: "text" },
      { key: "class",           label: "Class",          type: "text" },
      { key: "gender",          label: "Gender",         type: "select", options: ["Male", "Female", "Other"] },
      { key: "dob",             label: "Date of Birth",  type: "date" },
      { key: "status",         label: "Status",          type: "select", options: ["active", "inactive", "graduated"] },
      { key: "fee_status",      label: "Fee Status",     type: "select", options: ["paid", "partial", "overdue"] },
      { key: "attendance_pct",  label: "Attendance %",   type: "number" },
      { key: "blood_group",     label: "Blood Group",    type: "text" },
      { key: "phone",           label: "Phone",          type: "text" },
      { key: "joined_date",     label: "Joined Date",    type: "date" },
    ],
  },
  staff: {
    key: "staff",
    label: "Staff",
    description: "Staff members, roles, and employment details.",
    dateField: "joined_date",
    fields: [
      { key: "full_name",    label: "Name",         type: "text" },
      { key: "employee_id",  label: "Employee ID",  type: "text" },
      { key: "type",         label: "Type",         type: "select", options: ["teaching", "non_teaching"] },
      { key: "designation",  label: "Designation",  type: "text" },
      { key: "department",   label: "Department",   type: "text" },
      { key: "status",       label: "Status",       type: "select", options: ["active", "on_leave", "inactive"] },
      { key: "phone",        label: "Phone",         type: "text" },
      { key: "email",        label: "Email",         type: "text" },
      { key: "joined_date",  label: "Joined Date",   type: "date" },
    ],
  },
  fee_payments: {
    key: "fee_payments",
    label: "Fee Payments",
    description: "Fee dues and collections per student.",
    dateField: "created_at",
    fields: [
      { key: "student_name",  label: "Student",      type: "text" },
      { key: "class",         label: "Class",        type: "text" },
      { key: "month_str",     label: "Month",        type: "text" },
      { key: "category",      label: "Fee Category", type: "text" },
      { key: "amount_due",    label: "Amount Due",   type: "number" },
      { key: "amount_paid",   label: "Amount Paid",  type: "number" },
      { key: "status",        label: "Status",       type: "select", options: ["paid", "partial", "overdue"] },
      { key: "payment_mode",  label: "Payment Mode", type: "select", options: ["online", "cash", "cheque", "upi"] },
      { key: "created_at",    label: "Recorded On",  type: "date" },
    ],
  },
  exam_results: {
    key: "exam_results",
    label: "Exam Results",
    description: "Marks scored by students across exams and subjects.",
    dateField: "exam_date",
    fields: [
      { key: "student_name",    label: "Student",       type: "text" },
      { key: "class",           label: "Class",         type: "text" },
      { key: "exam_name",       label: "Exam",          type: "text" },
      { key: "subject",         label: "Subject",       type: "text" },
      { key: "marks_obtained",  label: "Marks Obtained", type: "number" },
      { key: "max_marks",       label: "Max Marks",     type: "number" },
      { key: "grade",           label: "Grade",         type: "text" },
      { key: "is_absent",       label: "Absent",        type: "boolean" },
      { key: "exam_date",       label: "Exam Date",     type: "date" },
    ],
  },
  attendance: {
    key: "attendance",
    label: "Student Attendance",
    description: "Daily attendance marks per student.",
    dateField: "date",
    fields: [
      { key: "student_name", label: "Student", type: "text" },
      { key: "class",        label: "Class",   type: "text" },
      { key: "status",       label: "Status",  type: "select", options: ["present", "absent", "late"] },
      { key: "date",         label: "Date",    type: "date" },
    ],
  },
  leaves: {
    key: "leaves",
    label: "Staff Leaves",
    description: "Staff leave requests and their approval status.",
    dateField: "applied_on",
    fields: [
      { key: "staff_name",  label: "Staff",      type: "text" },
      { key: "leave_type",  label: "Leave Type", type: "select", options: ["sick", "casual", "earned", "maternity", "emergency"] },
      { key: "status",      label: "Status",     type: "select", options: ["pending", "approved", "rejected", "cancelled"] },
      { key: "from_date",   label: "From",       type: "date" },
      { key: "to_date",     label: "To",         type: "date" },
      { key: "days",        label: "Days",       type: "number" },
      { key: "applied_on",  label: "Applied On", type: "date" },
    ],
  },
};

export type FilterOperator = "equals" | "contains" | "gt" | "lt" | "before" | "after";

export const OPERATORS_BY_TYPE: Record<FieldType, { value: FilterOperator; label: string }[]> = {
  text:    [{ value: "equals", label: "is" }, { value: "contains", label: "contains" }],
  select:  [{ value: "equals", label: "is" }],
  boolean: [{ value: "equals", label: "is" }],
  number:  [{ value: "equals", label: "=" }, { value: "gt", label: ">" }, { value: "lt", label: "<" }],
  date:    [{ value: "equals", label: "on" }, { value: "after", label: "after" }, { value: "before", label: "before" }],
};

export type AggregateFn = "count" | "sum" | "avg";

export const AGGREGATE_LABEL: Record<AggregateFn, string> = {
  count: "Count",
  sum: "Sum",
  avg: "Average",
};

export interface ReportFilter {
  field: string;
  operator: FilterOperator;
  value: string;
}

export interface CustomReportDefinition {
  entity: EntityKey;
  columns: string[];
  filters: ReportFilter[];
  groupBy?: string | null;
  aggregate?: { field: string; fn: AggregateFn } | null;
  sortBy?: string | null;
  sortDir?: "asc" | "desc";
}
