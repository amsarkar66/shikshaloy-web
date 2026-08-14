"use client";

import { useMemo, useState } from "react";
import { Bus, MapPin, Users, Phone, Search, Wrench, Calendar } from "lucide-react";
import type { DriverRoute } from "@/lib/drivers/context";

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500",
];

function avatarColor(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function formatTime(t: string | null) {
  if (!t) return "—";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const FUEL_ICON: Record<string, string> = { diesel: "⛽", cng: "🟢", electric: "⚡" };

const ROUTE_STATUS_BADGE: Record<string, string> = {
  active:   "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  inactive: "bg-gray-100      text-gray-500    dark:text-zinc-400    border-gray-200 dark:border-zinc-700",
};

const VEHICLE_STATUS_BADGE: Record<string, string> = {
  active:      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  maintenance: "bg-amber-500/10  text-amber-600   dark:text-amber-400   border-amber-500/20",
  inactive:    "bg-gray-100      text-gray-500    dark:text-zinc-400    border-gray-200 dark:border-zinc-700",
};

function StatsRow({ routes }: { routes: DriverRoute[] }) {
  const totalStudents = routes.reduce((s, r) => s + r.roster.length, 0);
  const totalStops = new Set(routes.flatMap((r) => r.stops)).size;
  const items = [
    { label: "Assigned Routes",  value: routes.length,   icon: MapPin, accent: "text-indigo-500 bg-indigo-500/10" },
    { label: "Total Stops",      value: totalStops,      icon: MapPin, accent: "text-teal-500   bg-teal-500/10"   },
    { label: "Students Onboard", value: totalStudents,   icon: Users,  accent: "text-blue-500    bg-blue-500/10"   },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((s) => (
        <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}><s.icon className="h-5 w-5" /></div>
          <div><p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p><p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p></div>
        </div>
      ))}
    </div>
  );
}

function RouteCard({ route, query }: { route: DriverRoute; query: string }) {
  const q = query.trim().toLowerCase();
  const rosterByStop = useMemo(() => {
    const filtered = q
      ? route.roster.filter((s) =>
          s.fullName.toLowerCase().includes(q) ||
          s.rollNo.toLowerCase().includes(q) ||
          s.stopName.toLowerCase().includes(q)
        )
      : route.roster;
    const grouped: Record<string, typeof filtered> = {};
    for (const s of filtered) {
      if (!grouped[s.stopName]) grouped[s.stopName] = [];
      grouped[s.stopName].push(s);
    }
    return grouped;
  }, [route.roster, q]);

  const fill = route.capacity ? Math.round((route.roster.length / route.capacity) * 100) : 0;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-zinc-700/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-500/10 dark:bg-teal-500/20">
            <Bus className="h-5 w-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{route.routeName || route.routeNo}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">{route.routeNo} · {route.stops.length} stops</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500 dark:text-zinc-400 text-right">
            <p>↑ Morning {formatTime(route.morningDeparture)}</p>
            <p>↓ Evening {formatTime(route.eveningDeparture)}</p>
          </div>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${ROUTE_STATUS_BADGE[route.status] ?? ""}`}>{route.status}</span>
        </div>
      </div>

      {route.vehicle && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-gray-100 dark:border-zinc-700/50 px-5 py-4 bg-gray-50/50 dark:bg-zinc-900/30">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-zinc-500">Vehicle</p>
            <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{route.vehicle.regNo}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">{route.vehicle.model}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-zinc-500">Capacity</p>
            <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{route.roster.length}/{route.vehicle.capacity || route.capacity}</p>
            <div className="mt-1 h-1.5 w-20 rounded-full bg-gray-100 dark:bg-zinc-700">
              <div className={`h-1.5 rounded-full ${fill >= 90 ? "bg-amber-500" : "bg-teal-500"}`} style={{ width: `${Math.min(fill, 100)}%` }} />
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-zinc-500">Fuel &amp; Status</p>
            <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 flex items-center gap-1">
              <span>{FUEL_ICON[route.vehicle.fuelType] ?? "⛽"}</span> <span className="capitalize">{route.vehicle.fuelType}</span>
            </p>
            <span className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${VEHICLE_STATUS_BADGE[route.vehicle.status] ?? ""}`}>{route.vehicle.status}</span>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-zinc-500 flex items-center gap-1"><Wrench className="h-3 w-3" /> Next Service</p>
            <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gray-400 dark:text-zinc-500" /> {formatDate(route.vehicle.nextService)}
            </p>
          </div>
        </div>
      )}

      <div className="px-5 py-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Stop Sequence</p>
        <div className="flex flex-wrap items-center gap-0 mb-5">
          {route.stops.map((stop, idx) => (
            <div key={stop} className="flex items-center gap-0">
              <div className="flex items-center gap-1.5 rounded-lg bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 px-3 py-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-teal-500 text-[9px] font-bold text-white shrink-0">{idx + 1}</span>
                <span className="text-xs font-medium text-gray-700 dark:text-zinc-300 whitespace-nowrap">{stop}</span>
              </div>
              {idx < route.stops.length - 1 && <div className="w-6 h-px bg-teal-300 dark:bg-teal-700" />}
            </div>
          ))}
        </div>

        {Object.keys(rosterByStop).length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">No students match this search</p>
        ) : (
          <div className="space-y-4">
            {route.stops
              .filter((stop) => rosterByStop[stop]?.length)
              .map((stop) => (
                <div key={stop}>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-zinc-400">
                    <MapPin className="h-3 w-3" /> {stop} <span className="text-gray-300 dark:text-zinc-600">· {rosterByStop[stop].length}</span>
                  </p>
                  <div className="divide-y divide-gray-100 dark:divide-zinc-700/50 rounded-lg border border-gray-100 dark:border-zinc-700/50">
                    {rosterByStop[stop].map((s) => (
                      <div key={s.id} className="flex items-center gap-3 px-3 py-2.5">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(s.id)}`}>{initials(s.fullName)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{s.fullName}</p>
                          <p className="text-xs text-gray-400 dark:text-zinc-500">Roll {s.rollNo} · Class {s.classNum}-{s.section}</p>
                        </div>
                        {s.phone !== "—" && (
                          <a href={`tel:${s.phone}`} className="shrink-0 flex items-center gap-1 text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline">
                            <Phone className="h-3 w-3" /> {s.phone}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoutesClient({ routes }: { routes: DriverRoute[] }) {
  const [query, setQuery] = useState("");

  if (routes.length === 0) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-2xl">🚌</div>
          <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">No route assigned yet</p>
          <p className="max-w-sm text-sm text-gray-500 dark:text-zinc-400">Your school admin hasn&apos;t assigned you to a transport route.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">My Routes</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Route, vehicle, and student roster details</p>
        </div>
        <div className="relative w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student, roll no, stop…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      </div>

      <StatsRow routes={routes} />

      <div className="space-y-5">
        {routes.map((r) => <RouteCard key={r.id} route={r} query={query} />)}
      </div>
    </div>
  );
}
