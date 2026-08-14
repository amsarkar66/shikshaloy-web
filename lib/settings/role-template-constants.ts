export type Permission = { view: boolean; manage: boolean };
export type ModulePerms = Record<string, Permission>;

export interface Template {
  id: string;
  slug: string;
  name: string;
  description: string;
  isBuiltin: boolean;
  permissions: ModulePerms;
}

export const MODULES: { id: string; label: string; group: string }[] = [
  { id: "students",      label: "Students",          group: "People"        },
  { id: "staff",         label: "Staff",             group: "People"        },
  { id: "parents",       label: "Parents",           group: "People"        },
  { id: "admissions",    label: "Admissions",        group: "People"        },
  { id: "classes",       label: "Classes",           group: "Academics"     },
  { id: "subjects",      label: "Subjects",          group: "Academics"     },
  { id: "timetable",     label: "Timetable",         group: "Academics"     },
  { id: "exams",         label: "Exams & Results",   group: "Academics"     },
  { id: "attendance",    label: "Attendance",        group: "Academics"     },
  { id: "fees",          label: "Fee Management",    group: "Finance"       },
  { id: "expenses",      label: "Expenses",          group: "Finance"       },
  { id: "payroll",       label: "Payroll",           group: "Finance"       },
  { id: "announcements", label: "Announcements",     group: "Communication" },
  { id: "messages",      label: "Messages",          group: "Communication" },
  { id: "events",        label: "Events & Calendar", group: "Communication" },
  { id: "grievances",    label: "Grievances",        group: "Communication" },
  { id: "library",       label: "Library",           group: "Facilities"    },
  { id: "hostel",        label: "Hostel",            group: "Facilities"    },
  { id: "transport",     label: "Transport",         group: "Facilities"    },
  { id: "inventory",     label: "Inventory",         group: "Facilities"    },
  { id: "gallery",       label: "Website Gallery",   group: "Facilities"    },
  { id: "reports",       label: "Reports",           group: "Reports"       },
  { id: "analytics",     label: "Analytics",         group: "Reports"       },
];

export const MODULE_GROUPS = [...new Set(MODULES.map((m) => m.group))];

export function emptyPerms(): ModulePerms {
  return Object.fromEntries(MODULES.map((m) => [m.id, { view: false, manage: false }]));
}

function buildPerms(overrides: Partial<Record<string, Partial<Permission>>>): ModulePerms {
  const base = emptyPerms();
  for (const [id, p] of Object.entries(overrides)) {
    if (id in base) base[id] = { ...base[id], ...p };
  }
  return base;
}

export const BUILTIN_META: { slug: string; name: string; description: string }[] = [
  { slug: "librarian",     name: "Librarian",     description: "Manages the school library and book inventory." },
  { slug: "warden",        name: "Warden",        description: "Oversees hostel operations and residential students." },
  { slug: "accountant",    name: "Accountant",    description: "Manages fees, expenses, and financial records." },
  { slug: "hr_manager",    name: "HR Manager",    description: "Handles staff records, payroll, and HR operations." },
  { slug: "receptionist",  name: "Receptionist",  description: "Front desk — handles admissions inquiries and communication." },
  { slug: "lab_assistant", name: "Lab Assistant", description: "Manages lab equipment and science/computer inventory." },
];

export const BUILTIN_DEFAULTS: Record<string, ModulePerms> = {
  librarian: buildPerms({
    library:   { view: true, manage: true  },
    inventory: { view: true, manage: false },
    students:  { view: true, manage: false },
    reports:   { view: true, manage: false },
  }),
  warden: buildPerms({
    hostel:     { view: true, manage: true  },
    students:   { view: true, manage: false },
    attendance: { view: true, manage: true  },
    parents:    { view: true, manage: false },
  }),
  accountant: buildPerms({
    fees:      { view: true, manage: true  },
    expenses:  { view: true, manage: true  },
    payroll:   { view: true, manage: false },
    reports:   { view: true, manage: false },
    analytics: { view: true, manage: false },
  }),
  hr_manager: buildPerms({
    staff:     { view: true, manage: true  },
    payroll:   { view: true, manage: true  },
    reports:   { view: true, manage: false },
    analytics: { view: true, manage: false },
  }),
  receptionist: buildPerms({
    admissions:    { view: true, manage: true  },
    students:      { view: true, manage: false },
    parents:       { view: true, manage: false },
    messages:      { view: true, manage: true  },
    announcements: { view: true, manage: false },
    events:        { view: true, manage: false },
  }),
  lab_assistant: buildPerms({
    inventory: { view: true, manage: true  },
    classes:   { view: true, manage: false },
    subjects:  { view: true, manage: false },
  }),
};
