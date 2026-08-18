"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, Landmark,
  MapPin, Phone, Globe, Mail, UserCog,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { FieldLabel, Input, Select, FieldError, INDIAN_STATES } from "./_field-kit";
import { AuthChrome } from "@/components/auth/auth-ui";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SchoolFormData {
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

const EMPTY: SchoolFormData = {
  name: "", shortName: "", board: "", established: "", gradesFrom: "", gradesTo: "",
  address: "", city: "", state: "", pin: "", phone: "", email: "", website: "",
  principalName: "", principalEmail: "", principalPhone: "", principalDesignation: "Principal",
};

const BOARDS = ["CBSE", "ICSE / ISC", "WBSEE", "State Board", "IB", "IGCSE", "Other"];

const GRADES_FROM = ["Pre-KG", "KG", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const GRADES_TO   = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

// ── Step config ───────────────────────────────────────────────────────────────

const STEPS = [
  { label: "School Identity", icon: Landmark },
  { label: "Location & Contact", icon: MapPin },
  { label: "Principal Setup", icon: UserCog },
];

// ── Step 1: School Identity ───────────────────────────────────────────────────

function Step1({ data, set, errors }: { data: SchoolFormData; set: (k: keyof SchoolFormData, v: string) => void; errors: Partial<Record<keyof SchoolFormData, string>> }) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel required>School name</FieldLabel>
        <Input
          placeholder="e.g. Sunrise Academy — Salt Lake"
          value={data.name}
          onChange={(v) => set("name", v)}
          invalid={!!errors.name}
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
          invalid={!!errors.shortName}
        />
        <FieldError msg={errors.shortName} />
        <p className="mt-1 text-[11px] text-gray-400 dark:text-zinc-500">
          Used in tables and compact views.
        </p>
      </div>

      <div>
        <FieldLabel required>Board / Curriculum</FieldLabel>
        <Select value={data.board} onChange={(v) => set("board", v)} placeholder="Select board" invalid={!!errors.board}>
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
            <Select value={data.gradesFrom} onChange={(v) => set("gradesFrom", v)} placeholder="From" invalid={!!errors.gradesFrom}>
              {GRADES_FROM.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
            <span className="shrink-0 text-xs text-gray-400 dark:text-zinc-500">to</span>
            <Select value={data.gradesTo} onChange={(v) => set("gradesTo", v)} placeholder="To" invalid={!!errors.gradesFrom}>
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

function Step2({ data, set, errors }: { data: SchoolFormData; set: (k: keyof SchoolFormData, v: string) => void; errors: Partial<Record<keyof SchoolFormData, string>> }) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel required>Street address</FieldLabel>
        <Input
          placeholder="e.g. 12, Sector V, Bidhan Nagar"
          value={data.address}
          onChange={(v) => set("address", v)}
          invalid={!!errors.address}
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
            invalid={!!errors.city}
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
            invalid={!!errors.pin}
          />
          <FieldError msg={errors.pin} />
        </div>
      </div>

      <div>
        <FieldLabel required>State</FieldLabel>
        <Select value={data.state} onChange={(v) => set("state", v)} placeholder="Select state" invalid={!!errors.state}>
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
              className={`w-full rounded-lg border bg-white dark:bg-zinc-800 pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-zinc-50 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 ${
                errors.phone
                  ? "border-red-300 dark:border-red-500/50 focus:ring-red-500/30"
                  : "border-gray-200 dark:border-zinc-700 focus:ring-primary-500/40"
              }`}
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
              className={`w-full rounded-lg border bg-white dark:bg-zinc-800 pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-zinc-50 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 ${
                errors.email
                  ? "border-red-300 dark:border-red-500/50 focus:ring-red-500/30"
                  : "border-gray-200 dark:border-zinc-700 focus:ring-primary-500/40"
              }`}
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
              className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-zinc-50 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Principal Setup ───────────────────────────────────────────────────

function Step3({ data, set, errors }: { data: SchoolFormData; set: (k: keyof SchoolFormData, v: string) => void; errors: Partial<Record<keyof SchoolFormData, string>> }) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-primary-200 dark:border-primary-500/20 bg-primary-50 dark:bg-primary-500/5 px-4 py-3 text-xs text-primary-700 dark:text-primary-300">
        The principal will be added as an <strong>Admin</strong> for this school and will receive an
        email with their login credentials.
      </div>

      <div>
        <FieldLabel required>Full name</FieldLabel>
        <Input
          placeholder="e.g. Dr. Anita Sharma"
          value={data.principalName}
          onChange={(v) => set("principalName", v)}
          invalid={!!errors.principalName}
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
            className={`w-full rounded-lg border bg-white dark:bg-zinc-800 pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-zinc-50 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 ${
              errors.principalEmail
                ? "border-red-300 dark:border-red-500/50 focus:ring-red-500/30"
                : "border-gray-200 dark:border-zinc-700 focus:ring-primary-500/40"
            }`}
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
            className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-zinc-50 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
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

function ReviewPanel({ data }: { data: SchoolFormData }) {
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

// ── Success screen (additional-school mode only) ──────────────────────────────

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
          created. The principal will receive an email with their login details.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/dashboard/schools"
          className="flex items-center gap-1.5 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
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

function validateStep(step: number, data: SchoolFormData): Partial<Record<keyof SchoolFormData, string>> {
  const errs: Partial<Record<keyof SchoolFormData, string>> = {};
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

// ── Main component ────────────────────────────────────────────────────────────

export function SchoolOnboardingForm({
  mode,
  onSubmit,
}: {
  mode: "onboarding" | "additional-school";
  onSubmit: (data: SchoolFormData) => Promise<{ error?: string } | void>;
}) {
  const router = useRouter();
  const [step, setStep]       = useState(0);
  const [data, setData]       = useState<SchoolFormData>(EMPTY);
  const [errors, setErrors]   = useState<Partial<Record<keyof SchoolFormData, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]       = useState(false);

  const totalSteps = STEPS.length;
  const isLast = step === totalSteps - 1;

  function set(key: keyof SchoolFormData, value: string) {
    setData((d) => ({ ...d, [key]: value }));
    setErrors((e) => { const next = { ...e }; delete next[key]; return next; });
  }

  function next() {
    const errs = validateStep(step, data);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    if (isLast) {
      void handleSubmit();
    } else {
      setStep((s) => s + 1);
    }
  }

  function back() {
    setErrors({});
    setSubmitError("");
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const result = await onSubmit(data);
      if (result?.error) {
        setSubmitError(result.error);
        return;
      }
      if (mode === "onboarding") {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setData(EMPTY);
    setErrors({});
    setStep(0);
    setDone(false);
  }

  const isAdditionalSchool = mode === "additional-school";

  if (done) {
    const successContent = (
      <div className="w-full max-w-xl mx-auto px-6 py-12">
        <SuccessScreen name={data.name} onAnother={reset} />
      </div>
    );
    if (isAdditionalSchool) {
      return (
        <AuthChrome
          maxWidthClassName="max-w-2xl"
          topLeft={<BackToSchoolsLink />}
          showGrid={false}
          showThemeToggle={false}
        >
          {successContent}
        </AuthChrome>
      );
    }
    return successContent;
  }

  const formContent = (
    <div className="w-full max-w-2xl mx-auto px-6 py-8">

      {/* Step indicators */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => {
          const stepDone  = i < step;
          const active = i === step;
          return (
            <div key={s.label} className="flex items-center flex-1 last:flex-none">
              {/* Node */}
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-2 transition-all ${
                stepDone
                  ? "bg-primary-500 ring-primary-500 text-white"
                  : active
                  ? "bg-white dark:bg-zinc-900 ring-primary-500 text-primary-600 dark:text-primary-400"
                  : "bg-white dark:bg-zinc-900 ring-gray-200 dark:ring-zinc-700 text-gray-400 dark:text-zinc-500"
              }`}>
                {stepDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>

              {/* Label */}
              <span className={`ml-2 text-xs font-medium hidden sm:block whitespace-nowrap ${
                active ? "text-gray-900 dark:text-zinc-50" : "text-gray-400 dark:text-zinc-500"
              }`}>
                {s.label}
              </span>

              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div className={`mx-3 flex-1 h-px ${stepDone ? "bg-primary-500" : "bg-gray-200 dark:bg-zinc-700"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">

        {/* Card header */}
        <div className="flex items-center gap-3 border-b border-gray-100 dark:border-zinc-800 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
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

        {/* Review panel (final step shows review below the form) */}
        {isLast && (
          <div className="border-t border-gray-100 dark:border-zinc-800 px-6 py-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
              Review all details
            </p>
            <ReviewPanel data={data} />
          </div>
        )}

        {submitError && (
          <div className="mx-6 mb-5 flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-3.5 py-3 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{submitError}</span>
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
            className="flex items-center gap-1.5 rounded-lg bg-primary-500 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow shadow-primary-500/20"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {mode === "onboarding" ? "Creating…" : "Creating…"}
              </>
            ) : isLast ? (
              <>
                <Check className="h-3.5 w-3.5" />
                {mode === "onboarding" ? "Complete setup" : "Create School"}
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

  if (isAdditionalSchool) {
    return (
      <AuthChrome
        maxWidthClassName="max-w-2xl"
        topLeft={<BackToSchoolsLink />}
        showGrid={false}
        showThemeToggle={false}
      >
        {formContent}
      </AuthChrome>
    );
  }
  return formContent;
}

function BackToSchoolsLink() {
  return (
    <Link
      href="/dashboard/schools"
      className="absolute left-4 top-4 z-10 flex items-center gap-2 text-sm font-semibold text-gray-900 transition-opacity hover:opacity-80 dark:text-white sm:left-6 sm:top-6"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Schools
    </Link>
  );
}
