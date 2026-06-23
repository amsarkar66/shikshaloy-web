"use client";

import { useState, useMemo } from "react";
import {
  BedDouble, Users, Home, AlertCircle, Wrench,
  Search, Plus, Download, X, Phone,
  Eye, Pencil, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import {
  ALL_ROOMS, ALL_STUDENTS, BLOCKS,
  ROOM_STATUS_BADGE, FEE_BADGE, ROOM_TYPE_LABEL,
  avatarColor, initials,
  type RoomStatus, type FeeStatus, type RoomType,
} from "./_data/hostel";

// ── Stats ─────────────────────────────────────────────────────────────────────

function StatsRow() {
  const totalRooms     = ALL_ROOMS.length;
  const totalCapacity  = ALL_ROOMS.reduce((s, r) => s + r.capacity, 0);
  const totalOccupied  = ALL_ROOMS.reduce((s, r) => s + r.occupied, 0);
  const feeOverdue     = ALL_STUDENTS.filter((s) => s.feeStatus === "overdue").length;
  const maintenance    = ALL_ROOMS.filter((r) => r.status === "maintenance").length;

  const items = [
    { label: "Total Rooms",     value: totalRooms,    icon: Home,       accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Students Housed", value: totalOccupied, icon: Users,      accent: "text-blue-500    bg-blue-500/10"    },
    { label: "Bed Occupancy",   value: `${Math.round((totalOccupied / totalCapacity) * 100)}%`, icon: BedDouble, accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Fee Overdue",     value: feeOverdue,    icon: AlertCircle,accent: "text-red-500     bg-red-500/10"     },
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

// ── Sort helper ───────────────────────────────────────────────────────────────

type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

// ── Rooms tab ─────────────────────────────────────────────────────────────────

type RoomSort = "roomNo" | "block" | "type" | "occupancy";

function RoomsTab() {
  const [query,        setQuery]     = useState("");
  const [blockFilter,  setBlock]     = useState("all");
  const [typeFilter,   setType]      = useState<"all" | RoomType>("all");
  const [statusFilter, setStatus]    = useState<"all" | RoomStatus>("all");
  const [sortField,    setSortField] = useState<RoomSort>("roomNo");
  const [sortDir,      setSortDir]   = useState<SortDir>("asc");

  function toggleSort(field: RoomSort) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return ALL_ROOMS.filter((r) => {
      const matchQ = !q || r.roomNo.toLowerCase().includes(q) || r.warden.toLowerCase().includes(q);
      const matchB = blockFilter === "all" || r.block === blockFilter;
      const matchT = typeFilter  === "all" || r.type  === typeFilter;
      const matchS = statusFilter === "all" || r.status === statusFilter;
      return matchQ && matchB && matchT && matchS;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === "roomNo")    cmp = a.roomNo.localeCompare(b.roomNo);
      if (sortField === "block")     cmp = a.block.localeCompare(b.block) || a.floor - b.floor;
      if (sortField === "type")      cmp = a.type.localeCompare(b.type);
      if (sortField === "occupancy") cmp = (a.occupied / a.capacity) - (b.occupied / b.capacity);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [query, blockFilter, typeFilter, statusFilter, sortField, sortDir]);

  const hasFilter = query || blockFilter !== "all" || typeFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search room or warden…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <select
          value={blockFilter}
          onChange={(e) => setBlock(e.target.value)}
          className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all">All Blocks</option>
          {BLOCKS.map((b) => <option key={b} value={b}>Block {b}</option>)}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setType(e.target.value as "all" | RoomType)}
          className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all">All Types</option>
          <option value="single">Single</option>
          <option value="double">Double</option>
          <option value="triple">Triple</option>
          <option value="dormitory">Dormitory</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatus(e.target.value as "all" | RoomStatus)}
          className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
        </select>

        {hasFilter && (
          <button
            onClick={() => { setQuery(""); setBlock("all"); setType("all"); setStatus("all"); }}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}

        <button className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white shadow-sm transition-colors shrink-0 sm:ml-auto">
          <Plus className="h-4 w-4" /> Add Room
        </button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-zinc-500">
          Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of{" "}
          <span className="font-medium text-gray-700 dark:text-zinc-300">{ALL_ROOMS.length}</span> rooms
        </p>
        {hasFilter && <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Filters active</span>}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                <th className="py-3 pl-4 pr-3 text-left">
                  <button onClick={() => toggleSort("roomNo")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                    Room <SortIcon active={sortField === "roomNo"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left">
                  <button onClick={() => toggleSort("block")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                    Block / Floor <SortIcon active={sortField === "block"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left">
                  <button onClick={() => toggleSort("type")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                    Type <SortIcon active={sortField === "type"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Warden</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Amenities</th>
                <th className="px-3 py-3 text-left">
                  <button onClick={() => toggleSort("occupancy")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                    Occupancy <SortIcon active={sortField === "occupancy"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Status</th>
                <th className="py-3 pl-3 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <BedDouble className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
                      <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No rooms found</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((room) => {
                const pct      = Math.round((room.occupied / room.capacity) * 100);
                const fillCls  = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500";

                return (
                  <tr
                    key={room.id}
                    className={`hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors ${room.status === "maintenance" ? "bg-amber-50/30 dark:bg-amber-500/5" : ""}`}
                  >
                    {/* Room */}
                    <td className="py-3 pl-4 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                          <BedDouble className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <p className="font-semibold text-gray-900 dark:text-zinc-100 text-sm">{room.roomNo}</p>
                      </div>
                    </td>

                    {/* Block / Floor */}
                    <td className="px-3 py-3">
                      <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Block {room.block}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">Floor {room.floor}</p>
                    </td>

                    {/* Type */}
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                        {ROOM_TYPE_LABEL[room.type]}
                      </span>
                    </td>

                    {/* Warden */}
                    <td className="px-3 py-3">
                      <p className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{room.warden}</p>
                    </td>

                    {/* Amenities */}
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {room.amenities.map((a) => (
                          <span key={a} className="rounded-md bg-gray-100 dark:bg-zinc-700 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:text-zinc-400">
                            {a}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Occupancy */}
                    <td className="px-3 py-3">
                      {room.status === "maintenance" ? (
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                          <Wrench className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium">Under repair</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
                            <div className={`h-1.5 rounded-full ${fillCls}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-semibold tabular-nums text-gray-700 dark:text-zinc-300">
                            {room.occupied}/{room.capacity}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${ROOM_STATUS_BADGE[room.status]}`}>
                        {room.status}
                      </span>
                    </td>

                    {/* Actions */}
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

      {/* Block summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {BLOCKS.map((block) => {
          const blockRooms    = ALL_ROOMS.filter((r) => r.block === block);
          const cap           = blockRooms.reduce((s, r) => s + r.capacity, 0);
          const occ           = blockRooms.reduce((s, r) => s + r.occupied, 0);
          const pct           = cap > 0 ? Math.round((occ / cap) * 100) : 0;
          const warden        = blockRooms[0]?.warden ?? "—";
          return (
            <div key={block} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-gray-900 dark:text-zinc-50">Block {block}</p>
                <span className="text-xs font-semibold tabular-nums text-gray-500 dark:text-zinc-400">{occ}/{cap}</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700 mb-2">
                <div
                  className={`h-1.5 rounded-full transition-all ${pct >= 90 ? "bg-amber-500" : "bg-indigo-500"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 truncate">{warden}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Students tab ──────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

type StudentSort = "name" | "class" | "room" | "feeStatus";

function StudentsTab() {
  const [query,        setQuery]     = useState("");
  const [blockFilter,  setBlock]     = useState("all");
  const [feeFilter,    setFee]       = useState<"all" | FeeStatus>("all");
  const [sortField,    setSortField] = useState<StudentSort>("name");
  const [sortDir,      setSortDir]   = useState<SortDir>("asc");
  const [page,         setPage]      = useState(1);

  function toggleSort(field: StudentSort) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return ALL_STUDENTS.filter((s) => {
      const matchQ = !q || s.studentName.toLowerCase().includes(q) || s.rollNo.includes(q) || s.roomNo.toLowerCase().includes(q) || s.parentName.toLowerCase().includes(q);
      const matchB = blockFilter === "all" || s.block === blockFilter;
      const matchF = feeFilter   === "all" || s.feeStatus === feeFilter;
      return matchQ && matchB && matchF;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === "name")      cmp = a.studentName.localeCompare(b.studentName);
      if (sortField === "class")     cmp = Number(a.class) - Number(b.class) || a.section.localeCompare(b.section);
      if (sortField === "room")      cmp = a.roomNo.localeCompare(b.roomNo);
      if (sortField === "feeStatus") cmp = a.feeStatus.localeCompare(b.feeStatus);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [query, blockFilter, feeFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilter  = query || blockFilter !== "all" || feeFilter !== "all";

  function clearFilters() { setQuery(""); setBlock("all"); setFee("all"); setPage(1); }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search student, roll no, room or parent…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <select
          value={blockFilter}
          onChange={(e) => { setBlock(e.target.value); setPage(1); }}
          className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all">All Blocks</option>
          {BLOCKS.map((b) => <option key={b} value={b}>Block {b}</option>)}
        </select>

        <select
          value={feeFilter}
          onChange={(e) => { setFee(e.target.value as "all" | FeeStatus); setPage(1); }}
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
            <Plus className="h-4 w-4" /> Admit Student
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-zinc-500">
          Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of{" "}
          <span className="font-medium text-gray-700 dark:text-zinc-300">{ALL_STUDENTS.length}</span> students
        </p>
        {hasFilter && <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Filters active</span>}
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                <th className="py-3 pl-4 pr-3 text-left">
                  <button onClick={() => toggleSort("name")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                    Student <SortIcon active={sortField === "name"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left">
                  <button onClick={() => toggleSort("class")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                    Class <SortIcon active={sortField === "class"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left">
                  <button onClick={() => toggleSort("room")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                    Room <SortIcon active={sortField === "room"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Parent / Guardian</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Join Date</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Monthly Fee</th>
                <th className="px-3 py-3 text-left">
                  <button onClick={() => toggleSort("feeStatus")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                    Fee Status <SortIcon active={sortField === "feeStatus"} dir={sortDir} />
                  </button>
                </th>
                <th className="py-3 pl-3 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
                      <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No students found</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : pageData.map((s) => (
                <tr
                  key={s.id}
                  className={`hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors ${s.feeStatus === "overdue" ? "bg-red-50/30 dark:bg-red-500/5" : ""}`}
                >
                  {/* Student */}
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

                  {/* Class */}
                  <td className="px-3 py-3">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                      {s.class}–{s.section}
                    </span>
                  </td>

                  {/* Room */}
                  <td className="px-3 py-3">
                    <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">{s.roomNo}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">Block {s.block}</p>
                  </td>

                  {/* Parent */}
                  <td className="px-3 py-3">
                    <p className="text-sm text-gray-700 dark:text-zinc-300 truncate max-w-[140px]">{s.parentName}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{s.phone}</p>
                  </td>

                  {/* Join date */}
                  <td className="px-3 py-3 text-sm text-gray-600 dark:text-zinc-400 whitespace-nowrap">
                    {new Date(s.joinDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>

                  {/* Monthly fee */}
                  <td className="px-3 py-3 text-sm font-medium text-gray-700 dark:text-zinc-300 tabular-nums whitespace-nowrap">
                    ₹{s.monthlyFee.toLocaleString("en-IN")}
                  </td>

                  {/* Fee status */}
                  <td className="px-3 py-3">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${FEE_BADGE[s.feeStatus]}`}>
                      {s.feeStatus}
                    </span>
                  </td>

                  {/* Actions */}
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
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce<(number | "…")[]>((acc, n, i, arr) => {
                  if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push("…");
                  acc.push(n);
                  return acc;
                }, [])
                .map((n, i) =>
                  n === "…" ? (
                    <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-400 dark:text-zinc-500">…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n as number)}
                      className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                        page === n
                          ? "bg-indigo-500 text-white"
                          : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {n}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = "rooms" | "students";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "rooms",    label: "Rooms",    icon: BedDouble },
  { id: "students", label: "Students", icon: Users     },
];

export default function HostelPage() {
  const [activeTab, setTab] = useState<Tab>("rooms");

  return (
    <div className="w-full px-6 py-6 space-y-5">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Hostel</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Manage rooms, student allocations, and fee collection</p>
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

      {activeTab === "rooms"    && <RoomsTab />}
      {activeTab === "students" && <StudentsTab />}
    </div>
  );
}
