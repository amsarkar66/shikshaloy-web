"use client";

import { useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import { FancyButton } from "@/components/ui/fancy-button";
import {
  School,
  BookOpen,
  Bell,
  User,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
  ChevronDown,
  Shield,
  Plus,
  Trash2,
  RotateCcw,
  Building2,
  Loader2,
  KeyRound,
} from "lucide-react";
import {
  MODULES, MODULE_GROUPS, emptyPerms,
  type Template,
} from "@/lib/settings/role-template-constants";
import { LogoUpload } from "../../schools/_components/logo-upload";
import { BannerManager } from "../../schools/_components/banner-upload";
import {
  updateSchoolProfile, updateAcademicSettings,
  saveRoleTemplate, createRoleTemplate, deleteRoleTemplate, restoreRoleTemplateDefaults,
  updateNotificationPreferences, updateProfileBasic, changePassword,
} from "../actions";
import { createAcademicYear } from "@/lib/academic-years/actions";
import { PublishKeyPanel } from "./publish-key-panel";
import type { PublishKeyRow } from "@/lib/publish-keys/actions";
import type { SchoolBanner } from "@/lib/schools/banner-actions";

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = "school" | "institution" | "academic" | "permissions" | "notifications" | "account";

type NotifKey =
  | "feeReminder" | "attendanceAlert" | "examResult"
  | "newAdmission" | "parentMessage"  | "announcement"
  | "payrollAlert" | "systemAlert";

type Channel = "email" | "sms";
type NotifState = Record<NotifKey, Record<Channel, boolean>>;

export interface SettingsData {
  profile: { id: string; fullName: string; phone: string; email: string };
  notifPrefs: NotifState | null;
  school: {
    name: string; tagline: string; address: string; city: string; state: string;
    phone: string; email: string; website: string; board: string; logoUrl: string | null;
  } | null;
  academicYears: { id: string; name: string; startDate: string; isCurrent: boolean }[];
  academicSettings: {
    workingDays: string[]; periodsPerDay: number; periodDurationMins: number;
    attendanceThreshold: number; gradingScale: string; passMarks: number;
  } | null;
  roleTemplates: Template[];
  publishKeys: PublishKeyRow[];
  banners: SchoolBanner[];
}

// ── Tab config by role ────────────────────────────────────────────────────────

const ROLE_TABS: Record<string, { id: Tab; label: string; icon: React.ElementType }[]> = {
  kernel: [
    { id: "institution",   label: "API Keys",      icon: KeyRound },
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

const ROLE_LABELS: Record<string, string> = {
  kernel:      "Product Owner",
  super_admin: "Institution Owner",
  admin:       "Principal (Admin)",
  staff:       "Staff",
  teacher:     "Teacher",
  parent:      "Parent",
  student:     "Student",
  driver:      "Driver",
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
          : "focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
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
      className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none"
    />
  );
}

function Select({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
        checked ? "bg-primary-500" : "bg-gray-200 dark:bg-zinc-700"
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

function ErrorNote({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
      {msg}
    </div>
  );
}

function SaveBar({ onSave, saved, busy }: { onSave: () => void; saved: boolean; busy?: boolean }) {
  return (
    <div className="flex items-center justify-end pt-2">
      <FancyButton
        onClick={onSave}
        disabled={busy}
        size="sm"
      >
        {busy ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
        ) : saved ? (
          <><CheckCircle2 className="h-4 w-4" /> Saved</>
        ) : (
          <><Save className="h-4 w-4" /> Save Changes</>
        )}
      </FancyButton>
    </div>
  );
}

// ── Tab: Institution (super_admin) ────────────────────────────────────────────
// NOTE: institution-level (multi-school) profile has no backing table yet —
// kept as a local-only placeholder until multi-tenant institution settings ship.

function InstitutionTab({ publishKeys }: { publishKeys: PublishKeyRow[] }) {
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
        </div>
      </SectionCard>
      <SaveBar onSave={handleSave} saved={saved} />
      <PublishKeyPanel initialKeys={publishKeys} />
    </div>
  );
}

// ── Tab: School Profile (admin) ───────────────────────────────────────────────

const BOARD_OPTIONS = [
  { value: "",      label: "Not set"      },
  { value: "cbse",  label: "CBSE"        },
  { value: "icse",  label: "ICSE / ISC"  },
  { value: "state", label: "State Board"  },
  { value: "ib",    label: "IB"           },
  { value: "igcse", label: "IGCSE"        },
  { value: "other", label: "Other"        },
];

function SchoolTab({ school, academicYears, banners }: { school: NonNullable<SettingsData["school"]>; academicYears: SettingsData["academicYears"]; banners: SettingsData["banners"] }) {
  const router = useRouter();
  const [name,     setName]     = useState(school.name);
  const [tagline,  setTagline]  = useState(school.tagline);
  const [address,  setAddress]  = useState(school.address);
  const [city,     setCity]     = useState(school.city);
  const [state,    setState]    = useState(school.state);
  const [phone,    setPhone]    = useState(school.phone);
  const [email,    setEmail]    = useState(school.email);
  const [website,  setWebsite]  = useState(school.website);
  const [board,    setBoard]    = useState(school.board);
  const [logoUrl,  setLogoUrl]  = useState<string | null>(school.logoUrl);
  const [yearId,   setYearId]   = useState(academicYears.find((a) => a.isCurrent)?.id ?? academicYears[0]?.id ?? "");
  const [saved,    setSaved]    = useState(false);
  const [busy,     setBusy]     = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const [newYearOpen,  setNewYearOpen]  = useState(false);
  const [newYearName,  setNewYearName]  = useState("");
  const [newYearStart, setNewYearStart] = useState("");
  const [newYearEnd,   setNewYearEnd]   = useState("");
  const [newYearBusy,  setNewYearBusy]  = useState(false);
  const [newYearError, setNewYearError] = useState<string | null>(null);

  async function handleCreateYear() {
    if (!newYearName || !newYearStart || !newYearEnd) {
      setNewYearError("Name, start date and end date are all required.");
      return;
    }
    setNewYearBusy(true);
    setNewYearError(null);
    try {
      await createAcademicYear({ name: newYearName, startDate: newYearStart, endDate: newYearEnd });
      setNewYearOpen(false);
      setNewYearName(""); setNewYearStart(""); setNewYearEnd("");
      router.refresh();
    } catch (err) {
      setNewYearError(err instanceof Error ? err.message : "Failed to create academic year");
    } finally {
      setNewYearBusy(false);
    }
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      await updateSchoolProfile({
        name, tagline, address, city, state, phone, email, website, board,
        logoUrl, currentAcademicYearId: yearId || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save school profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <ErrorNote msg={error} />

      <SectionCard title="School Logo" description="Displayed in reports, certificates, and the login screen.">
        <LogoUpload value={logoUrl} onChange={setLogoUrl} />
      </SectionCard>

      <SectionCard title="Website Banners" description="Rotates as a slideshow on your public website homepage.">
        <BannerManager initialBanners={banners} />
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
            <Label>City</Label>
            <Input value={city} onChange={setCity} placeholder="City" />
          </div>
          <div>
            <Label>State</Label>
            <Input value={state} onChange={setState} placeholder="State" />
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
            <Select value={board} onChange={setBoard} options={BOARD_OPTIONS} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Academic Year" description="Controls report headers and fee cycle boundaries.">
        {academicYears.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-zinc-500">No academic years configured yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Current Academic Year</Label>
              <Select
                value={yearId}
                onChange={setYearId}
                options={academicYears.map((ay) => ({ value: ay.id, label: ay.name }))}
              />
            </div>
          </div>
        )}

        <div className="mt-4 border-t border-gray-100 dark:border-zinc-700/50 pt-4">
          {!newYearOpen ? (
            <button
              onClick={() => setNewYearOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> New Academic Year
            </button>
          ) : (
            <div className="space-y-3">
              {newYearError && <p className="text-xs text-red-500">{newYearError}</p>}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Name</Label>
                  <Input value={newYearName} onChange={setNewYearName} placeholder="2027-28" />
                </div>
                <div>
                  <Label>Start Date</Label>
                  <Input type="date" value={newYearStart} onChange={setNewYearStart} />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input type="date" value={newYearEnd} onChange={setNewYearEnd} />
                </div>
              </div>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                Copies the current year&apos;s classes &amp; sections into the new year. Students aren&apos;t moved until you promote them.
              </p>
              <div className="flex gap-2">
                <FancyButton
                  disabled={newYearBusy}
                  onClick={handleCreateYear}
                  size="xs"
                >
                  {newYearBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Create Academic Year
                </FancyButton>
                <button
                  disabled={newYearBusy}
                  onClick={() => { setNewYearOpen(false); setNewYearError(null); }}
                  className="rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      <SaveBar onSave={handleSave} saved={saved} busy={busy} />
    </div>
  );
}

// ── Tab: Academic ─────────────────────────────────────────────────────────────

const WORKING_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DEFAULT_ACADEMIC_SETTINGS: NonNullable<SettingsData["academicSettings"]> = {
  workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  periodsPerDay: 8,
  periodDurationMins: 45,
  attendanceThreshold: 75,
  gradingScale: "percentage",
  passMarks: 35,
};

function AcademicTab({ settings }: { settings: SettingsData["academicSettings"] }) {
  const initial = settings ?? DEFAULT_ACADEMIC_SETTINGS;
  const [workingDays,  setWorkingDays]  = useState<string[]>(initial.workingDays);
  const [periods,      setPeriods]      = useState(String(initial.periodsPerDay));
  const [periodMins,   setPeriodMins]   = useState(String(initial.periodDurationMins));
  const [attThreshold, setAttThreshold] = useState(String(initial.attendanceThreshold));
  const [gradingScale, setGradingScale] = useState(initial.gradingScale);
  const [passMarks,    setPassMarks]    = useState(String(initial.passMarks));
  const [saved,        setSaved]        = useState(false);
  const [busy,          setBusy]        = useState(false);
  const [error,         setError]       = useState<string | null>(null);

  function toggleDay(d: string) {
    setWorkingDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      await updateAcademicSettings({
        workingDays,
        periodsPerDay: Number(periods),
        periodDurationMins: Number(periodMins),
        attendanceThreshold: Number(attThreshold),
        gradingScale,
        passMarks: Number(passMarks),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save academic settings");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <ErrorNote msg={error} />

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
                    ? "border-primary-500 bg-primary-500/10 text-primary-700 dark:text-primary-300"
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

      <SaveBar onSave={handleSave} saved={saved} busy={busy} />
    </div>
  );
}

// ── Tab: Permissions ──────────────────────────────────────────────────────────

function PermissionsTab({ initialTemplates }: { initialTemplates: Template[] }) {
  const [templates,   setTemplates]   = useState<Template[]>(initialTemplates);
  const [selectedId,  setSelectedId]  = useState<string>(initialTemplates[0]?.id ?? "");
  const [saved,       setSaved]       = useState(false);
  const [busy,        setBusy]        = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const selected = templates.find((t) => t.id === selectedId) ?? templates[0];

  function togglePerm(moduleId: string, type: "view" | "manage") {
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id !== selectedId) return t;
        const cur = t.permissions[moduleId];
        const next = {
          view: type === "manage" ? (!cur.manage ? true : cur.view) : !cur.view,
          manage: type === "manage" ? !cur.manage : (!cur.view ? false : cur.manage),
        };
        return { ...t, permissions: { ...t.permissions, [moduleId]: next } };
      })
    );
  }

  async function addTemplate() {
    setBusy(true);
    setError(null);
    try {
      const { id } = await createRoleTemplate();
      const created: Template = { id, slug: `custom_${id}`, name: "New Role", description: "", isBuiltin: false, permissions: emptyPerms() };
      setTemplates((prev) => [...prev, created]);
      setSelectedId(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create role");
    } finally {
      setBusy(false);
    }
  }

  async function deleteTemplate(id: string) {
    setBusy(true);
    setError(null);
    try {
      await deleteRoleTemplate(id);
      const idx = templates.findIndex((t) => t.id === id);
      const next = templates.filter((t) => t.id !== id);
      setTemplates(next);
      setSelectedId(next[Math.max(0, idx - 1)]?.id ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete role");
    } finally {
      setBusy(false);
    }
  }

  async function restoreDefaults() {
    if (!selected?.isBuiltin) return;
    setBusy(true);
    setError(null);
    try {
      const permissions = await restoreRoleTemplateDefaults(selected.id, selected.slug);
      setTemplates((prev) => prev.map((t) => (t.id === selectedId ? { ...t, permissions } : t)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to restore defaults");
    } finally {
      setBusy(false);
    }
  }

  function updateField(field: "name" | "description", value: string) {
    setTemplates((prev) => prev.map((t) => (t.id === selectedId ? { ...t, [field]: value } : t)));
  }

  async function handleSave() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      await saveRoleTemplate({ id: selected.id, name: selected.name, description: selected.description, permissions: selected.permissions });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save role");
    } finally {
      setBusy(false);
    }
  }

  const builtins = templates.filter((t) => t.isBuiltin);
  const customs  = templates.filter((t) => !t.isBuiltin);

  return (
    <div className="space-y-4">
      <ErrorNote msg={error} />
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
                      ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium"
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
                      ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium"
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
                disabled={busy}
                className="w-full flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 disabled:opacity-50 transition-colors"
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
                      <span className="rounded-full bg-primary-50 dark:bg-primary-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-500">
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
                      className="h-8 w-full max-w-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm font-semibold text-gray-900 dark:text-zinc-50 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                    />
                    <input
                      value={selected.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      placeholder="Short description (optional)"
                      className="h-8 w-full max-w-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-xs text-gray-600 dark:text-zinc-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selected.isBuiltin && (
                  <button
                    onClick={restoreDefaults}
                    disabled={busy}
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restore Defaults
                  </button>
                )}
                {!selected.isBuiltin && (
                  <button
                    onClick={() => deleteTemplate(selected.id)}
                    disabled={busy}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                )}
                <FancyButton
                  onClick={handleSave}
                  disabled={busy}
                  size="xs"
                >
                  {saved
                    ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved</>
                    : <><Save className="h-3.5 w-3.5" /> Save</>
                  }
                </FancyButton>
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
                                className="h-4 w-4 rounded border-gray-300 dark:border-zinc-600 accent-primary-500 cursor-pointer disabled:cursor-default disabled:opacity-50"
                              />
                            </td>
                            <td className="py-3 text-center">
                              <input
                                type="checkbox"
                                checked={perm.manage}
                                onChange={() => togglePerm(mod.id, "manage")}
                                className="h-4 w-4 rounded border-gray-300 dark:border-zinc-600 accent-primary-500 cursor-pointer"
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
    </div>
  );
}

// ── Tab: Notifications ────────────────────────────────────────────────────────

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

const DEFAULT_NOTIFS: NotifState = {
  feeReminder:    { email: true,  sms: true  },
  attendanceAlert:{ email: true,  sms: false },
  examResult:     { email: true,  sms: false },
  newAdmission:   { email: true,  sms: false },
  parentMessage:  { email: true,  sms: false },
  announcement:   { email: false, sms: false },
  payrollAlert:   { email: true,  sms: false },
  systemAlert:    { email: true,  sms: false },
};

function NotificationsTab({ prefs, profileId }: { prefs: NotifState | null; profileId: string }) {
  const [notifs, setNotifs] = useState<NotifState>(prefs ?? DEFAULT_NOTIFS);
  const [saved, setSaved] = useState(false);
  const [busy,  setBusy]  = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(key: NotifKey, channel: Channel) {
    setNotifs((prev) => ({ ...prev, [key]: { ...prev[key], [channel]: !prev[key][channel] } }));
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      await updateNotificationPreferences(profileId, notifs);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save notification preferences");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <ErrorNote msg={error} />
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
      <SaveBar onSave={handleSave} saved={saved} busy={busy} />
    </div>
  );
}

// ── Tab: Account ──────────────────────────────────────────────────────────────

function AccountTab({ profile, roleLabel }: { profile: SettingsData["profile"]; roleLabel: string }) {
  const [fullName,     setFullName]     = useState(profile.fullName);
  const [phone,        setPhone]        = useState(profile.phone);
  const [showCurrent,  setShowCurrent]  = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [currentPw,    setCurrentPw]    = useState("");
  const [newPw,        setNewPw]        = useState("");
  const [confirmPw,    setConfirmPw]    = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [pwSaved,      setPwSaved]      = useState(false);
  const [profileBusy,  setProfileBusy]  = useState(false);
  const [pwBusy,       setPwBusy]       = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [pwError,      setPwError]      = useState<string | null>(null);

  const pwMatch    = newPw.length > 0 && confirmPw.length > 0 && newPw === confirmPw;
  const pwMismatch = newPw.length > 0 && confirmPw.length > 0 && newPw !== confirmPw;

  async function handleProfileSave() {
    setProfileBusy(true);
    setProfileError(null);
    try {
      await updateProfileBasic({ profileId: profile.id, fullName, phone });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setProfileBusy(false);
    }
  }

  async function handlePasswordSave() {
    if (!pwMatch || newPw.length < 8) {
      setPwError(newPw.length < 8 ? "New password must be at least 8 characters." : "Passwords do not match.");
      return;
    }
    setPwBusy(true);
    setPwError(null);
    try {
      await changePassword(currentPw, newPw);
      setPwSaved(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setTimeout(() => setPwSaved(false), 2500);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setPwBusy(false);
    }
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
            <Input value={profile.email} readOnly />
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
            <Input value={roleLabel} readOnly />
          </div>
        </div>
        <ErrorNote msg={profileError} />
        <div className="mt-4 flex justify-end">
          <FancyButton
            onClick={handleProfileSave}
            disabled={profileBusy}
            size="sm"
          >
            {profileBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : profileSaved ? <><CheckCircle2 className="h-4 w-4" /> Saved</> : <><Save className="h-4 w-4" /> Save Profile</>}
          </FancyButton>
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
                className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-10 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
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
                className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-10 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
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

          <ErrorNote msg={pwError} />

          <FancyButton
            onClick={handlePasswordSave}
            disabled={!pwMatch || !currentPw || pwBusy}
            size="sm"
          >
            {pwBusy ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</> : pwSaved ? <><CheckCircle2 className="h-4 w-4" /> Password Updated</> : <><Save className="h-4 w-4" /> Update Password</>}
          </FancyButton>
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

export function SettingsPageClient({ role, data }: { role: string; data: SettingsData }) {
  const tabs = ROLE_TABS[role] ?? ROLE_TABS.student;
  const [activeTab, setActiveTab] = useState<Tab>(tabs[0]?.id ?? "account");

  const roleLabel = ROLE_LABELS[role] ?? role;

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
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "school" && data.school && <SchoolTab school={data.school} academicYears={data.academicYears} banners={data.banners} />}
      {activeTab === "institution" && role === "kernel" && (
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Publish API keys</h2>
          <p className="mb-3 text-xs text-primary-500 dark:text-zinc-500">
            Used to authenticate platform-level integrations with Shikshaloy.
          </p>
          <PublishKeyPanel initialKeys={data.publishKeys} />
        </div>
      )}
      {activeTab === "institution" && role !== "kernel" && <InstitutionTab publishKeys={data.publishKeys} />}
      {activeTab === "academic"      && <AcademicTab settings={data.academicSettings} />}
      {activeTab === "permissions"   && <PermissionsTab initialTemplates={data.roleTemplates} />}
      {activeTab === "notifications" && <NotificationsTab prefs={data.notifPrefs} profileId={data.profile.id} />}
      {activeTab === "account"       && <AccountTab profile={data.profile} roleLabel={roleLabel} />}
    </div>
  );
}
