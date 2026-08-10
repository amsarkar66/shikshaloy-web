"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AnimatedCheckCircle,
  AuthChrome,
  FieldLabel,
  GoogleIcon,
  buttonPrimaryClass,
  buttonStrokeClass,
  cardClass,
  inputClass,
} from "@/components/auth/auth-ui";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    searchParams.get("error") === "confirm_failed"
      ? "That confirmation link is invalid or has expired. Please sign in and request a new one."
      : ""
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

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
    setShowResend(false);
    setResent(false);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      if (authError.message.toLowerCase().includes("email not confirmed")) {
        setError("Please confirm your email before signing in.");
        setShowResend(true);
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    // Hold a visible success state through the navigation instead of
    // resetting to idle: router.push isn't instant, so clearing `loading`
    // here would flash the button back to "Sign in" right before the page
    // actually changes.
    setLoading(false);
    setSuccess(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 650);
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setResent(false);
    try {
      const supabase = createClient();
      await supabase.auth.resend({ type: "signup", email });
      setResent(true);
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthChrome>
      <div className={cardClass}>
        {/* Heading */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-500/10">
            <img src="/logo.svg" alt="" className="h-8 w-8" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Welcome back</h1>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-zinc-400">
            Please enter your details to sign in.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
          >
            <span className="flex items-start gap-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </span>
            {showResend && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="ml-6 self-start text-xs font-medium text-red-700 underline underline-offset-2 hover:text-red-900 disabled:opacity-60 dark:text-red-200 dark:hover:text-white"
              >
                {resending ? "Resending…" : resent ? "Email resent" : "Resend confirmation email"}
              </button>
            )}
          </motion.div>
        )}

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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <FieldLabel label="Email Address" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@shikshaloy.com"
              required
              autoComplete="email"
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1">
            <FieldLabel
              label="Password"
              action={
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Forgot password?
                </Link>
              }
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
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
          </div>

          <Button
            type="submit"
            disabled={loading || success}
            className={`mt-2 overflow-hidden ${buttonPrimaryClass}`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {success ? (
                <motion.span
                  key="success"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1.5"
                >
                  <AnimatedCheckCircle className="h-4 w-4" />
                  Success
                </motion.span>
              ) : loading ? (
                <motion.span
                  key="loading"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1.5"
                >
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Signing in…
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  Sign in
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </form>

        {/* Sign up link */}
        <p className="text-center text-sm font-medium text-gray-500 dark:text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-gray-900 underline decoration-transparent underline-offset-4 transition-colors duration-200 hover:decoration-current dark:text-white">
            Register
          </Link>
        </p>
      </div>
    </AuthChrome>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
