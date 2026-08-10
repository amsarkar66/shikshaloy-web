"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Phone, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AuthChrome,
  FieldLabel,
  OtpInput,
  buttonPrimaryClass,
  cardClass,
  inputClass,
} from "@/components/auth/auth-ui";
import { createClient } from "@/lib/supabase/client";

type Step = "phone" | "otp";

export function VerifyPhoneClient({ defaultPhone }: { defaultPhone: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState(defaultPhone);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ phone });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setStep("otp");
      setResendCooldown(30);
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: "phone_change",
      });
      if (verifyError) {
        setError(verifyError.message);
        return;
      }
      router.push("/onboarding");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function resendCode() {
    setResending(true);
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({ phone });
      setResendCooldown(30);
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthChrome>
      <div className={cardClass}>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-500/10">
            {step === "phone" ? (
              <Phone className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            ) : (
              <ShieldCheck className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            )}
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Verify your phone</h1>
          {step === "phone" ? (
            <p className="mt-1 text-sm font-medium text-gray-500 dark:text-zinc-400">
              We&apos;ll text you a one-time code to confirm your number.
            </p>
          ) : (
            <p className="mt-1 text-sm font-medium text-gray-500 dark:text-zinc-400">
              Enter the code we sent to <span className="text-gray-900 dark:text-white">{phone}</span>{" "}
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="font-semibold text-primary-600 underline decoration-transparent underline-offset-2 transition-colors hover:decoration-current dark:text-primary-400"
              >
                change
              </button>
            </p>
          )}
        </div>

        {step === "phone" ? (
          <form onSubmit={sendCode} className="space-y-4">
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

            <div className="flex flex-col gap-1">
              <FieldLabel label="Phone number" />
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                required
                className={inputClass}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={`mt-2 ${buttonPrimaryClass}`}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Sending code…
                </>
              ) : (
                "Send code"
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">
            <div className="flex flex-col gap-2">
              <FieldLabel label="Verification code" />
              <OtpInput value={otp} onChange={setOtp} />
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-gray-500 dark:text-zinc-400">Didn&apos;t get a code?</span>
                <button
                  type="button"
                  onClick={resendCode}
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

            <Button
              type="submit"
              disabled={loading || otp.length < 6}
              className={`mt-2 ${buttonPrimaryClass}`}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Verifying…
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </form>
        )}
      </div>
    </AuthChrome>
  );
}
