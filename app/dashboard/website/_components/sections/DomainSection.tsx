import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, Globe, History, XCircle } from "lucide-react";
import type { DomainSummary, WebsiteActivityEntry } from "@/lib/site-settings/actions";
import { formatDateTime } from "@/app/dashboard/audit-log/_data/audit-log";

const STATUS_BADGE: Record<DomainSummary["status"], { label: string; cls: string; icon: React.ElementType }> = {
  active: { label: "Connected", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  verifying: { label: "Verifying", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: Clock },
  pending: { label: "Pending", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", icon: Clock },
  failed: { label: "Failed", cls: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20", icon: XCircle },
};

export function DomainSection({
  domain,
  activity,
}: {
  domain: DomainSummary | null;
  activity: WebsiteActivityEntry[];
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-50">Domain</h2>
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
              Where your public site is reachable. DNS and SSL setup happens in Settings.
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700"
          >
            Manage in Settings <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-4">
          {domain ? (
            <div className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 px-4 py-3">
              <Globe className="h-4 w-4 shrink-0 text-gray-400 dark:text-zinc-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-zinc-50">{domain.domain}</p>
                <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                  {domain.verifiedAt ? `Verified ${formatDateTime(domain.verifiedAt)}` : "Not verified yet"}
                  {domain.sslStatus && ` · SSL: ${domain.sslStatus}`}
                </p>
              </div>
              {(() => {
                const badge = STATUS_BADGE[domain.status];
                const Icon = badge.icon;
                return (
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${badge.cls}`}>
                    <Icon className="h-3 w-3" /> {badge.label}
                  </span>
                );
              })()}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-gray-200 dark:border-zinc-800 py-8 text-center">
              <Globe className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
              <p className="text-xs text-gray-500 dark:text-zinc-400">No custom domain connected yet.</p>
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
              >
                Connect a domain <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-50">Publishing Activity</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Recent publishes and discards across your institution.</p>

        {activity.length === 0 ? (
          <p className="mt-4 text-xs text-gray-400 dark:text-zinc-500">No activity yet — publish your first changes to see them here.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {activity.map((entry) => (
              <li key={entry.id} className="flex items-start gap-3 text-sm">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                <div className="min-w-0 flex-1">
                  <p className="text-gray-900 dark:text-zinc-50">
                    <span className="font-medium">{entry.actorName}</span>{" "}
                    <span className="text-gray-400 dark:text-zinc-500">({entry.actorRole})</span> — {entry.description}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500">{formatDateTime(entry.createdAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
