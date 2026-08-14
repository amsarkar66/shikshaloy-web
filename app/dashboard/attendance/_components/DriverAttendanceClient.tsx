"use client";

import { useMemo, useState, useTransition } from "react";
import { Bus, MapPin, Sunrise, Sunset, UserCheck, UserX, TrendingUp } from "lucide-react";
import type { DriverRoute, DriverRosterStudent } from "@/lib/drivers/context";
import { markTransportAttendance } from "../actions";

export type TripStatus = "present" | "absent";
export type Trip = "morning" | "evening";

const STATUS: Record<TripStatus, { label: string; active: string; ghost: string }> = {
  present: { label: "Present", active: "bg-emerald-500 text-white border-emerald-500", ghost: "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400" },
  absent:  { label: "Absent",  active: "bg-red-500 text-white border-red-500",         ghost: "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:border-red-400 hover:text-red-600 dark:hover:text-red-400" },
};

const AVATAR_COLORS = ["bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500"];
function avatarColor(id: string) { const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0); return AVATAR_COLORS[n % AVATAR_COLORS.length]; }
function initials(name: string) { return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase(); }

function formatLong(d: string) { return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }

function StatsRow({ present, absent, total }: { present: number; absent: number; total: number }) {
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;
  const items = [
    { label: "Present",         value: present,   icon: UserCheck,   accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Absent",          value: absent,     icon: UserX,       accent: "text-red-500     bg-red-500/10"     },
    { label: "Boarding Rate",   value: `${rate}%`, icon: TrendingUp,  accent: "text-teal-500    bg-teal-500/10"     },
  ];
  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((s) => (
        <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}><s.icon className="h-5 w-5" /></div>
          <div><p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p><p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p></div>
        </div>
      ))}
    </div>
  );
}

export default function DriverAttendanceClient({
  routes, todayAttendance, date,
}: {
  routes: DriverRoute[];
  todayAttendance: Record<string, TripStatus>;
  date: string;
}) {
  const [routeId, setRouteId] = useState(routes[0]?.id ?? "");
  const [trip, setTrip] = useState<Trip>("morning");
  const [statusMap, setStatusMap] = useState<Record<string, TripStatus>>(todayAttendance);
  const [, startTransition] = useTransition();

  const route = routes.find((r) => r.id === routeId) ?? routes[0];

  const rosterByStop = useMemo(() => {
    const grouped: Record<string, DriverRosterStudent[]> = {};
    if (!route) return grouped;
    for (const s of route.roster) {
      if (!grouped[s.stopName]) grouped[s.stopName] = [];
      grouped[s.stopName].push(s);
    }
    return grouped;
  }, [route]);

  function keyFor(studentId: string, t: Trip) { return `${studentId}:${t}`; }

  function setStatus(studentId: string, status: TripStatus) {
    const key = keyFor(studentId, trip);
    setStatusMap((prev) => ({ ...prev, [key]: status }));
    startTransition(async () => {
      await markTransportAttendance(studentId, route!.id, date, trip, status);
    });
  }

  if (!route) return null;

  const rosterStatuses = route.roster.map((s) => statusMap[keyFor(s.id, trip)] ?? "present");
  const present = rosterStatuses.filter((s) => s === "present").length;
  const absent  = rosterStatuses.filter((s) => s === "absent").length;

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Trip Attendance</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">{formatLong(date)}</p>
        </div>
        <div className="flex items-center gap-2">
          {routes.length > 1 && (
            <select
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
            >
              {routes.map((r) => <option key={r.id} value={r.id}>{r.routeNo} · {r.routeName}</option>)}
            </select>
          )}
          <div className="flex items-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1">
            <button
              onClick={() => setTrip("morning")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${trip === "morning" ? "bg-teal-500 text-white" : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}
            >
              <Sunrise className="h-3.5 w-3.5" /> Morning
            </button>
            <button
              onClick={() => setTrip("evening")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${trip === "evening" ? "bg-teal-500 text-white" : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}
            >
              <Sunset className="h-3.5 w-3.5" /> Evening
            </button>
          </div>
        </div>
      </div>

      <StatsRow present={present} absent={absent} total={route.roster.length} />

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-zinc-700/50 px-5 py-3">
          <Bus className="h-4 w-4 text-teal-500" />
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{route.routeNo} · {route.routeName}</p>
          <span className="ml-auto text-xs text-gray-400 dark:text-zinc-500">{route.roster.length} students</span>
        </div>

        {route.roster.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400 dark:text-zinc-500">No students on this route</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {route.stops.filter((stop) => rosterByStop[stop]?.length).map((stop) => (
              <div key={stop} className="px-5 py-4">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-zinc-400">
                  <MapPin className="h-3 w-3" /> {stop}
                </p>
                <div className="space-y-2">
                  {rosterByStop[stop].map((s) => {
                    const status = statusMap[keyFor(s.id, trip)] ?? "present";
                    return (
                      <div key={s.id} className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(s.id)}`}>{initials(s.fullName)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{s.fullName}</p>
                          <p className="text-xs text-gray-400 dark:text-zinc-500">Roll {s.rollNo} · Class {s.classNum}-{s.section}</p>
                        </div>
                        <div className="flex shrink-0 gap-1.5">
                          {(Object.keys(STATUS) as TripStatus[]).map((st) => (
                            <button
                              key={st}
                              onClick={() => setStatus(s.id, st)}
                              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${status === st ? STATUS[st].active : STATUS[st].ghost}`}
                            >
                              {STATUS[st].label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
