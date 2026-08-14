"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, AlertCircle, Info } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import {
  AuthChrome,
  FieldLabel,
  GoogleIcon,
  OtpInput,
  buttonStrokeClass,
  cardClass,
  inputClass,
} from "@/components/auth/auth-ui";
import { createClient } from "@/lib/supabase/client";

interface AccountFields {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const EMPTY: AccountFields = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
};

function passwordChecks(password: string) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

const passwordHintMetClass = "text-primary-600 dark:text-primary-400";
const passwordHintUnmetClass = "text-gray-400 dark:text-zinc-500";

function PasswordHintPart({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <span className={`font-medium transition-colors ${met ? passwordHintMetClass : passwordHintUnmetClass}`}>
      {children}
    </span>
  );
}

function CheckMailIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 512 512" {...props}>
      <path
        fill="#1b5041"
        d="m502.7 224.1v235c0 29.2-23.7 52.9-52.9 52.9h-387.7c-29.2 0-52.9-23.7-52.9-52.9v-235l209.5-208.7c20.6-20.6 54-20.6 74.7 0z"
      />
      <path
        fill="#effaf7"
        d="m103.5 58.9h305.5c29.2 0 52.9 23.7 52.9 52.9v305.5c0 29.2-23.7 52.9-52.9 52.9h-305.5c-29.2 0-52.9-23.7-52.9-52.9v-305.6c0-29.2 23.7-52.8 52.9-52.8z"
      />
      <path
        fill="#317360"
        d="m502.7 224.1v235c0 29.2-23.7 52.9-52.9 52.9h-387.7c-29.2 0-52.9-23.7-52.9-52.9v-234.3l246.4 246.4z"
      />
      <path
        fill="#4db396"
        d="m487.4 496.4c-8.3 8.4-19.5 14-31.9 15.4l-395.2.2c-13.9-.5-26.5-6.4-35.7-15.6l194-194c20.6-20.6 54.1-20.6 74.8 0z"
      />
      <circle cx={256} cy={172.9} fill="#246150" r={88.1} />
      <path
        fill="#fff"
        d="m306.5 135.2c-3.4-3.4-9-3.4-12.5 0l-56.6 56.6-19.7-19.7c-3.3-3.3-8.8-3.3-12.1 0l-.2.2c-3.5 3.5-3.5 9.1 0 12.5l25.7 25.7c3.4 3.4 9 3.4 12.5 0l62.9-62.9c3.5-3.4 3.5-9 0-12.4z"
      />
    </svg>
  );
}

function VerifyEmailScreen({ email, onBack }: { email: string; onBack: () => void }) {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setVerifying(true);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "signup",
      });

      if (verifyError) {
        setError(verifyError.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const supabase = createClient();
      await supabase.auth.resend({ type: "signup", email });
      setResendCooldown(30);
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthChrome>
      <div className={cardClass}>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-500/10">
            <CheckMailIcon className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Verify your email</h1>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-zinc-400">
            Enter the 6-digit code we sent to{" "}
            <span className="text-gray-900 dark:text-white">{email}</span>{" "}
            <button
              type="button"
              onClick={onBack}
              className="font-semibold text-primary-600 underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current dark:text-primary-400"
            >
              change
            </button>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="flex flex-col gap-2">
            <FieldLabel label="Verification code" />
            <OtpInput value={otp} onChange={setOtp} />
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-gray-500 dark:text-zinc-400">Didn&apos;t get a code?</span>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                className="text-primary-600 transition-colors hover:text-primary-700 disabled:opacity-60 dark:text-primary-400 dark:hover:text-primary-300"
              >
                {resending
                  ? "Resending…"
                  : resendCooldown > 0
                  ? `Resend code in ${resendCooldown}s`
                  : "Resend code"}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <FancyButton
            type="submit"
            disabled={verifying || otp.length < 6}
            size="sm"
            className="mt-2 h-10 w-full px-3.5"
          >
            {verifying ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Verifying…
              </>
            ) : (
              "Verify email"
            )}
          </FancyButton>
        </form>
      </div>
    </AuthChrome>
  );
}

