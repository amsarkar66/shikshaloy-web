"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, Copy, RefreshCw, Loader2, UserPlus, Eye } from "lucide-react";
import { AnimatedCheckCircle } from "@/components/auth/auth-ui";
import { FancyButton } from "@/components/ui/fancy-button";
import { getStudentLoginEmail, resetStudentPassword, createStudentLogin } from "../actions";

export function StudentCredentialsDialog({
  studentId, studentName, onClose,
}: {
  studentId: string;
  studentName: string;
  onClose: () => void;
}) {
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealFlash, setRevealFlash] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getStudentLoginEmail(studentId)
      .then((r) => { if (!cancelled) setEmail(r.email); })
      .catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [studentId]);

  async function handleAction() {
    setBusy(true);
    setError(null);
    try {
      const result = email
        ? await resetStudentPassword(studentId)
        : await createStudentLogin(studentId);
      setEmail(result.email);
      setPassword(result.password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function handleReveal() {
    setRevealFlash(true);
    setTimeout(() => setRevealFlash(false), 1600);
  }

  function copyAll() {
    if (!email) return;
    let text = `Student login\nEmail: ${email}`;
    if (password) text += `\nPassword: ${password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600 dark:text-primary-400">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Login credentials</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{studentName}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400 dark:text-zinc-500" />
          </div>
        ) : (
          <>
            <div className="mt-3 space-y-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 p-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 dark:text-zinc-400 w-16 shrink-0">Email</span>
                <span className="font-mono text-gray-800 dark:text-zinc-200 truncate">
                  {email ?? "No account yet"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 dark:text-zinc-400 w-16 shrink-0">Password</span>
                {password ? (
                  <span className="font-mono text-gray-800 dark:text-zinc-200">{password}</span>
                ) : email ? (
                  <>
                    <span className="font-mono tracking-widest text-gray-400 dark:text-zinc-500">••••••••</span>
                    <button
                      type="button"
                      onClick={handleReveal}
                      className="ml-auto flex items-center gap-1 rounded-md bg-gray-100 dark:bg-zinc-700/60 px-2 py-1 text-[11px] font-medium text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700 hover:text-gray-800 dark:hover:text-zinc-200 transition-colors"
                    >
                      <Eye className="h-3 w-3" /> Reveal
                    </button>
                  </>
                ) : (
                  <span className="text-gray-400 dark:text-zinc-500">—</span>
                )}
              </div>
            </div>

            {error && <p className="mt-2 text-xs text-red-500 dark:text-red-400">{error}</p>}

            <p
              className={`mt-3 rounded-md px-2 py-1 -mx-2 text-[11px] transition-colors duration-300 ${
                revealFlash
                  ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  : "text-gray-400 dark:text-zinc-500"
              }`}
            >
              {password
                ? "Share this with the student — it won't be shown again."
                : email
                ? "Passwords aren't stored in plain text, so existing ones can't be revealed — reset to generate a new one."
                : "This student doesn't have a login account yet — create one to generate credentials."}
            </p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleAction}
                disabled={busy}
                className="flex flex-1 h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : email ? (
                  <RefreshCw className="h-3.5 w-3.5" />
                ) : (
                  <UserPlus className="h-3.5 w-3.5" />
                )}
                {email ? "Reset Password" : "Create Login"}
              </button>
              <button
                type="button"
                onClick={copyAll}
                disabled={!email}
                className={`flex flex-1 h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-medium disabled:opacity-50 transition-colors ${
                  copied
                    ? "border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700"
                }`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {copied ? (
                    <motion.span
                      key="copied"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-1.5"
                    >
                      <AnimatedCheckCircle className="h-3.5 w-3.5" />
                      Copied!
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-1.5"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
            <FancyButton type="button" onClick={onClose} size="sm" className="mt-2 w-full">
              Done
            </FancyButton>
          </>
        )}
      </div>
    </div>
  );
}
