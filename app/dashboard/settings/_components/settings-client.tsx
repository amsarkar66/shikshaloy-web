"use client";

import { useState, Fragment } from "react";
import {
  School,
  BookOpen,
  Bell,
  User,
  Save,
  Upload,
  CheckCircle2,
  Eye,
  EyeOff,
  ChevronDown,
  Shield,
  Plus,
  Trash2,
  RotateCcw,
  Building2,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "school" | "institution" | "academic" | "permissions" | "notifications" | "account";
type Permission = { view: boolean; manage: boolean };
type ModulePerms = Record<string, Permission>;
type Template = {
  id: string;
  name: string;
  description: string;
  isBuiltin: boolean;
  permissions: ModulePerms;
};

// ── Permissions data ──────────────────────────────────────────────────────────

const MODULES: { id: string; label: string; group: string }[] = [
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
  { id: "library",       label: "Library",           group: "Facilities"    },
  { id: "hostel",        label: "Hostel",            group: "Facilities"    },
  { id: "transport",     label: "Transport",         group: "Facilities"    },
  { id: "inventory",     label: "Inventory",         group: "Facilities"    },
  { id: "reports",       label: "Reports",           group: "Reports"       },
  { id: "analytics",     label: "Analytics",         group: "Reports"       },
];

const MODULE_GROUPS = [...new Set(MODULES.map((m) => m.group))];

function emptyPerms(): ModulePerms {
  return Object.fromEntries(MODULES.map((m) => [m.id, { view: false, manage: false }]));
}

function buildPerms(overrides: Partial<Record<string, Partial<Permission>>>): ModulePerms {
  const base = emptyPerms();
  for (const [id, p] of Object.entries(overrides)) {
    if (id in base) base[id] = { ...base[id], ...p };
  }
  return base;
}

const BUILTIN_DEFAULTS: Record<string, ModulePerms> = {
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

const INITIAL_TEMPLATES: Template[] = [
  { id: "librarian",     name: "Librarian",     description: "Manages the school library and book inventory.",               isBuiltin: true, permissions: BUILTIN_DEFAULTS.librarian     },
  { id: "warden",        name: "Warden",        description: "Oversees hostel operations and residential students.",         isBuiltin: true, permissions: BUILTIN_DEFAULTS.warden        },
  { id: "accountant",    name: "Accountant",    description: "Manages fees, expenses, and financial records.",               isBuiltin: true, permissions: BUILTIN_DEFAULTS.accountant    },
  { id: "hr_manager",    name: "HR Manager",    description: "Handles staff records, payroll, and HR operations.",           isBuiltin: true, permissions: BUILTIN_DEFAULTS.hr_manager    },
  { id: "receptionist",  name: "Receptionist",  description: "Front desk — handles admissions inquiries and communication.", isBuiltin: true, permissions: BUILTIN_DEFAULTS.receptionist  },
  { id: "lab_assistant", name: "Lab Assistant", description: "Manages lab equipment and science/computer inventory.",        isBuiltin: true, permissions: BUILTIN_DEFAULTS.lab_assistant },
];

// ── Tab config by role ────────────────────────────────────────────────────────

const ROLE_TABS: Record<string, { id: Tab; label: string; icon: React.ElementType }[]> = {
  kernel: [
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "account",       label: "My Account",    icon: User },
  ],
  super_admin: [
    { id: "institution",   label: "Institution",   icon: Building2 },
    { id: "permissions",   label: "Permissions",   icon: Shield    },
    { id: "notifications", label: "Notifications", icon: Bell      },
    { id: "account",       label: "My Account",    icon: User      },
  ],
  admin: [
    { id: "school",        label: "School Profile", icon: School   },
    { id: "academic",      label: "Academic",       icon: BookOpen },
    { id: "permissions",   label: "Permissions",    icon: Shield   },
    { id: "notifications", label: "Notifications",  icon: Bell     },
    { id: "account",       label: "My Account",     icon: User     },
  ],
  staff:   [{ id: "notifications", label: "Notifications", icon: Bell }, { id: "account", label: "My Account", icon: User }],
  teacher: [{ id: "notifications", label: "Notifications", icon: Bell }, { id: "account", label: "My Account", icon: User }],
  parent:  [{ id: "notifications", label: "Notifications", icon: Bell }, { id: "account", label: "My Account", icon: User }],
  student: [{ id: "account", label: "My Account", icon: User }],
  driver:  [{ id: "notifications", label: "Notifications", icon: Bell }, { id: "account", label: "My Account", icon: User }],
};

// ── Shared UI primitives ──────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5">
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={`h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none transition-colors ${
        readOnly
          ? "cursor-not-allowed opacity-60"
          : "focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      }`}
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        checked ? "bg-indigo-500" : "bg-gray-200 dark:bg-zinc-700"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700/50">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">{description}</p>
        )}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SaveBar({ onSave, saved }: { onSave: () => void; saved: boolean }) {
  return (
    <div className="flex items-center justify-end pt-2">
      <button
        onClick={onSave}
        className="flex items-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors shadow-sm"
      >
        {saved ? (
          <><CheckCircle2 className="h-4 w-4" /> Saved</>
        ) : (
          <><Save className="h-4 w-4" /> Save Changes</>
        )}
      </button>
    </div>
  );
}

