import { Clock3, LogOut, Mail, Phone } from "lucide-react";
import { AuthChrome } from "@/components/auth/auth-ui";
import { signOut } from "../actions";

export function PendingReviewScreen({ schoolName }: { schoolName: string }) {
  return (
    <AuthChrome>
      <div className="w-full rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/30">
          <Clock3 className="h-8 w-8 text-amber-500" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-zinc-50">
          Your account is under verification
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
          Thanks for setting up <span className="font-medium text-gray-800 dark:text-zinc-200">{schoolName}</span>.
          Our team is reviewing your application and will email you as soon as it&apos;s approved.
        </p>

        <div className="mt-6 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 p-4 text-left text-sm text-gray-600 dark:text-zinc-400">
          <p className="mb-2 font-medium text-gray-800 dark:text-zinc-200">Need it sooner?</p>
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
    </AuthChrome>
  );
}
