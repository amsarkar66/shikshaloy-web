import Link from "next/link";
import { MapPin, Clock, ArrowRight } from "lucide-react";
import type { PublicEvent, PublicSchool } from "@/lib/domains/public-site-data";
import { formatDateShort } from "../_lib/format";
import { RevealStagger, RevealItem } from "./Reveal";

const TYPE_STYLE: Record<PublicEvent["type"], string> = {
  holiday: "bg-red-50 text-red-600 border-red-200",
  exam: "bg-violet-50 text-violet-600 border-violet-200",
  meeting: "bg-blue-50 text-blue-600 border-blue-200",
  sports: "bg-emerald-50 text-emerald-600 border-emerald-200",
  cultural: "bg-pink-50 text-pink-600 border-pink-200",
  workshop: "bg-amber-50 text-amber-600 border-amber-200",
  other: "bg-gray-100 text-gray-600 border-gray-200",
};

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function Events({
  school,
  limit,
  bare,
}: {
  school: PublicSchool;
  limit?: number;
  bare?: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const sorted = [...school.events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const upcoming = sorted.filter((e) => e.date >= today);
  const ordered = limit ? [...upcoming, ...sorted.filter((e) => e.date < today)] : sorted;
  const items = limit ? ordered.slice(0, limit) : ordered;

  const body = (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
        {limit && sorted.length > limit && (
          <Link
            href="/events"
            className="flex items-center gap-1 text-sm font-semibold text-primary-600 hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">No events published yet.</p>
      ) : (
        <RevealStagger className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((e) => {
            const { day, month } = formatDateShort(e.date);
            return (
              <RevealItem key={e.id}>
                <div className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-lg bg-primary-500 text-white">
                    <span className="text-lg font-bold leading-none">{day}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide">{month}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{e.title}</h3>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${TYPE_STYLE[e.type]}`}>
                        {e.type}
                      </span>
                    </div>
                    {e.description && <p className="mt-1 text-sm text-gray-600">{e.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {e.isAllDay ? "All day" : e.time ? formatTime(e.time) : "—"}
                      </span>
                      {e.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {e.location}
                        </span>
                      )}
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
    <section id="events" className="mx-auto max-w-5xl px-6 py-16">
      {body}
    </section>
  );
}