// ── Tab: Institution (super_admin) ────────────────────────────────────────────

function InstitutionTab() {
  const [name,    setName]    = useState("Sunrise Education Group");
  const [email,   setEmail]   = useState("admin@sunrise.edu");
  const [phone,   setPhone]   = useState("+91 98765 00000");
  const [website, setWebsite] = useState("www.sunrise.edu");
  const [saved,   setSaved]   = useState(false);

  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2500); }

  return (
    <div className="space-y-5">
      <SectionCard title="Institution Profile" description="Details shared across all schools under this institution.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Institution Name</Label>
            <Input value={name} onChange={setName} placeholder="Institution name" />
          </div>
          <div>
            <Label>Contact Email</Label>
            <Input value={email} onChange={setEmail} placeholder="admin@example.com" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={setPhone} placeholder="+91 XXXXX XXXXX" />
          </div>
          <div>
            <Label>Website</Label>
            <Input value={website} onChange={setWebsite} placeholder="www.example.com" />
          </div>
          <div>
            <Label>Schools Under Institution</Label>
            <Input value="3 schools" readOnly />
          </div>
        </div>
      </SectionCard>
      <SaveBar onSave={handleSave} saved={saved} />
    </div>
  );
}

// ── Tab: School Profile (admin) ───────────────────────────────────────────────

function SchoolTab() {
  const [name,      setName]      = useState("St. Xavier's High School");
  const [tagline,   setTagline]   = useState("Excellence in Education Since 1978");
  const [address,   setAddress]   = useState("12, Park Street, Kolkata, West Bengal 700016");
  const [phone,     setPhone]     = useState("+91 33 2229 0000");
  const [email,     setEmail]     = useState("principal@stxaviers.edu.in");
  const [website,   setWebsite]   = useState("www.stxaviers.edu.in");
  const [board,     setBoard]     = useState("cbse");
  const [year,      setYear]      = useState("2025-26");
  const [yearStart, setYearStart] = useState("april");
  const [saved,     setSaved]     = useState(false);

  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2500); }

  return (
    <div className="space-y-5">
      <SectionCard title="School Logo" description="Displayed in reports, certificates, and the login screen.">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
            <School className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
          </div>
          <div className="space-y-2">
            <button className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
              <Upload className="h-3.5 w-3.5" />
              Upload Logo
            </button>
            <p className="text-xs text-gray-400 dark:text-zinc-500">PNG or JPG · max 2 MB · 512×512 px recommended</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Basic Information">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>School Name</Label>
            <Input value={name} onChange={setName} placeholder="Full school name" />
          </div>
          <div className="md:col-span-2">
            <Label>Tagline / Motto</Label>
            <Input value={tagline} onChange={setTagline} placeholder="Optional tagline" />
          </div>
          <div className="md:col-span-2">
            <Label>Address</Label>
            <Textarea value={address} onChange={setAddress} placeholder="Full address" rows={2} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={setPhone} placeholder="+91 XXXXX XXXXX" />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} onChange={setEmail} placeholder="school@example.com" />
          </div>
          <div>
            <Label>Website</Label>
            <Input value={website} onChange={setWebsite} placeholder="www.example.com" />
          </div>
          <div>
            <Label>Board Affiliation</Label>
            <Select
              value={board}
              onChange={setBoard}
              options={[
                { value: "cbse",  label: "CBSE"        },
                { value: "icse",  label: "ICSE / ISC"  },
                { value: "state", label: "State Board"  },
                { value: "ib",    label: "IB"           },
                { value: "igcse", label: "IGCSE"        },
                { value: "other", label: "Other"        },
              ]}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Academic Year" description="Controls report headers and fee cycle boundaries.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Current Academic Year</Label>
            <Select
              value={year}
              onChange={setYear}
              options={[
                { value: "2024-25", label: "2024 – 2025" },
                { value: "2025-26", label: "2025 – 2026" },
                { value: "2026-27", label: "2026 – 2027" },
              ]}
            />
          </div>
          <div>
            <Label>Year Starts In</Label>
            <Select
              value={yearStart}
              onChange={setYearStart}
              options={[
                { value: "january", label: "January" },
                { value: "april",   label: "April"   },
                { value: "june",    label: "June"    },
                { value: "july",    label: "July"    },
              ]}
            />
          </div>
        </div>
      </SectionCard>

      <SaveBar onSave={handleSave} saved={saved} />
    </div>
  );
}