export default function SignupPage() {
  const [data, setData] = useState<AccountFields>(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k: keyof AccountFields) => (v: string) =>
    setData((d) => ({ ...d, [k]: v }));

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError) {
      setError(authError.message);
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const checks = passwordChecks(data.password);
    if (!checks.length || !checks.uppercase || !checks.number || !checks.special) {
      setError("Password must be at least 8 characters and include 1 uppercase letter, 1 number, and 1 special character.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: signUpData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: "super_admin",
            status: "pending",
            full_name: `${data.firstName} ${data.lastName}`.trim(),
          },
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // Supabase returns a "successful" signup with no identities for an
      // email that's already registered, to avoid leaking which emails exist.
      if (signUpData.user && signUpData.user.identities?.length === 0) {
        setError("This email is already registered. Please log in instead.");
        return;
      }

      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return <VerifyEmailScreen email={data.email} onBack={() => setSubmitted(false)} />;
  }

  const passwordCheck = passwordChecks(data.password);

  return (
    <AuthChrome>
      <div className={cardClass}>
        {/* Heading */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-500/10">
            <img src="/logo.svg" alt="" className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Create an account</h1>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-zinc-400">
            Please enter your details to create an account.
          </p>
        </div>

        {/* Google OAuth */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className={`mb-5 font-semibold ${buttonStrokeClass}`}
          >
            {googleLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-zinc-600 dark:border-t-zinc-300" />
            ) : (
              <GoogleIcon className="h-4 w-4" />
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-gray-200 dark:bg-zinc-800" />
            <span className="text-xs font-medium text-gray-400 dark:text-zinc-500">OR</span>
            <span className="h-px flex-1 bg-gray-200 dark:bg-zinc-800" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <FieldLabel label="First Name" />
              <input
                value={data.firstName}
                onChange={(e) => set("firstName")(e.target.value)}
                placeholder="James"
                autoComplete="given-name"
                required
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1">
              <FieldLabel label="Last Name" />
              <input
                value={data.lastName}
                onChange={(e) => set("lastName")(e.target.value)}
                placeholder="Brown"
                autoComplete="family-name"
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <FieldLabel label="Email Address" />
            <input
              type="email"
              value={data.email}
              onChange={(e) => set("email")(e.target.value)}
              placeholder="hello@shikshaloy.com"
              autoComplete="email"
              required
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <FieldLabel
              label="Password"
              action={
                data.password ? (
                  <button
                    type="button"
                    onClick={() => set("password")("")}
                    className="text-xs font-medium text-gray-400 transition-colors hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    Clear
                  </button>
                ) : undefined
              }
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={data.password}
                onChange={(e) => set("password")(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={8}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <p className="flex items-start gap-1.5 text-xs text-gray-400 dark:text-zinc-500">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              <span>
                {"Must include "}
                <PasswordHintPart met={passwordCheck.uppercase}>uppercase</PasswordHintPart>
                {", "}
                <PasswordHintPart met={passwordCheck.number}>number</PasswordHintPart>
                {" and "}
                <PasswordHintPart met={passwordCheck.special}>symbol</PasswordHintPart>
                {" ("}
                <PasswordHintPart met={passwordCheck.length}>min 8 chars</PasswordHintPart>
                {")"}
              </span>
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          <FancyButton
            type="submit"
            disabled={loading}
            size="sm"
            className="mt-2 h-10 w-full px-3.5"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating account…
              </>
            ) : (
              "Continue"
            )}
          </FancyButton>
        </form>

        {/* Sign in link */}
        <p className="text-center text-sm font-medium text-gray-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-gray-900 underline decoration-transparent underline-offset-4 transition-colors duration-200 hover:decoration-current dark:text-white">
            Login
          </Link>
        </p>
      </div>
    </AuthChrome>
  );
}
