"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Bus, Users, MapPin, Search, Plus, Download,
  X, Phone, ChevronDown, ChevronUp, Pencil,
  AlertCircle,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";
import {
  avatarColor, initials, formatTime, formatDate,
  FEE_BADGE, VEHICLE_STATUS_BADGE, ROUTE_STATUS_BADGE, FUEL_ICON,
  type Route, type Vehicle, type StudentTransport, type TransportFeeStatus, type VehicleStatus, type RouteStatus,
} from "../_data/transport";
import type { DriverOption } from "../actions";
import { RouteModal } from "./RouteModal";
import { VehicleModal } from "./VehicleModal";
import { StudentTransportModal } from "./StudentTransportModal";

// ── Stats ─────────────────────────────────────────────────────────────────────

function StatsRow({ routes, vehicles, students }: { routes: Route[]; vehicles: Vehicle[]; students: StudentTransport[] }) {
  const items = [
    { label: "Total Routes",      value: routes.length,                                          icon: MapPin,      accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Active Vehicles",   value: vehicles.filter((v) => v.status === "active").length,   icon: Bus,         accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Students Enrolled", value: students.length,                                         icon: Users,       accent: "text-blue-500    bg-blue-500/10"    },
    { label: "Fee Overdue",       value: students.filter((s) => s.feeStatus === "overdue").length, icon: AlertCircle, accent: "text-red-500     bg-red-500/10"     },
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

function RouteRow({ route, onEdit }: { route: Route; onEdit: () => void }) {
  const [open, setOpen] = useState(false);
  const fill = route.capacity ? Math.round((route.studentCount / route.capacity) * 100) : 0;
  const fillColor = fill >= 90 ? "bg-amber-500" : "bg-indigo-500";

  return (
    <>
      <Tr onClick={() => setOpen((v) => !v)}>
        <Td position="first">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 dark:bg-primary-500/20">
              <Bus className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-zinc-100 text-sm leading-tight">{route.routeName}</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500">{route.routeNo}</p>
            </div>
          </div>
        </Td>
        <Td>
          <p className="text-sm text-gray-700 dark:text-zinc-300">{route.driverPhone ? route.driverPhone : <span className="text-gray-400 dark:text-zinc-500">Unassigned</span>}</p>
        </Td>
        <Td><span className="text-sm text-gray-600 dark:text-zinc-400">{route.stops.length} stops</span></Td>
        <Td>
          <div className="flex items-center gap-2 min-w-[110px]">
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
              <div className={`h-1.5 rounded-full ${fillColor}`} style={{ width: `${fill}%` }} />
            </div>
            <span className="text-xs font-semibold tabular-nums text-gray-700 dark:text-zinc-300">{route.studentCount}/{route.capacity}</span>
          </div>
        </Td>
        <Td className="text-xs text-gray-500 dark:text-zinc-400">
          <p>↑ {formatTime(route.morningDeparture)}</p>
          <p>↓ {formatTime(route.eveningDeparture)}</p>
        </Td>
        <Td>
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${ROUTE_STATUS_BADGE[route.status]}`}>{route.status}</span>
        </Td>
        <Td position="last" align="right">
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
              {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </Td>
      </Tr>
      {open && (
        <tr className="bg-primary-50/40 dark:bg-primary-500/5">
          <td colSpan={7} className="px-6 py-4">
            {route.stops.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-zinc-500">No stops configured.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 mb-3">Stop Sequence</p>
                <div className="flex flex-wrap items-center gap-0">
                  {route.stops.map((stop, idx) => (
                    <div key={stop} className="flex items-center gap-0">
                      <div className="flex items-center gap-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-3 py-1.5">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-[9px] font-bold text-white shrink-0">{idx + 1}</span>
                        <span className="text-xs font-medium text-gray-700 dark:text-zinc-300 whitespace-nowrap">{stop}</span>
                      </div>
                      {idx < route.stops.length - 1 && <div className="w-6 h-px bg-primary-300 dark:bg-primary-700" />}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function RoutesTab({ routes, onEdit }: { routes: Route[]; onEdit: (route: Route) => void }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatus] = useState<"all" | RouteStatus>("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return routes.filter((r) => {
      const matchQ = !q || r.routeName.toLowerCase().includes(q) || r.routeNo.toLowerCase().includes(q);
      const matchS = statusFilter === "all" || r.status === statusFilter;
      return matchQ && matchS;
    });
  }, [routes, query, statusFilter]);

  const hasFilter = query || statusFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search route or route number…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
        </div>
        <div className="flex items-center gap-1">
          {(["all", "active", "inactive"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`h-9 rounded-lg px-3 text-sm font-medium capitalize transition-colors ${statusFilter === s ? "bg-primary-500 text-white shadow-sm" : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}>
              {s === "all" ? "All Status" : s}
            </button>
          ))}
          {hasFilter && (
            <button onClick={() => { setQuery(""); setStatus("all"); }} className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <Table>
        <TableHead>
          <Th position="first">Route</Th>
          <Th>Driver</Th>
          <Th>Stops</Th>
          <Th>Occupancy</Th>
          <Th>Timings</Th>
          <Th>Status</Th>
          <Th position="last" />
        </TableHead>
        <TableBody>
          {filtered.length === 0 ? (
            <TableEmptyRow colSpan={7} icon={MapPin} message="No routes found" />
          ) : filtered.map((route) => <RouteRow key={route.id} route={route} onEdit={() => onEdit(route)} />)}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Vehicles tab ──────────────────────────────────────────────────────────────

function VehiclesTab({ vehicles, onAdd, onEdit }: { vehicles: Vehicle[]; onAdd: () => void; onEdit: (vehicle: Vehicle) => void }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatus] = useState<"all" | VehicleStatus>("all");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return vehicles.filter((v) => {
      const matchQ = !q || v.regNo.toLowerCase().includes(q) || v.model.toLowerCase().includes(q);
      const matchS = statusFilter === "all" || v.status === statusFilter;
      return matchQ && matchS;
    });
  }, [vehicles, query, statusFilter]);

  const hasFilter = query || statusFilter !== "all";

  function serviceInfo(v: Vehicle) {
    if (!v.nextService) return { label: "Not scheduled", cls: "text-gray-400 dark:text-zinc-500" };
    const days = Math.round((new Date(v.nextService).getTime() - Date.now()) / 86400000);
    if (days < 0) return { label: "Overdue", cls: "text-red-600 dark:text-red-400" };
    if (days < 30) return { label: `${days}d left`, cls: "text-amber-600 dark:text-amber-400" };
    return { label: `${days}d left`, cls: "text-gray-500 dark:text-zinc-400" };
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search registration or model…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
        </div>
        <div className="flex items-center gap-1">
          {(["all", "active", "maintenance", "inactive"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`h-9 rounded-lg px-3 text-sm font-medium capitalize transition-colors ${statusFilter === s ? "bg-primary-500 text-white shadow-sm" : "border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}>
              {s === "all" ? "All" : s}
            </button>
          ))}
          {hasFilter && (
            <button onClick={() => { setQuery(""); setStatus("all"); }} className="h-9 w-9 flex items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <FancyButton size="sm" className="shrink-0 sm:ml-auto" onClick={onAdd}>
          <Plus className="h-4 w-4" /> Add Vehicle
        </FancyButton>
      </div>

      <Table>
        <TableHead>
          <Th position="first">Vehicle</Th>
          <Th>Model</Th>
          <Th>Driver</Th>
          <Th>Capacity</Th>
          <Th>Fuel</Th>
          <Th>Next Service</Th>
          <Th>Status</Th>
          <Th position="last" align="right" />
        </TableHead>
        <TableBody>
          {filtered.length === 0 ? (
            <TableEmptyRow colSpan={8} icon={Bus} message="No vehicles found" />
          ) : filtered.map((v) => {
            const svc = serviceInfo(v);
            return (
              <Tr key={v.id} className={v.status === "maintenance" ? "bg-amber-50/30 dark:bg-amber-500/5" : ""}>
                <Td position="first">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-500/10">
                      <Bus className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-zinc-100 text-sm leading-tight font-mono">{v.regNo}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">{v.year}</p>
                    </div>
                  </div>
                </Td>
                <Td className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{v.model}</Td>
                <Td className="text-sm text-gray-700 dark:text-zinc-300">
                  {v.hasDriver ? "Assigned" : <span className="text-gray-400 dark:text-zinc-500">Unassigned</span>}
                </Td>
                <Td className="text-sm font-medium text-gray-700 dark:text-zinc-300 tabular-nums">{v.capacity}</Td>
                <Td>
                  <span className="text-sm">{FUEL_ICON[v.fuelType]}</span>
                  <span className="ml-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 capitalize">{v.fuelType}</span>
                </Td>
                <Td>
                  <p className="text-xs text-gray-600 dark:text-zinc-400">{formatDate(v.nextService)}</p>
                  <p className={`text-xs font-medium ${svc.cls}`}>{svc.label}</p>
                </Td>
                <Td>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${VEHICLE_STATUS_BADGE[v.status]}`}>{v.status}</span>
                </Td>
                <Td position="last">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => onEdit(v)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                  </div>
                </Td>
              </Tr>
            );
          })}
        </TableBody>
      </Table>

      <div className="grid grid-cols-3 gap-4">
        {(["active", "maintenance", "inactive"] as VehicleStatus[]).map((s) => {
          const count = vehicles.filter((v) => v.status === s).length;
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

function exportStudentsCsv(students: StudentTransport[]) {
  const header = ["Student", "Roll No", "Class", "Section", "Route", "Stop", "Monthly Fee", "Fee Status"];
  const rows = students.map((s) => [
    s.studentName, s.rollNo, s.classNum, s.section, `${s.routeNo} ${s.routeName}`, s.stopName, s.monthlyFee, s.feeStatus,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "transport-students.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function StudentsTab({ students, routes, onAssign, onEdit }: { students: StudentTransport[]; routes: Route[]; onAssign: () => void; onEdit: (s: StudentTransport) => void }) {
  const [query, setQuery] = useState("");
  const [routeFilter, setRoute] = useState("all");
  const [feeFilter, setFee] = useState<"all" | TransportFeeStatus>("all");
  const [page, setPage] = useState(1);

  const routeOptions = useMemo(() => {
    const set = new Set(students.map((s) => s.routeNo));
    return routes.filter((r) => set.has(r.routeNo));
  }, [students, routes]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return students.filter((s) => {
      const matchQ = !q || s.studentName.toLowerCase().includes(q) || s.rollNo.includes(q) || s.stopName.toLowerCase().includes(q);
      const matchR = routeFilter === "all" || s.routeNo === routeFilter;
      const matchF = feeFilter === "all" || s.feeStatus === feeFilter;
      return matchQ && matchR && matchF;
    });
  }, [students, query, routeFilter, feeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilter = query || routeFilter !== "all" || feeFilter !== "all";

  function clearFilters() { setQuery(""); setRoute("all"); setFee("all"); setPage(1); }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search student, roll no or stop…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
        </div>
        <div className="relative">
          <select value={routeFilter} onChange={(e) => { setRoute(e.target.value); setPage(1); }} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All Routes</option>
            {routeOptions.map((r) => <option key={r.routeNo} value={r.routeNo}>{r.routeNo} — {r.routeName}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        <div className="relative">
          <select value={feeFilter} onChange={(e) => { setFee(e.target.value as "all" | TransportFeeStatus); setPage(1); }} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All Fee Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="overdue">Overdue</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        {hasFilter && (
          <button onClick={clearFilters} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
        <div className="flex gap-2 sm:ml-auto">
          <button onClick={() => exportStudentsCsv(filtered)} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"><Download className="h-3.5 w-3.5" /> Export</button>
          <FancyButton size="sm" onClick={onAssign}><Plus className="h-4 w-4" /> Assign Student</FancyButton>
        </div>
      </div>

      {hasFilter && (
        <div className="flex items-center justify-end">
          <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">Filters active</span>
        </div>
      )}

      <Table
        footer={totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
              <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> students
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors text-xs">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setPage(n)} className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${page === n ? "bg-primary-500 text-white" : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"}`}>{n}</button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors text-xs">›</button>
            </div>
          </div>
        )}
      >
        <TableHead>
          <Th position="first">Student</Th>
          <Th>Class</Th>
          <Th>Route</Th>
          <Th>Stop</Th>
          <Th>Monthly Fee</Th>
          <Th>Fee Status</Th>
          <Th position="last" align="right">Actions</Th>
        </TableHead>
        <TableBody>
          {pageData.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
                  <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No students found</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">No students are assigned to transport yet.</p>
                </div>
              </td>
            </tr>
          ) : pageData.map((s) => (
            <Tr key={s.id} className={s.feeStatus === "overdue" ? "bg-red-50/30 dark:bg-red-500/5" : ""}>
              <Td position="first">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(s.id)}`}>{initials(s.studentName)}</div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{s.studentName}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{s.rollNo}</p>
                  </div>
                </div>
              </Td>
              <Td><span className="inline-flex items-center gap-1 rounded-lg bg-primary-500/10 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300">{s.classNum}–{s.section}</span></Td>
              <Td>
                <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">{s.routeName}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500">{s.routeNo}</p>
              </Td>
              <Td><div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-gray-400 dark:text-zinc-500 shrink-0" /><span className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{s.stopName}</span></div></Td>
              <Td className="text-sm font-medium text-gray-700 dark:text-zinc-300 tabular-nums">₹{s.monthlyFee.toLocaleString("en-IN")}</Td>
              <Td><span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${FEE_BADGE[s.feeStatus]}`}>{s.feeStatus}</span></Td>
              <Td position="last">
                <div className="flex items-center justify-end gap-1">
                  <a href={`tel:${s.phone}`} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors" title="Call parent"><Phone className="h-3.5 w-3.5" /></a>
                  <button onClick={() => onEdit(s)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                </div>
              </Td>
            </Tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = "routes" | "vehicles" | "students";
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "routes",   label: "Routes",   icon: MapPin },
  { id: "vehicles", label: "Vehicles", icon: Bus },
  { id: "students", label: "Students", icon: Users },
];

function exportOverviewCsv(routes: Route[], vehicles: Vehicle[]) {
  const header = ["Type", "Identifier", "Name/Model", "Status", "Capacity", "Extra"];
  const rows = [
    ...routes.map((r) => ["Route", r.routeNo, r.routeName, r.status, r.capacity, `${r.studentCount} students`]),
    ...vehicles.map((v) => ["Vehicle", v.regNo, v.model, v.status, v.capacity, v.fuelType]),
  ];
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "transport-report.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function TransportClient({
  routes, vehicles, students, drivers,
}: {
  routes: Route[];
  vehicles: Vehicle[];
  students: StudentTransport[];
  drivers: DriverOption[];
}) {
  const router = useRouter();
  const [activeTab, setTab] = useState<Tab>("routes");

  const [routeModal, setRouteModal] = useState<Route | "new" | null>(null);
  const [vehicleModal, setVehicleModal] = useState<Vehicle | "new" | null>(null);
  const [assignModal, setAssignModal] = useState<StudentTransport | "new" | null>(null);

  function refresh() {
    router.refresh();
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Transport</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Routes, vehicles, and drivers</p>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <button onClick={() => exportOverviewCsv(routes, vehicles)} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <Download className="h-3.5 w-3.5" /> Export Report
          </button>
          {activeTab === "routes" && (
            <FancyButton onClick={() => setRouteModal("new")} size="sm"><Plus className="h-4 w-4" /> Add Route</FancyButton>
          )}
        </div>
      </div>

      <StatsRow routes={routes} vehicles={vehicles} students={students} />

      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === id ? "border-primary-500 text-primary-600 dark:text-primary-400" : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:border-gray-300 dark:hover:border-zinc-600"}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {activeTab === "routes"   && <RoutesTab routes={routes} onEdit={(r) => setRouteModal(r)} />}
      {activeTab === "vehicles" && <VehiclesTab vehicles={vehicles} onAdd={() => setVehicleModal("new")} onEdit={(v) => setVehicleModal(v)} />}
      {activeTab === "students" && <StudentsTab students={students} routes={routes} onAssign={() => setAssignModal("new")} onEdit={(s) => setAssignModal(s)} />}

      {routeModal && (
        <RouteModal
          route={routeModal === "new" ? null : routeModal}
          drivers={drivers}
          onClose={() => setRouteModal(null)}
          onSaved={refresh}
        />
      )}
      {vehicleModal && (
        <VehicleModal
          vehicle={vehicleModal === "new" ? null : vehicleModal}
          drivers={drivers}
          onClose={() => setVehicleModal(null)}
          onSaved={refresh}
        />
      )}
      {assignModal && (
        <StudentTransportModal
          assignment={assignModal === "new" ? null : assignModal}
          routes={routes}
          onClose={() => setAssignModal(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
