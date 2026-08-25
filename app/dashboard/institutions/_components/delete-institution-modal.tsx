"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2, X, KeyRound } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { OtpInput } from "@/components/auth/auth-ui";
import { requestInstitutionDeleteOtp, confirmInstitutionDelete } from "../actions";

// Trigger + modal in one — drop this next to InstitutionActions on the
// detail page. Only rendered server-side for kernel Owners; the server
// actions enforce the same gate independently.
export function DeleteInstitutionButton({ institutionId, institutionName, schoolCount }: { institutionId: string; institutionName: string; schoolCount: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" /> Delete Institution
      </button>
      <DeleteInstitutionModal
        open={open}
        onClose={() => setOpen(false)}
        institutionId={institutionId}
        institutionName={institutionName}
        schoolCount={schoolCount}
      />
    </>
  );
}

interface DeleteInstitutionModalProps {
  open: boolean;
  onClose: () => void;
  institutionId: string;
  institutionName: string;
  schoolCount: number;
}

type Step = "warn" | "otp" | "done";

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-500/20";

export function DeleteInstitutionModal({ open, onClose, institutionId, institutionName, schoolCount }: DeleteInstitutionModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("warn");
  const [confirmText, setConfirmText] = useState("");
  const [otp, setOtp] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function reset() {
    setStep("warn");
    setConfirmText("");
    setOtp("");
    setOtpEmail("");
    setError(null);
  }

  function handleClose() {
    if (busy) return;
    reset();
    onClose();
  }

  async function sendCode() {
    setBusy(true);
    setError(null);
    try {
      const res = await requestInstitutionDeleteOtp(institutionId);
      setOtpEmail(res.email);
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send verification code");
    } finally {
      setBusy(false);
    }
  }

  async function verifyAndDelete() {
    if (otp.length !== 6) return;
    setBusy(true);
    setError(null);
    try {
      await confirmInstitutionDelete(institutionId, otp);
      setStep("done");
      router.push("/dashboard/institutions");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete institution");
    } finally {
      setBusy(false);
    }
  }

  const nameMatches = confirmText.trim() === institutionName.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
            <Trash2 className="h-4 w-4" /> Delete Institution
          </p>
          <button onClick={handleClose} disabled={busy} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 disabled:opacity-40">
            <X className="h-4 w-4" />
          </button>
        </div>

        {step === "warn" && (
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-3.5 py-3 text-sm text-red-700 dark:text-red-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="space-y-1">
                <p>This permanently deletes <strong>{institutionName}</strong> and {schoolCount === 1 ? "its school" : `all ${schoolCount} of its schools`} — students, staff records, parents, fees, exams, and every other record. This can&apos;t be undone.</p>
                <p className="text-xs text-red-600/80 dark:text-red-400/80">Login accounts (owner, staff, students, parents, drivers) are kept — only this institution&apos;s data is removed.</p>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">
                Type <span className="font-semibold text-gray-700 dark:text-zinc-300">{institutionName}</span> to confirm
              </label>
              <input className={inputClass} value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoFocus />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={handleClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
                Cancel
              </button>
              <FancyButton onClick={sendCode} disabled={!nameMatches || busy} size="sm" className="!bg-red-600 !border-red-700 hover:!bg-red-700">
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Send verification code
              </FancyButton>
            </div>
          </div>
        )}

        {step === "otp" && (
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-zinc-400">
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-gray-400 dark:text-zinc-500" />
              <p>Enter the 6-digit code sent to <strong className="text-gray-900 dark:text-zinc-100">{otpEmail}</strong>. It expires in 10 minutes.</p>
            </div>

            <OtpInput value={otp} onChange={setOtp} length={6} />

            {error && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button type="button" onClick={sendCode} disabled={busy} className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-40">
                Resend code
              </button>
              <div className="flex gap-2">
                <button type="button" onClick={handleClose} disabled={busy} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
                  Cancel
                </button>
                <FancyButton onClick={verifyAndDelete} disabled={otp.length !== 6 || busy} size="sm" className="!bg-red-600 !border-red-700 hover:!bg-red-700">
                  {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Verify & delete
                </FancyButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
