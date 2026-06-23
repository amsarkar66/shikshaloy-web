"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, Landmark,
  MapPin, Phone, Globe, Mail, UserCog,
  GraduationCap, BookOpen, Building2, ChevronRight,
  AlertCircle,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1 — Identity
  name: string;
  shortName: string;
  board: string;
  established: string;
  gradesFrom: string;
  gradesTo: string;
  // Step 2 — Location & Contact
  address: string;
  city: string;
  state: string;
  pin: string;
  phone: string;
  email: string;
  website: string;
  // Step 3 — Principal
  principalName: string;
  principalEmail: string;
  principalPhone: string;
  principalDesignation: string;
}

const EMPTY: FormData = {
  name: "", shortName: "", board: "", established: "", gradesFrom: "", gradesTo: "",
  address: "", city: "", state: "", pin: "", phone: "", email: "", website: "",
  principalName: "", principalEmail: "", principalPhone: "", principalDesignation: "Principal",
};

const BOARDS = ["CBSE", "ICSE / ISC", "WBSEE", "State Board", "IB", "IGCSE", "Other"];

const GRADES_FROM = ["Pre-KG", "KG", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const GRADES_TO   = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu & Kashmir", "Ladakh", "Puducherry",
];

// ── Step config ───────────────────────────────────────────────────────────────

const STEPS = [
  { label: "School Identity", icon: Landmark },
  { label: "Location & Contact", icon: MapPin },
  { label: "Principal Setup", icon: UserCog },
];

// ── Shared field components ───────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-700 dark:text-zinc-300 mb-1.5">
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
}

function Input({
  placeholder, value, onChange, type = "text", disabled,
}: {
  placeholder?: string; value: string; onChange: (v: string) => void;
  type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-50 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:opacity-50 transition-shadow"
    />
  );
}

function Select({
  value, onChange, children, placeholder,
}: {
  value: string; onChange: (v: string) => void;
  children: React.ReactNode; placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition-shadow appearance-none"
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {children}
    </select>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1 text-xs text-red-500">
      <AlertCircle className="h-3 w-3 shrink-0" />
      {msg}
    </p>
  );
}

// ── Step 1: School Identity ───────────────────────────────────────────────────

