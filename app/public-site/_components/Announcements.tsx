import Link from "next/link";
import { Megaphone, AlertTriangle, Info, ArrowRight } from "lucide-react";
import type { PublicAnnouncement, PublicSchool } from "@/lib/domains/public-site-data";
import { formatDate } from "../_lib/format";
import { RevealStagger, RevealItem } from "./Reveal";

const PRIORITY_STYLE: Record<PublicAnnouncement["priority"], string> = {
  urgent: "bg-red-50 text-red-600 border-red-200",
  normal: "bg-primary-50 text-primary-600 border-primary-200",
  info: "bg-sky-50 text-sky-600 border-sky-200",
};

const PRIORITY_ICON: Record<PublicAnnouncement["priority"], React.ElementType> = {
  urgent: AlertTriangle,
  normal: Megaphone,
  info: Info,
};

export function Announcements({
  school,
  limit,
  bare,
}: {
  school: PublicSchool;
  limit?: number;
  bare?: boolean;
}) {
  const sorted = [...school.announcements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const items = limit ? sorted.slice(0, limit) : sorted;

  const body = (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
        {limit && sorted.length > limit && (
          <Link
            href="/announcements"
            className="flex items-center gap-1 text-sm font-semibold text-primary-600 hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">No announcements published yet.</p>
      ) : (
        <RevealStagger className="mt-6 space-y-4">
          {items.map((a) => {
            const Icon = PRIORITY_ICON[a.priority];
            return (
              <RevealItem key={a.id}>
                <div className="rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${PRIORITY_STYLE[a.priority]}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{a.title}</h3>
                        <span className="text-xs text-gray-400">{formatDate(a.createdAt)}</span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{a.content}</p>
                    </div>
                  </div>
                </div>
              </RevealItem>
            );
          })}
        </RevealStagger>
      )}
    </>
  );

  if (bare) return body;

  return (
    <section id="announcements" className="bg-gray-50 py-16">
      <div className="mx-auto max-w-5xl px-6">{body}</div>
    </section>
  );
}
