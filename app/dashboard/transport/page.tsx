"use client";

import { useState, useMemo } from "react";
import {
  Bus, Users, MapPin, Wrench, Search, Plus, Download,
  X, Phone, ChevronDown, ChevronUp, Eye, Pencil,
  AlertCircle, CheckCircle2, Clock, Fuel,
} from "lucide-react";
import {
  ALL_ROUTES, ALL_VEHICLES, ALL_STUDENT_TRANSPORT,
  avatarColor, initials,
  FEE_BADGE, VEHICLE_STATUS_BADGE, ROUTE_STATUS_BADGE,
  type TransportFeeStatus, type VehicleStatus, type RouteStatus,
} from "./_data/transport";

// ── Stats ─────────────────────────────────────────────────────────────────────

function StatsRow() {
  const totalRoutes   = ALL_ROUTES.length;
  const activeVehicles = ALL_VEHICLES.filter((v) => v.status === "active").length;
  const enrolled      = ALL_STUDENT_TRANSPORT.length;
  const feeOverdue    = ALL_STUDENT_TRANSPORT.filter((s) => s.feeStatus === "overdue").length;

  const items = [
    { label: "Total Routes",    value: totalRoutes,    icon: MapPin,       accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Active Vehicles", value: activeVehicles, icon: Bus,          accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Students Enrolled", value: enrolled,     icon: Users,        accent: "text-blue-500    bg-blue-500/10"    },
    { label: "Fee Overdue",     value: feeOverdue,     icon: AlertCircle,  accent: "text-red-500     bg-red-500/10"     },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s) => (
        <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}>
            <s.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Routes tab ────────────────────────────────────────────────────────────────

function RouteRow({ route }: { route: typeof ALL_ROUTES[0] }) {
  const [open, setOpen] = useState(false);
  const fill = Math.round((route.studentCount / route.capacity) * 100);
  const fillColor = fill >= 90 ? "bg-amber-500" : "bg-indigo-500";

  return (
    <>
      <tr
        className="hover:bg-gray-50 dark:hover:bg-zinc-700/30 cursor-pointer transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        {/* Route */}
        <td className="py-3 pl-4 pr-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20">
              <Bus className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-zinc-100 text-sm leading-tight">{route.routeName}</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500">{route.routeNo} · {route.busNo}</p>
            </div>
          </div>
        </td>

        {/* Driver */}
        <td className="px-3 py-3">
          <p className="text-sm text-gray-700 dark:text-zinc-300">{route.driver}</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500">{route.driverPhone}</p>
        </td>

        {/* Stops */}
        <td className="px-3 py-3">
          <span className="text-sm text-gray-600 dark:text-zinc-400">{route.stops.length} stops</span>
        </td>

        {/* Occupancy */}
        <td className="px-3 py-3">
          <div className="flex items-center gap-2 min-w-[110px]">
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
              <div className={`h-1.5 rounded-full ${fillColor}`} style={{ width: `${fill}%` }} />
            </div>
            <span className="text-xs font-semibold tabular-nums text-gray-700 dark:text-zinc-300">
              {route.studentCount}/{route.capacity}
            </span>
          </div>
        </td>

        {/* Timings */}
        <td className="px-3 py-3 text-xs text-gray-500 dark:text-zinc-400">
          <p>↑ {route.morningDeparture}</p>
          <p>↓ {route.eveningDeparture}</p>
        </td>

        {/* Status */}
        <td className="px-3 py-3">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${ROUTE_STATUS_BADGE[route.status]}`}>
            {route.status}
          </span>
        </td>

        {/* Expand */}
        <td className="py-3 pl-3 pr-4 text-right">
          <button className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors ml-auto">
            {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </td>
      </tr>

      {open && (
        <tr className="bg-indigo-50/40 dark:bg-indigo-500/5">
          <td colSpan={7} className="px-6 py-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-3">Stop Sequence</p>
              <div className="flex flex-wrap items-center gap-0">
                {route.stops.map((stop, idx) => (
                  <div key={stop} className="flex items-center gap-0">
                    <div className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-3 py-1.5">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-500 text-[9px] font-bold text-white shrink-0">{idx + 1}</span>
                      <span className="text-xs font-medium text-gray-700 dark:text-zinc-300 whitespace-nowrap">{stop}</span>
                    </div>
                    {idx < route.stops.length - 1 && (
                      <div className="w-6 h-px bg-indigo-300 dark:bg-indigo-700" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function RoutesTab() {
  const [query, setQuery]         = useState("");
  const [statusFilter, setStatus] = useState<"all" | RouteStatus>("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return ALL_ROUTES.filter((r) => {
      const matchQ = !q || r.routeName.toLowerCase().includes(q) || r.routeNo.toLowerCase().includes(q) || r.driver.toLowerCase().includes(q) || r.busNo.toLowerCase().includes(q);
      const matchS = statusFilter === "all" || r.status === statusFilter;
      return matchQ && matchS;
    });
  }, [query, statusFilter]);

  const hasFilter = query || statusFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search route, driver or bus…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-1">
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`h-9 rounded-lg px-3 text-sm font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
              }`}
            >
              {s === "all" ? "All Status" : s}
            </button>
          ))}
          {hasFilter && (
            <button
              onClick={() => { setQuery(""); setStatus("all"); }}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <button className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition-colors shrink-0 sm:ml-auto">
          <Plus className="h-4 w-4" /> Add Route
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                {["Route", "Driver", "Stops", "Occupancy", "Timings", "Status", ""].map((h) => (
                  <th key={h} className={`py-3 ${h === "Route" ? "pl-4 pr-3" : h === "" ? "pl-3 pr-4" : "px-3"} text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <MapPin className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
                      <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No routes found</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((route) => (
                <RouteRow key={route.id} route={route} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Vehicles tab ──────────────────────────────────────────────────────────────

const FUEL_ICON: Record<string, string> = {
  diesel:   "⛽",
  cng:      "🟢",
  electric: "⚡",
};

function VehiclesTab() {
  const [query,        setQuery]  = useState("");
  const [statusFilter, setStatus] = useState<"all" | VehicleStatus>("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return ALL_VEHICLES.filter((v) => {
      const matchQ = !q || v.regNo.toLowerCase().includes(q) || v.model.toLowerCase().includes(q) || v.driver.toLowerCase().includes(q);
      const matchS = statusFilter === "all" || v.status === statusFilter;
      return matchQ && matchS;
    });
  }, [query, statusFilter]);

  const hasFilter = query || statusFilter !== "all";

  function serviceUrgency(dateStr: string) {
    const due = new Date(dateStr);
    const now = new Date("2026-06-23");
    const days = Math.round((due.getTime() - now.getTime()) / 86400000);
    if (days < 0)   return { label: "Overdue",         cls: "text-red-600 dark:text-red-400" };
    if (days < 30)  return { label: `${days}d left`,   cls: "text-amber-600 dark:text-amber-400" };
    return               { label: `${days}d left`,     cls: "text-gray-500 dark:text-zinc-400" };
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search registration, model or driver…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-1">
          {(["all", "active", "maintenance", "inactive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`h-9 rounded-lg px-3 text-sm font-medium capitalize transition-colors ${
                statusFilter === s
                  ? "bg-indigo-500 text-white shadow-sm"
                  : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
          {hasFilter && (
            <button
              onClick={() => { setQuery(""); setStatus("all"); }}
              className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <button className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition-colors shrink-0 sm:ml-auto">
          <Plus className="h-4 w-4" /> Add Vehicle
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                {["Vehicle", "Model", "Driver", "Capacity", "Fuel", "Next Service", "Status", ""].map((h) => (
                  <th key={h} className={`py-3 ${h === "Vehicle" ? "pl-4 pr-3" : h === "" ? "pl-3 pr-4 text-right" : "px-3"} text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Bus className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
                      <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No vehicles found</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((v) => {
                const svc = serviceUrgency(v.nextService);
                return (
                  <tr key={v.id} className={`hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors ${v.status === "maintenance" ? "bg-amber-50/30 dark:bg-amber-500/5" : ""}`}>

                    <td className="py-3 pl-4 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/10">
                          <Bus className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-zinc-100 text-sm leading-tight font-mono">{v.regNo}</p>
                          <p className="text-xs text-gray-400 dark:text-zinc-500">{v.year}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3 py-3 text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{v.model}</td>

                    <td className="px-3 py-3 text-sm text-gray-700 dark:text-zinc-300">
                      {v.driver === "—" ? <span className="text-gray-400 dark:text-zinc-500">Unassigned</span> : v.driver}
                    </td>

                    <td className="px-3 py-3 text-sm font-medium text-gray-700 dark:text-zinc-300 tabular-nums">
                      {v.capacity}
                    </td>

                    <td className="px-3 py-3">
                      <span className="text-sm">{FUEL_ICON[v.fuelType]}</span>
                      <span className="ml-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 capitalize">{v.fuelType}</span>
                    </td>

                    <td className="px-3 py-3">
                      <p className="text-xs text-gray-600 dark:text-zinc-400">{v.nextService}</p>
                      <p className={`text-xs font-medium ${svc.cls}`}>{svc.label}</p>
                    </td>

                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${VEHICLE_STATUS_BADGE[v.status]}`}>
                        {v.status}
                      </span>
                    </td>

                    <td className="py-3 pl-3 pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <button className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fleet summary */}
      <div className="grid grid-cols-3 gap-4">
        {(["active", "maintenance", "inactive"] as VehicleStatus[]).map((s) => {
          const count = ALL_VEHICLES.filter((v) => v.status === s).length;
          const colors: Record<VehicleStatus, string> = {
            active:      "border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-500/5 text-emerald-700 dark:text-emerald-400",
            maintenance: "border-amber-200  dark:border-amber-900  bg-amber-50/50  dark:bg-amber-500/5  text-amber-700  dark:text-amber-400",
            inactive:    "border-gray-200   dark:border-zinc-700   bg-gray-50      dark:bg-zinc-800/50  text-gray-600   dark:text-zinc-400",
          };
          return (
            <div key={s} className={`rounded-xl border p-4 text-center ${colors[s]}`}>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs font-semibold capitalize mt-0.5">{s}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Students tab ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

function StudentsTab() {
  const [query,        setQuery]  = useState("");
  const [routeFilter,  setRoute]  = useState("all");
  const [feeFilter,    setFee]    = useState<"all" | TransportFeeStatus>("all");
  const [page,         setPage]   = useState(1);

  const routeOptions = useMemo(() => {
    const set = new Set(ALL_STUDENT_TRANSPORT.map((s) => s.routeNo));
    return ALL_ROUTES.filter((r) => set.has(r.routeNo));
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return ALL_STUDENT_TRANSPORT.filter((s) => {
      const matchQ = !q || s.studentName.toLowerCase().includes(q) || s.rollNo.includes(q) || s.parent.toLowerCase().includes(q) || s.stop.toLowerCase().includes(q);
      const matchR = routeFilter === "all" || s.routeNo === routeFilter;
      const matchF = feeFilter   === "all" || s.feeStatus === feeFilter;
      return matchQ && matchR && matchF;
    });
  }, [query, routeFilter, feeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilter  = query || routeFilter !== "all" || feeFilter !== "all";

  function clearFilters() { setQuery(""); setRoute("all"); setFee("all"); setPage(1); }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search student, roll no, parent or stop…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <select
          value={routeFilter}
          onChange={(e) => { setRoute(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all">All Routes</option>
          {routeOptions.map((r) => (
            <option key={r.routeNo} value={r.routeNo}>{r.routeNo} — {r.routeName}</option>
          ))}
        </select>

        <select
          value={feeFilter}
          onChange={(e) => { setFee(e.target.value as "all" | TransportFeeStatus); setPage(1); }}
          className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all">All Fee Status</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="overdue">Overdue</option>
        </select>

        {hasFilter && (
          <button
            onClick={clearFilters}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}

        <div className="flex gap-2 sm:ml-auto">
          <button className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition-colors">
            <Plus className="h-4 w-4" /> Assign Student
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-zinc-500">
          Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of{" "}
          <span className="font-medium text-gray-700 dark:text-zinc-300">{ALL_STUDENT_TRANSPORT.length}</span> students
        </p>
        {hasFilter && <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Filters active</span>}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                {["Student", "Class", "Route", "Stop", "Monthly Fee", "Fee Status", "Actions"].map((h) => (
                  <th key={h} className={`py-3 ${h === "Student" ? "pl-4 pr-3" : h === "Actions" ? "pl-3 pr-4 text-right" : "px-3"} text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
                      <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No students found</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : pageData.map((s) => (
                <tr key={s.id} className={`hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors ${s.feeStatus === "overdue" ? "bg-red-50/30 dark:bg-red-500/5" : ""}`}>

                  <td className="py-3 pl-4 pr-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(s.id)}`}>
                        {initials(s.studentName)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{s.studentName}</p>
                        <p className="text-xs text-gray-400 dark:text-zinc-500">{s.rollNo}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                      {s.class}–{s.section}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">{s.route}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{s.routeNo}</p>
                  </td>

                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-gray-400 dark:text-zinc-500 shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{s.stop}</span>
                    </div>
                  </td>

                  <td className="px-3 py-3 text-sm font-medium text-gray-700 dark:text-zinc-300 tabular-nums">
                    ₹{s.monthlyFee.toLocaleString("en-IN")}
                  </td>

                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${FEE_BADGE[s.feeStatus]}`}>
                      {s.feeStatus}
                    </span>
                  </td>

                  <td className="py-3 pl-3 pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={`tel:${s.phone}`}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
                        title="Call parent"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                      <button className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-zinc-400">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors text-xs"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                    page === n
                      ? "bg-indigo-500 text-white"
                      : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors text-xs"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = "routes" | "vehicles" | "students";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "routes",   label: "Routes",   icon: MapPin  },
  { id: "vehicles", label: "Vehicles", icon: Bus     },
  { id: "students", label: "Students", icon: Users   },
];

export default function TransportPage() {
  const [activeTab, setTab] = useState<Tab>("routes");

  return (
    <div className="w-full px-6 py-6 space-y-5">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Transport</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Manage routes, fleet, and student assignments</p>
        </div>
        <button className="sm:ml-auto flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
          <Download className="h-3.5 w-3.5" /> Export Report
        </button>
      </div>

      <StatsRow />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === id
                ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:border-gray-300 dark:hover:border-zinc-600"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "routes"   && <RoutesTab />}
      {activeTab === "vehicles" && <VehiclesTab />}
      {activeTab === "students" && <StudentsTab />}
    </div>
  );
}