function Step1({ data, set, errors }: { data: FormData; set: (k: keyof FormData, v: string) => void; errors: Partial<Record<keyof FormData, string>> }) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel required>School name</FieldLabel>
        <Input
          placeholder="e.g. Sunrise Academy — Salt Lake"
          value={data.name}
          onChange={(v) => set("name", v)}
        />
        <FieldError msg={errors.name} />
        <p className="mt-1 text-[11px] text-gray-400 dark:text-zinc-500">
          Use the full official name of the school.
        </p>
      </div>

      <div>
        <FieldLabel required>Short name / branch label</FieldLabel>
        <Input
          placeholder="e.g. Salt Lake"
          value={data.shortName}
          onChange={(v) => set("shortName", v)}
        />
        <FieldError msg={errors.shortName} />
        <p className="mt-1 text-[11px] text-gray-400 dark:text-zinc-500">
          Used in tables and compact views.
        </p>
      </div>

      <div>
        <FieldLabel required>Board / Curriculum</FieldLabel>
        <Select value={data.board} onChange={(v) => set("board", v)} placeholder="Select board">
          {BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
        </Select>
        <FieldError msg={errors.board} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel>Year established</FieldLabel>
          <Input
            placeholder="e.g. 2010"
            value={data.established}
            onChange={(v) => set("established", v)}
            type="number"
          />
        </div>
        <div>
          <FieldLabel required>Grade range</FieldLabel>
          <div className="flex items-center gap-2">
            <Select value={data.gradesFrom} onChange={(v) => set("gradesFrom", v)} placeholder="From">
              {GRADES_FROM.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
            <span className="shrink-0 text-xs text-gray-400 dark:text-zinc-500">to</span>
            <Select value={data.gradesTo} onChange={(v) => set("gradesTo", v)} placeholder="To">
              {GRADES_TO.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
          </div>
          <FieldError msg={errors.gradesFrom} />
        </div>
      </div>
    </div>
  );
}

// ── Step 2: Location & Contact ────────────────────────────────────────────────

function Step2({ data, set, errors }: { data: FormData; set: (k: keyof FormData, v: string) => void; errors: Partial<Record<keyof FormData, string>> }) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel required>Street address</FieldLabel>
        <Input
          placeholder="e.g. 12, Sector V, Bidhan Nagar"
          value={data.address}
          onChange={(v) => set("address", v)}
        />
        <FieldError msg={errors.address} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel required>City</FieldLabel>
          <Input
            placeholder="e.g. Kolkata"
            value={data.city}
            onChange={(v) => set("city", v)}
          />
          <FieldError msg={errors.city} />
        </div>
        <div>
          <FieldLabel required>PIN code</FieldLabel>
          <Input
            placeholder="e.g. 700091"
            value={data.pin}
            onChange={(v) => set("pin", v)}
            type="number"
          />
          <FieldError msg={errors.pin} />
        </div>
      </div>

      <div>
        <FieldLabel required>State</FieldLabel>
        <Select value={data.state} onChange={(v) => set("state", v)} placeholder="Select state">
          {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <FieldError msg={errors.state} />
      </div>

      <div className="border-t border-gray-100 dark:border-zinc-700/50 pt-5 space-y-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
          Contact details
        </p>

        <div>
          <FieldLabel required>Phone number</FieldLabel>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="tel"
              placeholder="+91 00000 00000"
              value={data.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-zinc-50 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>
          <FieldError msg={errors.phone} />
        </div>

        <div>
          <FieldLabel required>School email</FieldLabel>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="email"
              placeholder="info@school.edu.in"
              value={data.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-zinc-50 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>
          <FieldError msg={errors.email} />
        </div>

        <div>
          <FieldLabel>Website</FieldLabel>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="url"
              placeholder="www.school.edu.in"
              value={data.website}
              onChange={(e) => set("website", e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-zinc-50 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Principal Setup ───────────────────────────────────────────────────

function Step3({ data, set, errors }: { data: FormData; set: (k: keyof FormData, v: string) => void; errors: Partial<Record<keyof FormData, string>> }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-violet-200 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/5 px-4 py-3 text-xs text-violet-700 dark:text-violet-300">
        The principal will be added as an <strong>Admin</strong> for this school and will receive an
        email invite to set up their Shikshaloy account.
      </div>

      <div>
        <FieldLabel required>Full name</FieldLabel>
        <Input
          placeholder="e.g. Dr. Anita Sharma"
          value={data.principalName}
          onChange={(v) => set("principalName", v)}
        />
        <FieldError msg={errors.principalName} />
      </div>

      <div>
        <FieldLabel required>Designation</FieldLabel>
        <Select value={data.principalDesignation} onChange={(v) => set("principalDesignation", v)}>
          {["Principal", "Headmaster", "Headmistress", "Director", "Vice Principal"].map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </Select>
      </div>

      <div>
        <FieldLabel required>Email address</FieldLabel>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="email"
            placeholder="principal@school.edu.in"
            value={data.principalEmail}
            onChange={(e) => set("principalEmail", e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-zinc-50 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>
        <FieldError msg={errors.principalEmail} />
      </div>

      <div>
        <FieldLabel>Phone number</FieldLabel>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="tel"
            placeholder="+91 98765 43210"
            value={data.principalPhone}
            onChange={(e) => set("principalPhone", e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-zinc-50 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
          />
        </div>
      </div>
    </div>
  );
}

// ── Review panel ──────────────────────────────────────────────────────────────

function ReviewRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 dark:border-zinc-700/50 last:border-0">
      <span className="w-32 shrink-0 text-xs text-gray-500 dark:text-zinc-400">{label}</span>
      <span className="text-xs font-medium text-gray-900 dark:text-zinc-50 break-all">{value}</span>
    </div>
  );
}

function ReviewPanel({ data }: { data: FormData }) {
  const grades = data.gradesFrom && data.gradesTo ? `${data.gradesFrom} – ${data.gradesTo}` : "—";
  const location = [data.address, data.city, data.state, data.pin].filter(Boolean).join(", ");

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">School</p>
        <ReviewRow label="Name"        value={data.name} />
        <ReviewRow label="Short name"  value={data.shortName} />
        <ReviewRow label="Board"       value={data.board} />
        <ReviewRow label="Established" value={data.established} />
        <ReviewRow label="Grades"      value={grades} />
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Location & Contact</p>
        <ReviewRow label="Address" value={location} />
        <ReviewRow label="Phone"   value={data.phone} />
        <ReviewRow label="Email"   value={data.email} />
        <ReviewRow label="Website" value={data.website} />
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Principal</p>
        <ReviewRow label="Name"        value={data.principalName} />
        <ReviewRow label="Designation" value={data.principalDesignation} />
        <ReviewRow label="Email"       value={data.principalEmail} />
        <ReviewRow label="Phone"       value={data.principalPhone} />
      </div>
    </div>
  );
}

// ── Success screen ────────────────────────────────────────────────────────────

function SuccessScreen({ name, onAnother }: { name: string; onAnother: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
        <Check className="h-8 w-8 text-emerald-500" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-zinc-50">School added!</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
          <span className="font-medium text-gray-800 dark:text-zinc-200">{name}</span> has been
          created. The principal will receive an email invite.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/dashboard/schools"
          className="flex items-center gap-1.5 rounded-lg bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-600 transition-colors"
        >
          Go to Schools <ChevronRight className="h-4 w-4" />
        </Link>
        <button
          onClick={onAnother}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
        >
          Add another school
        </button>
      </div>
    </div>
  );
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateStep(step: number, data: FormData): Partial<Record<keyof FormData, string>> {
  const errs: Partial<Record<keyof FormData, string>> = {};
  if (step === 0) {
    if (!data.name.trim())      errs.name      = "School name is required.";
    if (!data.shortName.trim()) errs.shortName = "Short name is required.";
    if (!data.board)            errs.board     = "Select a board.";
    if (!data.gradesFrom)       errs.gradesFrom = "Select grade range.";
  }
  if (step === 1) {
    if (!data.address.trim()) errs.address = "Street address is required.";
    if (!data.city.trim())    errs.city    = "City is required.";
    if (!data.state)          errs.state   = "Select a state.";
    if (!data.pin.trim())     errs.pin     = "PIN code is required.";
    if (!data.phone.trim())   errs.phone   = "Phone number is required.";
    if (!data.email.trim())   errs.email   = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      errs.email = "Enter a valid email.";
  }
  if (step === 2) {
    if (!data.principalName.trim())  errs.principalName  = "Principal's name is required.";
    if (!data.principalEmail.trim()) errs.principalEmail = "Principal's email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.principalEmail))
      errs.principalEmail = "Enter a valid email.";
  }
  return errs;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AddSchoolPage() {
  const router = useRouter();
  const [step, setStep]       = useState(0);
  const [data, setData]       = useState<FormData>(EMPTY);
  const [errors, setErrors]   = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]       = useState(false);

  const totalSteps = STEPS.length;
  const isLast = step === totalSteps - 1;

  function set(key: keyof FormData, value: string) {
    setData((d) => ({ ...d, [key]: value }));
    setErrors((e) => { const next = { ...e }; delete next[key]; return next; });
  }

  function next() {
    const errs = validateStep(step, data);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    if (isLast) {
      handleSubmit();
    } else {
      setStep((s) => s + 1);
    }
  }

  function back() {
    setErrors({});
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleSubmit() {
    setSubmitting(true);
    // TODO: replace with actual Supabase insert
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    setDone(true);
  }

  function reset() {
    setData(EMPTY);
    setErrors({});
    setStep(0);
    setDone(false);
  }

  if (done) {
    return (
      <div className="w-full max-w-xl mx-auto px-6 py-12">
        <SuccessScreen name={data.name} onAnother={reset} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-8">

      {/* Back link */}
      <Link
        href="/dashboard/schools"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-50 transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to Schools
      </Link>

      {/* Step indicators */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => {
          const done  = i < step;
          const active = i === step;
          return (
            <div key={s.label} className="flex items-center flex-1 last:flex-none">
              {/* Node */}
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-2 transition-all ${
                done
                  ? "bg-violet-500 ring-violet-500 text-white"
                  : active
                  ? "bg-white dark:bg-zinc-900 ring-violet-500 text-violet-600 dark:text-violet-400"
                  : "bg-white dark:bg-zinc-900 ring-gray-200 dark:ring-zinc-700 text-gray-400 dark:text-zinc-500"
              }`}>
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>

              {/* Label */}
              <span className={`ml-2 text-xs font-medium hidden sm:block whitespace-nowrap ${
                active ? "text-gray-900 dark:text-zinc-50" : "text-gray-400 dark:text-zinc-500"
              }`}>
                {s.label}
              </span>

              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div className={`mx-3 flex-1 h-px ${done ? "bg-violet-500" : "bg-gray-200 dark:bg-zinc-700"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">

        {/* Card header */}
        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-zinc-800 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
            {(() => { const Icon = STEPS[step].icon; return <Icon className="h-4 w-4" />; })()}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">
              {STEPS[step].label}
            </p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Step {step + 1} of {totalSteps}
            </p>
          </div>
        </div>

        {/* Card body */}
        <div className="px-6 py-6">
          {step === 0 && <Step1 data={data} set={set} errors={errors} />}
          {step === 1 && <Step2 data={data} set={set} errors={errors} />}
          {step === 2 && <Step3 data={data} set={set} errors={errors} />}
        </div>

        {/* Review panel (step 3 shows review below the form) */}
        {isLast && (
          <div className="border-t border-gray-100 dark:border-zinc-800 px-6 py-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              Review all details
            </p>
            <ReviewPanel data={data} />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-zinc-800 px-6 py-4">
          <button
            onClick={back}
            disabled={step === 0}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <button
            onClick={next}
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-lg bg-violet-500 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow shadow-violet-500/20"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating…
              </>
            ) : isLast ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Create School
              </>
            ) : (
              <>
                Next
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
