"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Landmark, MapPin, Phone, Globe, AlertCircle, Check, ArrowLeft, ArrowRight, LogOut,
  GraduationCap, ClipboardCheck, Mail, ChevronRight,
} from "lucide-react";
import { AsYouType, getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOut } from "@/app/dashboard/actions";
import { FieldLabel, Input, Select, FieldError, INDIAN_STATES, COUNTRIES, COUNTRY_CODE_BY_NAME } from "./_field-kit";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export interface InstitutionFormData {
  name: string;
  institutionType: string;
  board: string;
  boardOther: string;
  establishedYear: string;
  city: string;
  state: string;
  country: string;
  address: string;
  pinCode: string;
  studentRange: string;
  staffRange: string;
  gradesFrom: string;
  gradesTo: string;
  tagline: string;
  phone: string;
  email: string;
  website: string;
  udiseCode: string;
}

const EMPTY: InstitutionFormData = {
  name: "", institutionType: "", board: "", boardOther: "", establishedYear: "",
  city: "", state: "", country: "India", address: "", pinCode: "",
  studentRange: "", staffRange: "", gradesFrom: "", gradesTo: "", tagline: "",
  phone: "", email: "", website: "", udiseCode: "",
};

const INSTITUTION_TYPES = [
  { value: "School", comingSoon: false },
  { value: "College", comingSoon: true },
  { value: "University", comingSoon: true },
  { value: "Training Institute", comingSoon: true },
  { value: "Coaching Centre", comingSoon: true },
];
export const BOARDS = ["CBSE", "ICSE / ISC", "State Board", "IB", "IGCSE", "Other"];
const STUDENT_RANGES = ["< 100", "100 – 500", "500 – 1,000", "1,000 – 5,000", "> 5,000"];
const STAFF_RANGES = ["< 10", "10 – 25", "25 – 50", "50 – 100", "> 100"];
// Shared by both the "from" and "to" selects (rather than two separate,
// misaligned lists) so every grade is a valid start and a valid end —
// e.g. a preschool ending at "KG" or a junior college starting at "XI".
const GRADE_LEVELS = ["Pre-KG", "KG", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

const STEPS = [
  { label: "Institution", description: "Name and type", icon: Landmark },
  { label: "Location", description: "City, state, and address", icon: MapPin },
  { label: "Grades", description: "Grade levels offered", icon: GraduationCap },
  { label: "Contact", description: "Phone and contact details", icon: Phone },
  { label: "Review", description: "Confirm all details", icon: ClipboardCheck },
];
const CONTACT_STEP = STEPS.findIndex((s) => s.label === "Contact");

function validateStep(step: number, data: InstitutionFormData): Partial<Record<keyof InstitutionFormData, string>> {
  const errs: Partial<Record<keyof InstitutionFormData, string>> = {};
  const isSchool = data.institutionType === "School";
  if (step === 0) {
    if (!data.name.trim())     errs.name           = "Institution name is required.";
    if (!data.institutionType) errs.institutionType = "Select a type.";
    if (isSchool && !data.board) errs.board = "Select your board.";
    if (isSchool && data.board === "Other" && !data.boardOther.trim()) errs.boardOther = "Enter your board's name.";
  }
  if (step === 1) {
    if (!data.city.trim())    errs.city         = "City is required.";
    if (!data.state)          errs.state        = "Select a state.";
    if (!data.pinCode.trim()) errs.pinCode      = "PIN code is required.";
    if (!data.studentRange)   errs.studentRange = "Select a range.";
  }
  if (step === 2) {
    if (data.gradesFrom && !data.gradesTo) errs.gradesTo = "Select the ending grade too.";
    if (!data.gradesFrom && data.gradesTo) errs.gradesTo = "Select the starting grade too.";
    if (data.gradesFrom && data.gradesTo && GRADE_LEVELS.indexOf(data.gradesFrom) > GRADE_LEVELS.indexOf(data.gradesTo)) {
      errs.gradesTo = "Ending grade must come after the starting grade.";
    }
  }
  if (step === CONTACT_STEP) {
    if (!data.phone.trim()) errs.phone = "Phone number is required.";
  }
  return errs;
}

type StepProps = {
  data: InstitutionFormData;
  set: (k: keyof InstitutionFormData, v: string) => void;
  errors: Partial<Record<keyof InstitutionFormData, string>>;
};

function Step0({ data, set, errors }: StepProps) {
  const isSchool = data.institutionType === "School";
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel required>Institution name</FieldLabel>
        <Input
          placeholder="e.g. Sunrise Education Group"
          value={data.name}
          onChange={(v) => set("name", v)}
          invalid={!!errors.name}
        />
        <FieldError msg={errors.name} />
      </div>

      <div>
        <FieldLabel>Tagline (optional)</FieldLabel>
        <Input
          placeholder="e.g. Excellence in education since 1998"
          value={data.tagline}
          onChange={(v) => set("tagline", v)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel required>Institution type</FieldLabel>
          <Select value={data.institutionType} onChange={(v) => set("institutionType", v)} placeholder="Select type" invalid={!!errors.institutionType}>
            {INSTITUTION_TYPES.map((t) => (
              <option key={t.value} value={t.value} disabled={t.comingSoon}>
                <span className="flex w-full items-center justify-between gap-2">
                  {t.value}
                  {t.comingSoon && (
                    <span className="shrink-0 rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-400 dark:text-zinc-500">
                      Coming soon
                    </span>
                  )}
                </span>
              </option>
            ))}
          </Select>
          <FieldError msg={errors.institutionType} />
        </div>
        <div>
          <FieldLabel>Established year (optional)</FieldLabel>
          <Input
            placeholder="e.g. 1998"
            value={data.establishedYear}
            onChange={(v) => set("establishedYear", v.replace(/\D/g, "").slice(0, 4))}
          />
        </div>
      </div>

      {isSchool && (
        <div>
          <FieldLabel required>Board / affiliation</FieldLabel>
          <Select value={data.board} onChange={(v) => set("board", v)} placeholder="Select board" invalid={!!errors.board}>
            {BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </Select>
          <FieldError msg={errors.board} />
        </div>
      )}

      {isSchool && data.board === "Other" && (
        <div>
          <FieldLabel required>Specify your board</FieldLabel>
          <Input
            placeholder="e.g. NIOS"
            value={data.boardOther}
            onChange={(v) => set("boardOther", v)}
            invalid={!!errors.boardOther}
          />
          <FieldError msg={errors.boardOther} />
        </div>
      )}
    </div>
  );
}

function Step1({ data, set, errors }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <FieldLabel>Address (optional)</FieldLabel>
        <Input placeholder="Street, area" value={data.address} onChange={(v) => set("address", v)} />
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
          <FieldLabel required>State</FieldLabel>
          <Select value={data.state} onChange={(v) => set("state", v)} placeholder="Select state" invalid={!!errors.state}>
            {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <FieldError msg={errors.state} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel required>PIN code</FieldLabel>
          <Input
            placeholder="e.g. 700001"
            value={data.pinCode}
            onChange={(v) => set("pinCode", v.replace(/\D/g, "").slice(0, 6))}
            invalid={!!errors.pinCode}
          />
          <FieldError msg={errors.pinCode} />
        </div>
        <div>
          <FieldLabel>Country</FieldLabel>
          <Select value={data.country} onChange={(v) => set("country", v)}>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel required>Approx. students</FieldLabel>
          <Select value={data.studentRange} onChange={(v) => set("studentRange", v)} placeholder="Select range" invalid={!!errors.studentRange}>
            {STUDENT_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
          <FieldError msg={errors.studentRange} />
        </div>
        <div>
          <FieldLabel>Approx. staff (optional)</FieldLabel>
          <Select value={data.staffRange} onChange={(v) => set("staffRange", v)} placeholder="Select range">
            {STAFF_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </div>
      </div>
    </div>
  );
}

function Step2({ data, set, errors }: StepProps) {
  return (
    <div className="space-y-5">
      <div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Grades from (optional)</FieldLabel>
            <Select value={data.gradesFrom} onChange={(v) => set("gradesFrom", v)} placeholder="Select grade" invalid={!!errors.gradesTo}>
              {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
          </div>
          <div>
            <FieldLabel>Grades to (optional)</FieldLabel>
            <Select value={data.gradesTo} onChange={(v) => set("gradesTo", v)} placeholder="Select grade" invalid={!!errors.gradesTo}>
              {GRADE_LEVELS.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
          </div>
        </div>
        <FieldError msg={errors.gradesTo} />
      </div>
    </div>
  );
}

function Step3({ data, set, errors }: StepProps) {
  const isSchool = data.institutionType === "School";
  const countryCode = COUNTRY_CODE_BY_NAME[data.country] as CountryCode | undefined;
  const callingCode = countryCode ? getCountryCallingCode(countryCode) : "91";

  function handlePhoneChange(raw: string) {
    if (!countryCode) { set("phone", raw); return; }
    // Always bake the selected country's dial code into the value, so it
    // shows up automatically instead of requiring the user to type "+91".
    const digits = raw.replace(/\D/g, "");
    const nationalDigits = digits.startsWith(callingCode) ? digits.slice(callingCode.length) : digits;
    set("phone", nationalDigits ? new AsYouType(countryCode).input(`+${callingCode}${nationalDigits}`) : "");
  }

  return (
    <div className="space-y-5">
      <div>
        <FieldLabel required>Phone number</FieldLabel>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="tel"
            placeholder={`+${callingCode} phone number`}
            value={data.phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
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
        <FieldLabel>Office email (optional)</FieldLabel>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="email"
            placeholder="office@yourinstitution.edu.in"
            value={data.email}
            onChange={(e) => set("email", e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-zinc-50 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          />
        </div>
      </div>

      <div>
        <FieldLabel>Website (optional)</FieldLabel>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="url"
            placeholder="https://yourinstitution.edu.in"
            value={data.website}
            onChange={(e) => set("website", e.target.value)}
            className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-zinc-50 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          />
        </div>
      </div>

      {isSchool && (
        <div>
          <FieldLabel>UDISE+ code (optional)</FieldLabel>
          <Input
            placeholder="11-digit code"
            value={data.udiseCode}
            onChange={(v) => set("udiseCode", v.replace(/\D/g, "").slice(0, 11))}
          />
        </div>
      )}
    </div>
  );
}

function Step4({ data, goToStep }: { data: InstitutionFormData; goToStep: (i: number) => void }) {
  const isSchool = data.institutionType === "School";
  const rows: { label: string; value: string; step: number }[] = [
    { label: "Institution name", value: data.name, step: 0 },
    ...(data.tagline ? [{ label: "Tagline", value: data.tagline, step: 0 }] : []),
    { label: "Type", value: data.institutionType, step: 0 },
    ...(isSchool && data.board ? [{ label: "Board", value: data.board === "Other" ? data.boardOther : data.board, step: 0 }] : []),
    ...(data.establishedYear ? [{ label: "Established", value: data.establishedYear, step: 0 }] : []),
    { label: "Location", value: [data.city, data.state, data.country].filter(Boolean).join(", "), step: 1 },
    ...(data.address ? [{ label: "Address", value: data.address, step: 1 }] : []),
    ...(data.pinCode ? [{ label: "PIN code", value: data.pinCode, step: 1 }] : []),
    ...(data.studentRange ? [{ label: "Students", value: data.studentRange, step: 1 }] : []),
    ...(data.staffRange ? [{ label: "Staff", value: data.staffRange, step: 1 }] : []),
    ...(data.gradesFrom && data.gradesTo ? [{ label: "Grades", value: `${data.gradesFrom} – ${data.gradesTo}`, step: 2 }] : []),
    { label: "Phone", value: data.phone, step: CONTACT_STEP },
    ...(data.email ? [{ label: "Office email", value: data.email, step: CONTACT_STEP }] : []),
    ...(data.website ? [{ label: "Website", value: data.website, step: CONTACT_STEP }] : []),
    ...(isSchool && data.udiseCode ? [{ label: "UDISE+ code", value: data.udiseCode, step: CONTACT_STEP }] : []),
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 dark:text-zinc-400">
        Review your details before submitting for approval.
      </p>
      <dl className="divide-y divide-gray-100 dark:divide-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-800">
        {rows.map((r) => (
          <div key={r.label} className="flex items-start justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <dt className="text-xs text-gray-400 dark:text-zinc-500">{r.label}</dt>
              <dd className="truncate text-sm text-gray-900 dark:text-zinc-50">{r.value}</dd>
            </div>
            <button
              type="button"
              onClick={() => goToStep(r.step)}
              className="shrink-0 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              Edit
            </button>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function InstitutionForm({
  onSubmit,
  initialData,
  isResubmit,
  userName,
  userEmail,
}: {
  onSubmit: (data: InstitutionFormData) => Promise<{ error?: string } | void>;
  initialData?: InstitutionFormData;
  isResubmit?: boolean;
  userName: string;
  userEmail: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<InstitutionFormData>(initialData ?? EMPTY);
  const [step, setStep] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(initialData ? STEPS.length - 1 : 0);
  const [errors, setErrors] = useState<Partial<Record<keyof InstitutionFormData, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isLast = step === STEPS.length - 1;

  function set(key: keyof InstitutionFormData, value: string) {
    setData((d) => ({ ...d, [key]: value }));
    setErrors((e) => { const next = { ...e }; delete next[key]; return next; });
  }

  function goToStep(i: number) {
    if (i > maxStepReached) return;
    setErrors({});
    setSubmitError("");
    setStep(i);
  }

  function back() {
    setErrors({});
    setSubmitError("");
    setStep((s) => Math.max(0, s - 1));
  }

  async function next() {
    const errs = validateStep(step, data);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setSubmitError("");

    // Phone verification is temporarily optional while SMS delivery is
    // being set up — not gating progress on `phoneVerified` for now.

    if (!isLast) {
      setStep((s) => s + 1);
      setMaxStepReached((m) => Math.max(m, step + 1));
      return;
    }

    setSubmitting(true);
    try {
      const submitData = data.board === "Other" ? { ...data, board: data.boardOther.trim() } : data;
      const result = await onSubmit(submitData);
      if (result?.error) {
        setSubmitError(result.error);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  const initials = getInitials(userName || userEmail);

  const stepList = (
    <>
      {STEPS.map((s, i) => {
        const active = i === step;
        const done = i < step;
        const canGo = i <= maxStepReached;
        const Icon = s.icon;
        return (
          <button
            key={s.label}
            type="button"
            onClick={() => goToStep(i)}
            disabled={!canGo}
            className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
              active
                ? "bg-primary-50 dark:bg-primary-500/10 ring-1 ring-primary-200 dark:ring-primary-500/30"
                : canGo
                ? "hover:bg-gray-100 dark:hover:bg-zinc-800"
                : "opacity-50 cursor-not-allowed"
            }`}
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
              done
                ? "bg-primary-500 text-white"
                : active
                ? "bg-white dark:bg-zinc-900 ring-1 ring-primary-500 text-primary-600 dark:text-primary-400"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500"
            }`}>
              {done ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block whitespace-nowrap text-sm font-medium ${active ? "text-gray-900 dark:text-zinc-50" : "text-gray-600 dark:text-zinc-300"}`}>
                {s.label}
              </span>
              <span className="hidden lg:block text-xs text-gray-400 dark:text-zinc-500">
                {s.description}
              </span>
            </span>
            {done && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-zinc-600" />}
          </button>
        );
      })}
    </>
  );

  return (
    <div className="flex min-h-screen w-full gap-4 bg-gray-100 p-3 dark:bg-black sm:p-4">
      {/* Left rail — brand, steps, account */}
      <div className="hidden lg:flex lg:w-[320px] xl:w-[360px] shrink-0 flex-col justify-between rounded-3xl bg-white dark:border dark:border-zinc-800 dark:bg-zinc-900 px-6 py-8 shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] dark:shadow-none">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="" className="h-6 w-6" />
            <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">Shikshaloy</span>
          </Link>

          <div className="mt-10 flex flex-col gap-2">{stepList}</div>
        </div>

        <div className="flex items-center gap-2.5 border-t border-gray-100 dark:border-zinc-800 pt-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500 text-[11px] font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{userName}</p>
            <p className="truncate text-xs text-gray-400 dark:text-zinc-500">{userEmail}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              title="Sign out"
              aria-label="Sign out"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-700 dark:hover:text-zinc-200"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Right — form, centered */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-10">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-xl">
          {/* Mobile-only brand + step row (left rail is hidden below lg) */}
          <div className="mb-6 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="" className="h-6 w-6" />
              <span className="text-sm font-semibold tracking-tight text-gray-900 dark:text-white">Shikshaloy</span>
            </Link>
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {STEPS.map((s, i) => {
                const active = i === step;
                const done = i < step;
                const canGo = i <= maxStepReached;
                const Icon = s.icon;
                return (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => goToStep(i)}
                    disabled={!canGo}
                    className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 ring-1 ring-primary-200 dark:ring-primary-500/30"
                        : canGo
                        ? "text-gray-500 hover:bg-gray-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        : "text-gray-300 dark:text-zinc-600 cursor-not-allowed"
                    }`}
                  >
                    {done ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {isResubmit && (
            <p className="mb-4 text-xs text-gray-500 dark:text-zinc-400">
              Fix what needs changing, then resubmit for another review.
            </p>
          )}

          <div className="rounded-3xl bg-white dark:border dark:border-zinc-800 dark:bg-zinc-900 shadow-[0_1px_2px_0_rgba(10,13,20,0.03)] dark:shadow-none">
            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-zinc-800 px-6 py-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
                {(() => { const Icon = STEPS[step].icon; return <Icon className="h-4 w-4" />; })()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{STEPS[step].label}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Step {step + 1} of {STEPS.length}</p>
              </div>
            </div>

            <div className="px-6 py-6">
              {step === 0 && <Step0 data={data} set={set} errors={errors} />}
              {step === 1 && <Step1 data={data} set={set} errors={errors} />}
              {step === 2 && <Step2 data={data} set={set} errors={errors} />}
              {step === CONTACT_STEP && <Step3 data={data} set={set} errors={errors} />}
              {step === 4 && <Step4 data={data} goToStep={goToStep} />}
            </div>

            {submitError && (
              <div className="mx-6 mb-5 flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-3.5 py-3 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-gray-100 dark:border-zinc-800 px-6 py-4">
              <button
                type="button"
                onClick={back}
                disabled={step === 0}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>

              <button
                type="button"
                onClick={next}
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-lg bg-primary-500 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow shadow-primary-500/20"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    {isResubmit ? "Resubmitting…" : "Creating…"}
                  </>
                ) : !isLast ? (
                  <>
                    Next
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    {isResubmit ? "Resubmit for review" : "Submit for review"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
