import { XCircle, LogOut, Mail, Phone, Pencil } from "lucide-react";
import { BgGrid } from "@/components/ui/bg-grid";
import { FancyButton } from "@/components/ui/fancy-button";
import { signOut } from "../actions";

export function RejectedScreen({ schoolName }: { schoolName: string }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gray-50 dark:bg-zinc-950 p-4">
      <BgGrid />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 ring-1 ring-red-500/30">
          <XCircle className="h-8 w-8 text-red-500" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-zinc-50">
          Your application was not approved
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
          We reviewed the application for{" "}
          <span className="font-medium text-gray-800 dark:text-zinc-200">{schoolName}</span> and were
          unable to approve it. You can fix your details and resubmit, or reach out below.
        </p>

        <FancyButton href="/onboarding" size="sm" className="mt-5 w-full">
          <Pencil className="h-3.5 w-3.5" /> Edit and resubmit
        </FancyButton>

        <div className="mt-6 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 p-4 text-left text-sm text-gray-600 dark:text-zinc-400">
          <p className="mb-2 font-medium text-gray-800 dark:text-zinc-200">Contact us</p>
          <a href="mailto:support@shikshaloy.com" className="flex items-center gap-2 py-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            <Mail className="h-3.5 w-3.5" /> support@shikshaloy.com
          </a>
          <a href="tel:+911234567890" className="flex items-center gap-2 py-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            <Phone className="h-3.5 w-3.5" /> +91 12345 67890
          </a>
        </div>

        <form action={signOut} className="mt-6 border-t border-gray-100 dark:border-zinc-800 pt-5">
          <button
            type="submit"
            className="mx-auto flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-50 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