// ── Tab: Academic ─────────────────────────────────────────────────────────────

const WORKING_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function AcademicTab() {
  const [workingDays,  setWorkingDays]  = useState<string[]>(["Mon","Tue","Wed","Thu","Fri","Sat"]);
  const [periods,      setPeriods]      = useState("8");
  const [periodMins,   setPeriodMins]   = useState("45");
  const [attThreshold, setAttThreshold] = useState("75");
  const [gradingScale, setGradingScale] = useState("percentage");
  const [passMarks,    setPassMarks]    = useState("35");
  const [saved,        setSaved]        = useState(false);

  function toggleDay(d: string) {
    setWorkingDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }
  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2500); }

  return (
    <div className="space-y-5">
      <SectionCard title="Working Days" description="Days school is open. Affects attendance and timetable generation.">
        <div className="flex flex-wrap gap-2">
          {WORKING_DAYS.map((d) => {
            const on = workingDays.includes(d);
            return (
              <button
                key={d}
                onClick={() => toggleDay(d)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  on
                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                    : "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Class Periods" description="Used to generate timetable slots.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Periods Per Day</Label>
            <Select value={periods} onChange={setPeriods} options={["6","7","8","9","10"].map((v) => ({ value: v, label: `${v} periods` }))} />
          </div>
          <div>
            <Label>Period Duration (minutes)</Label>
            <Select value={periodMins} onChange={setPeriodMins} options={["35","40","45","50","60"].map((v) => ({ value: v, label: `${v} min` }))} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Attendance Rules">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Minimum Attendance Threshold (%)</Label>
            <Select
              value={attThreshold}
              onChange={setAttThreshold}
              options={["60","65","70","75","80","85"].map((v) => ({ value: v, label: `${v}% — alert below this` }))}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Grading & Marks">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Grading Scale</Label>
            <Select
              value={gradingScale}
              onChange={setGradingScale}
              options={[
                { value: "percentage", label: "Percentage (0–100)" },
                { value: "cgpa",       label: "CGPA (0–10)"        },
                { value: "grade",      label: "Letter Grade (A–F)" },
              ]}
            />
          </div>
          <div>
            <Label>Pass Marks (%)</Label>
            <Select value={passMarks} onChange={setPassMarks} options={["33","35","40","45","50"].map((v) => ({ value: v, label: `${v}%` }))} />
          </div>
        </div>
      </SectionCard>

      <SaveBar onSave={handleSave} saved={saved} />
    </div>
  );
}

// ── Tab: Permissions ──────────────────────────────────────────────────────────

function PermissionsTab() {
  const [templates,   setTemplates]   = useState<Template[]>(INITIAL_TEMPLATES);
  const [selectedId,  setSelectedId]  = useState<string>(INITIAL_TEMPLATES[0].id);
  const [saved,       setSaved]       = useState(false);

  const selected = templates.find((t) => t.id === selectedId) ?? templates[0];

  function togglePerm(moduleId: string, type: "view" | "manage") {
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id !== selectedId) return t;
        const cur = t.permissions[moduleId];
        const next: Permission =
          type === "manage"
            ? { view: !cur.manage ? true : cur.view, manage: !cur.manage }
            : { view: !cur.view, manage: !cur.view ? false : cur.manage };
        return { ...t, permissions: { ...t.permissions, [moduleId]: next } };
      })
    );
  }

  function addTemplate() {
    const id = `custom_${Date.now()}`;
    setTemplates((prev) => [
      ...prev,
      { id, name: "New Role", description: "", isBuiltin: false, permissions: emptyPerms() },
    ]);
    setSelectedId(id);
  }

  function deleteTemplate(id: string) {
    const idx = templates.findIndex((t) => t.id === id);
    const next = templates.filter((t) => t.id !== id);
    setTemplates(next);
    setSelectedId(next[Math.max(0, idx - 1)]?.id ?? "");
  }

  function restoreDefaults() {
    if (!selected?.isBuiltin) return;
    setTemplates((prev) =>
      prev.map((t) =>
        t.id === selectedId ? { ...t, permissions: BUILTIN_DEFAULTS[t.id] ?? emptyPerms() } : t
      )
    );
  }

  function updateField(field: "name" | "description", value: string) {
    setTemplates((prev) => prev.map((t) => (t.id === selectedId ? { ...t, [field]: value } : t)));
  }

  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2500); }

  const builtins = templates.filter((t) => t.isBuiltin);
  const customs  = templates.filter((t) => !t.isBuiltin);

  return (
    <div className="flex gap-5 min-h-0">
      {/* Template sidebar */}
      <div className="w-52 shrink-0 space-y-3">
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-gray-100 dark:border-zinc-700/50">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Built-in</p>
          </div>
          <div className="p-1.5 space-y-0.5">
            {builtins.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                  selectedId === t.id
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium"
                    : "text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-gray-100 dark:border-zinc-700/50">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">Custom</p>
          </div>
          <div className="p-1.5 space-y-0.5">
            {customs.length === 0 && (
              <p className="px-3 py-2 text-xs text-gray-400 dark:text-zinc-600">No custom roles yet</p>
            )}
            {customs.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                  selectedId === t.id
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium"
                    : "text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700/50"
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
          <div className="px-1.5 pb-1.5">
            <button
              onClick={addTemplate}
              className="w-full flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              New Role
            </button>
          </div>
        </div>
      </div>

      {/* Permission matrix */}
      {selected && (

        <div className="flex-1 min-w-0 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700/50 flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-2">
              {selected.isBuiltin ? (
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{selected.name}</p>
                    <span className="rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-500">
                      Built-in
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">{selected.description}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    value={selected.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Role name"
                    className="h-8 w-full max-w-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm font-semibold text-gray-900 dark:text-zinc-50 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <input
                    value={selected.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder="Short description (optional)"
                    className="h-8 w-full max-w-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-gray-600 dark:text-zinc-400 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {selected.isBuiltin && (
                <button
                  onClick={restoreDefaults}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Restore Defaults
                </button>
              )}
              {!selected.isBuiltin && (
                <button
                  onClick={() => deleteTemplate(selected.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              )}
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors shadow-sm"
              >
                {saved
                  ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved</>
                  : <><Save className="h-3.5 w-3.5" /> Save</>
                }
              </button>
            </div>
          </div>

          {/* Module matrix */}
          <div className="p-5 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-700/50">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Module</th>
                  <th className="pb-3 w-24 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">View</th>
                  <th className="pb-3 w-24 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Manage</th>
                </tr>
              </thead>
              <tbody>
                {MODULE_GROUPS.map((group) => (
                  <Fragment key={group}>
                    <tr>
                      <td colSpan={3} className="pt-5 pb-1.5">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-600">{group}</p>
                      </td>
                    </tr>
                    {MODULES.filter((m) => m.group === group).map((mod) => {
                      const perm = selected.permissions[mod.id] ?? { view: false, manage: false };
                      return (
                        <tr key={mod.id} className="border-b border-gray-50 dark:border-zinc-700/30 last:border-0">
                          <td className="py-3 text-sm text-gray-700 dark:text-zinc-300">{mod.label}</td>
                          <td className="py-3 text-center">
                            <input
                              type="checkbox"
                              checked={perm.view}
                              onChange={() => togglePerm(mod.id, "view")}
                              disabled={perm.manage}
                              title={perm.manage ? "View is required when Manage is enabled" : undefined}
                              className="h-4 w-4 rounded border-gray-300 dark:border-zinc-600 accent-indigo-500 cursor-pointer disabled:cursor-default disabled:opacity-50"
                            />
                          </td>
                          <td className="py-3 text-center">
                            <input
                              type="checkbox"
                              checked={perm.manage}
                              onChange={() => togglePerm(mod.id, "manage")}
                              className="h-4 w-4 rounded border-gray-300 dark:border-zinc-600 accent-indigo-500 cursor-pointer"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Notifications ────────────────────────────────────────────────────────

type NotifKey =
  | "feeReminder" | "attendanceAlert" | "examResult"
  | "newAdmission" | "parentMessage"  | "announcement"
  | "payrollAlert" | "systemAlert";

type Channel = "email" | "sms";

const NOTIF_ROWS: { key: NotifKey; label: string; desc: string }[] = [
  { key: "feeReminder",    label: "Fee Reminders",      desc: "Notify when fees are due or overdue"               },
  { key: "attendanceAlert",label: "Attendance Alerts",  desc: "Alert when student attendance drops below threshold" },
  { key: "examResult",     label: "Exam Results",       desc: "Notify when results are published"                  },
  { key: "newAdmission",   label: "New Admissions",     desc: "Alert when a new student is enrolled"               },
  { key: "parentMessage",  label: "Parent Messages",    desc: "Notify when a parent sends a message"               },
  { key: "announcement",   label: "Announcements",      desc: "Receive all published announcements"                },
  { key: "payrollAlert",   label: "Payroll Alerts",     desc: "Payroll processing and disbursement notices"        },
  { key: "systemAlert",    label: "System Alerts",      desc: "Critical system and security notifications"         },
];

type NotifState = Record<NotifKey, Record<Channel, boolean>>;

function NotificationsTab() {
  const [notifs, setNotifs] = useState<NotifState>({
    feeReminder:    { email: true,  sms: true  },
    attendanceAlert:{ email: true,  sms: false },
    examResult:     { email: true,  sms: false },
    newAdmission:   { email: true,  sms: false },
    parentMessage:  { email: true,  sms: false },
    announcement:   { email: false, sms: false },
    payrollAlert:   { email: true,  sms: false },
    systemAlert:    { email: true,  sms: false },
  });
  const [saved, setSaved] = useState(false);

  function toggle(key: NotifKey, channel: Channel) {
    setNotifs((prev) => ({ ...prev, [key]: { ...prev[key], [channel]: !prev[key][channel] } }));
  }
  function handleSave() { setSaved(true); setTimeout(() => setSaved(false), 2500); }

  return (
    <div className="space-y-5">
      <SectionCard
        title="Notification Preferences"
        description="Choose which events trigger notifications and via which channel."
      >
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-zinc-700/50">
                <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Event</th>
                <th className="pb-3 w-20 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Email</th>
                <th className="pb-3 w-20 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">SMS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {NOTIF_ROWS.map(({ key, label, desc }) => (
                <tr key={key}>
                  <td className="py-3.5 pr-4">
                    <p className="font-medium text-gray-900 dark:text-zinc-100">{label}</p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">{desc}</p>
                  </td>
                  <td className="py-3.5 text-center">
                    <Toggle checked={notifs[key].email} onChange={() => toggle(key, "email")} />
                  </td>
                  <td className="py-3.5 text-center">
                    <Toggle checked={notifs[key].sms} onChange={() => toggle(key, "sms")} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
      <SaveBar onSave={handleSave} saved={saved} />
    </div>
  );
}

// ── Tab: Account ──────────────────────────────────────────────────────────────

function AccountTab() {
  const [fullName,     setFullName]     = useState("Rajesh Kumar");
  const [phone,        setPhone]        = useState("+91 98765 43210");
  const [showCurrent,  setShowCurrent]  = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [currentPw,    setCurrentPw]    = useState("");
  const [newPw,        setNewPw]        = useState("");
  const [confirmPw,    setConfirmPw]    = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [pwSaved,      setPwSaved]      = useState(false);

  const pwMatch    = newPw && confirmPw && newPw === confirmPw;
  const pwMismatch = newPw && confirmPw && newPw !== confirmPw;

  function handleProfileSave() { setProfileSaved(true); setTimeout(() => setProfileSaved(false), 2500); }
  function handlePasswordSave() {
    if (!pwMatch) return;
    setPwSaved(true);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    setTimeout(() => setPwSaved(false), 2500);
  }

  return (
    <div className="space-y-5">
      <SectionCard title="Profile" description="Your personal information shown in reports and messages.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Full Name</Label>
            <Input value={fullName} onChange={setFullName} placeholder="Your full name" />
          </div>
          <div>
            <Label>Email Address</Label>
            <Input value="rajesh@stxaviers.edu.in" readOnly />
            <p className="mt-1.5 text-xs text-gray-400 dark:text-zinc-500">
              Email is managed by your institution owner.
            </p>
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={setPhone} placeholder="+91 XXXXX XXXXX" />
          </div>
          <div>
            <Label>Role</Label>
            <Input value="Principal (Admin)" readOnly />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleProfileSave}
            className="flex items-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors shadow-sm"
          >
            {profileSaved ? <><CheckCircle2 className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> Save Profile</>}
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Change Password" description="Use a strong password of at least 8 characters.">
        <div className="space-y-4 max-w-sm">
          <div>
            <Label>Current Password</Label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="••••••••"
                className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-10 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <button type="button" onClick={() => setShowCurrent((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 hover:text-gray-600">
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <Label>New Password</Label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="••••••••"
                className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-10 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
              <button type="button" onClick={() => setShowNew((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 hover:text-gray-600">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {newPw && (
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4].map((n) => {
                  const strength =
                    (newPw.length >= 8 ? 1 : 0) +
                    (/[A-Z]/.test(newPw) ? 1 : 0) +
                    (/[0-9]/.test(newPw) ? 1 : 0) +
                    (/[^A-Za-z0-9]/.test(newPw) ? 1 : 0);
                  const color = strength <= 1 ? "bg-red-400" : strength === 2 ? "bg-amber-400" : strength === 3 ? "bg-yellow-400" : "bg-emerald-400";
                  return <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${n <= strength ? color : "bg-gray-100 dark:bg-zinc-700"}`} />;
                })}
              </div>
            )}
          </div>

          <div>
            <Label>Confirm New Password</Label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="••••••••"
                className={`h-9 w-full rounded-lg border bg-white dark:bg-zinc-800 pl-3 pr-10 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:ring-2 transition-colors ${
                  pwMismatch ? "border-red-400 focus:border-red-400 focus:ring-red-500/20"
                  : pwMatch   ? "border-emerald-400 focus:border-emerald-400 focus:ring-emerald-500/20"
                  : "border-gray-200 dark:border-zinc-700 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-indigo-500/20"
                }`}
              />
              <button type="button" onClick={() => setShowConfirm((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 hover:text-gray-600">
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {pwMismatch && <p className="mt-1.5 text-xs text-red-500">Passwords do not match</p>}
            {pwMatch    && <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Passwords match</p>}
          </div>

          <button
            onClick={handlePasswordSave}
            disabled={!pwMatch || !currentPw}
            className="flex items-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed px-4 py-2 text-sm font-medium text-white transition-colors shadow-sm"
          >
            {pwSaved ? <><CheckCircle2 className="h-4 w-4" /> Password Updated</> : <><Save className="h-4 w-4" /> Update Password</>}
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Danger Zone">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">Sign out of all devices</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">Revokes all active sessions except this one.</p>
          </div>
          <button className="shrink-0 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
            Sign Out All
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function SettingsPageClient({ role }: { role: string }) {
  const tabs = ROLE_TABS[role] ?? ROLE_TABS.student;
  const [activeTab, setActiveTab] = useState<Tab>(tabs[0]?.id ?? "account");

  const subtitle =
    role === "admin"       ? "Manage your school profile, academic configuration, staff permissions, and account." :
    role === "super_admin" ? "Manage your institution profile, staff permissions, notifications, and account."     :
    "Manage your notification preferences and account settings.";

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50">Settings</h2>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-zinc-400">{subtitle}</p>
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === id
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "school"        && <SchoolTab />}
      {activeTab === "institution"   && <InstitutionTab />}
      {activeTab === "academic"      && <AcademicTab />}
      {activeTab === "permissions"   && <PermissionsTab />}
      {activeTab === "notifications" && <NotificationsTab />}
      {activeTab === "account"       && <AccountTab />}
    </div>
  );
}
