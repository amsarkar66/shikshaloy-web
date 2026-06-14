"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  Globe,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type Step = 1 | 2;

const INSTITUTION_TYPES = [
  "School",
  "College",
  "University",
  "Training Institute",
  "Coaching Centre",
  "Other",
];

const DESIGNATIONS = [
  "Principal",
  "Director",
  "Administrator",
  "Registrar",
  "Head of Institution",
  "Other",
];

const STUDENT_RANGES = [
  "< 100",
  "100 – 500",
  "500 – 1,000",
  "1,000 – 5,000",
  "> 5,000",
];

interface InstitutionFields {
  institutionName: string;
  institutionType: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  website: string;
  studentRange: string;
}

interface AccountFields {
  fullName: string;
  designation: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 32 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -32 }),
};

function FieldWrap({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-indigo-200">{label}</label>
      {children}
    </div>
  );
}

function InputIcon({
  icon: Icon,
  type = "text",
  placeholder,
  value,
  onChange,
  autoComplete,
  required,
}: {
  icon: React.ElementType;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        className="h-10 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white placeholder:text-indigo-400/50 outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30"
      />
    </div>
  );
}

function SelectField({
  icon: Icon,
  placeholder,
  value,
  onChange,
  options,
  required,
}: {
  icon: React.ElementType;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400 pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="h-10 w-full appearance-none rounded-lg border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30 [&>option]:bg-indigo-950 [&>option]:text-white"
      >
        <option value="" disabled className="text-indigo-400/50">
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function SignupPage() {
  const [step, setStep] = useState<Step>(1);
  const [dir, setDir] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [inst, setInst] = useState<InstitutionFields>({
    institutionName: "",
    institutionType: "",
    city: "",
    state: "",
    country: "India",
    phone: "",
    website: "",
    studentRange: "",
  });

  const [acct, setAcct] = useState<AccountFields>({
    fullName: "",
    designation: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const setI = (k: keyof InstitutionFields) => (v: string) =>
    setInst((p) => ({ ...p, [k]: v }));
  const setA = (k: keyof AccountFields) => (v: string) =>
    setAcct((p) => ({ ...p, [k]: v }));

  const goTo = (next: Step) => {
    setDir(next > step ? 1 : -1);
    setStep(next);
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    goTo(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (acct.password !== acct.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (acct.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email: acct.email,
        password: acct.password,
        options: {
          data: {
            role: "super_admin",
            status: "pending",
            full_name: acct.fullName,
            designation: acct.designation,
            institution_name: inst.institutionName,
            institution_type: inst.institutionType,
            city: inst.city,
            state: inst.state,
            country: inst.country,
            phone: inst.phone,
            website: inst.website,
            student_range: inst.studentRange,
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return <ConfirmationScreen email={acct.email} institutionName={inst.institutionName} />;
  }

  return (
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-lg"
      >
        <div className="relative rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          {/* Branding */}
          <div className="mb-6 flex flex-col items-center">
            <Link href="/" className="mb-4 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 shadow-lg shadow-indigo-500/30">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">Shikshaloy</span>
            </Link>
            <h1 className="text-xl font-semibold text-white">Register your institution</h1>
            <p className="mt-1 text-center text-sm text-indigo-300">
              Submit your details for review. We&apos;ll activate your account once approved.
            </p>
          </div>

          {/* Progress stepper */}
          <div className="mb-8 flex items-center gap-3">
            {[
              { n: 1, label: "Institution" },
              { n: 2, label: "Admin account" },
            ].map(({ n, label }, i) => (
              <div key={n} className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2 shrink-0">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all ${
                      step >= n
                        ? "bg-indigo-500 text-white shadow shadow-indigo-500/30"
                        : "border border-white/20 text-indigo-400"
                    }`}
                  >
                    {n}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      step >= n ? "text-indigo-200" : "text-indigo-500"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < 1 && (
                  <div className="flex-1 h-px bg-white/10">
                    <div
                      className="h-full bg-indigo-500 transition-all duration-500"
                      style={{ width: step > n ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3.5 py-3 text-sm text-red-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Steps */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={dir}>
              {step === 1 ? (
                <motion.form
                  key="step1"
                  custom={dir}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  onSubmit={handleStep1}
                  className="space-y-4"
                >
                  <FieldWrap label="Institution name">
                    <InputIcon
                      icon={Building2}
                      placeholder="e.g. Delhi Public School, Sector 14"
                      value={inst.institutionName}
                      onChange={setI("institutionName")}
                      required
                    />
                  </FieldWrap>

                  <FieldWrap label="Institution type">
                    <SelectField
                      icon={Building2}
                      placeholder="Select type"
                      value={inst.institutionType}
                      onChange={setI("institutionType")}
                      options={INSTITUTION_TYPES}
                      required
                    />
                  </FieldWrap>

                  <div className="grid grid-cols-2 gap-4">
                    <FieldWrap label="City">
                      <InputIcon
                        icon={MapPin}
                        placeholder="City"
                        value={inst.city}
                        onChange={setI("city")}
                        required
                      />
                    </FieldWrap>
                    <FieldWrap label="State">
                      <InputIcon
                        icon={MapPin}
                        placeholder="State"
                        value={inst.state}
                        onChange={setI("state")}
                        required
                      />
                    </FieldWrap>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FieldWrap label="Phone number">
                      <InputIcon
                        icon={Phone}
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={inst.phone}
                        onChange={setI("phone")}
                        required
                      />
                    </FieldWrap>
                    <FieldWrap label="Approx. students">
                      <SelectField
                        icon={Users}
                        placeholder="Select range"
                        value={inst.studentRange}
                        onChange={setI("studentRange")}
                        options={STUDENT_RANGES}
                      />
                    </FieldWrap>
                  </div>

                  <FieldWrap label="Website (optional)">
                    <InputIcon
                      icon={Globe}
                      type="url"
                      placeholder="https://yourschool.edu.in"
                      value={inst.website}
                      onChange={setI("website")}
                    />
                  </FieldWrap>

                  <Button
                    type="submit"
                    className="mt-2 flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-500 font-medium text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </motion.form>
              ) : (
                <motion.form
                  key="step2"
                  custom={dir}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <FieldWrap label="Your full name">
                    <InputIcon
                      icon={User}
                      placeholder="Dr. Ramesh Kumar"
                      value={acct.fullName}
                      onChange={setA("fullName")}
                      autoComplete="name"
                      required
                    />
                  </FieldWrap>

                  <FieldWrap label="Your designation">
                    <SelectField
                      icon={User}
                      placeholder="Select designation"
                      value={acct.designation}
                      onChange={setA("designation")}
                      options={DESIGNATIONS}
                      required
                    />
                  </FieldWrap>

                  <FieldWrap label="Work email">
                    <InputIcon
                      icon={Mail}
                      type="email"
                      placeholder="you@yourschool.edu.in"
                      value={acct.email}
                      onChange={setA("email")}
                      autoComplete="email"
                      required
                    />
                  </FieldWrap>

                  <FieldWrap label="Password">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Min. 8 characters"
                        value={acct.password}
                        onChange={(e) => setA("password")(e.target.value)}
                        autoComplete="new-password"
                        required
                        minLength={8}
                        className="h-10 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-10 text-sm text-white placeholder:text-indigo-400/50 outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-300 transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FieldWrap>

                  <FieldWrap label="Confirm password">
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-400" />
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Repeat password"
                        value={acct.confirmPassword}
                        onChange={(e) => setA("confirmPassword")(e.target.value)}
                        autoComplete="new-password"
                        required
                        className="h-10 w-full rounded-lg border border-white/10 bg-white/5 pl-10 pr-10 text-sm text-white placeholder:text-indigo-400/50 outline-none transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-indigo-300 transition-colors"
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                      >
                        {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FieldWrap>

                  <div className="flex gap-3 mt-2">
                    <Button
                      type="button"
                      onClick={() => goTo(1)}
                      className="flex h-10 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 font-medium text-indigo-200 hover:bg-white/10 hover:text-white transition-all"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-500 font-medium text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 disabled:opacity-60 transition-all"
                    >
                      {loading ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Submitting…
                        </>
                      ) : (
                        "Submit application"
                      )}
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Divider + sign in link */}
          <div className="mt-6 border-t border-white/10 pt-5 text-center text-sm text-indigo-400">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-indigo-300 transition-colors hover:text-white">
              Sign in
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-indigo-600">
          <Link href="/" className="transition-colors hover:text-indigo-400">
            ← Back to homepage
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

function ConfirmationScreen({
  email,
  institutionName,
}: {
  email: string;
  institutionName: string;
}) {
  return (
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 h-80 w-80 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 h-80 w-80 rounded-full bg-violet-600/20 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl text-center">
          {/* Icon */}
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/15 ring-1 ring-indigo-500/30">
            <CheckCircle2 className="h-8 w-8 text-indigo-400" />
          </div>

          <h2 className="text-xl font-semibold text-white mb-2">Application submitted!</h2>
          <p className="text-indigo-300 text-sm leading-relaxed mb-6">
            We&apos;ve received the onboarding request for{" "}
            <span className="font-medium text-white">{institutionName}</span>. Our team will review
            your details and reach out to{" "}
            <span className="font-medium text-indigo-200">{email}</span> within{" "}
            <span className="font-medium text-white">1–2 business days</span>.
          </p>

          {/* What happens next */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-left space-y-3 mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              What happens next
            </p>
            {[
              "Our team reviews your institution details",
              "You receive an approval email with setup instructions",
              "Log in and start onboarding your staff & students",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-semibold text-indigo-400">
                  {i + 1}
                </div>
                <p className="text-sm text-indigo-200">{step}</p>
              </div>
            ))}
          </div>

          <Link href="/">
            <Button className="w-full h-10 rounded-lg bg-indigo-500 font-medium text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-400">
              Back to homepage
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
