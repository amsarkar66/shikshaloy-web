"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  BedDouble, Users, Home, AlertCircle, Wrench,
  Search, Download, X, Phone, Plus,
  Eye, Pencil, ChevronLeft, ChevronRight, ChevronDown,
  ArrowUpDown, ArrowUp, ArrowDown,
  PieChart, Building2, Clock, IndianRupee,
} from "lucide-react";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";
import { FancyButton } from "@/components/ui/fancy-button";
import {
  ROOM_STATUS_BADGE, FEE_BADGE, ROOM_TYPE_LABEL,
  avatarColor, initials,
  type HostelRoom, type HostelStudent, type RoomStatus, type FeeStatus, type RoomType,
  type WardenOption, type EligibleStudentOption,
} from "../_data/hostel";
import { RoomFormModal } from "./RoomFormModal";
import { RoomDetailModal } from "./RoomDetailModal";
import { AllotStudentModal } from "./AllotStudentModal";
import { EditAllotmentModal } from "./EditAllotmentModal";

function downloadCsv(filename: string, header: string[], rows: (string | number)[][]) {
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function StatsRow({ rooms, students }: { rooms: HostelRoom[]; students: HostelStudent[] }) {
  const totalCapacity = rooms.reduce((s, r) => s + r.capacity, 0);
  const totalOccupied = rooms.reduce((s, r) => s + r.occupied, 0);
  const feeOverdue = students.filter((s) => s.feeStatus === "overdue").length;

  const items = [
    { label: "Total Rooms",     value: rooms.length,    icon: Home,        accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Students Housed", value: totalOccupied,    icon: Users,       accent: "text-blue-500    bg-blue-500/10"    },
    { label: "Bed Occupancy",   value: `${totalCapacity ? Math.round((totalOccupied / totalCapacity) * 100) : 0}%`, icon: BedDouble, accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Fee Overdue",     value: feeOverdue,       icon: AlertCircle, accent: "text-red-500     bg-red-500/10"     },
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

type SortDir = "asc" | "desc";
function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

type RoomSort = "roomNo" | "block" | "type" | "occupancy";

function RoomsTab({ rooms, blocks, onView, onEdit }: { rooms: HostelRoom[]; blocks: string[]; onView: (room: HostelRoom) => void; onEdit: (room: HostelRoom) => void }) {
  const [query, setQuery] = useState("");
  const [blockFilter, setBlock] = useState("all");
  const [typeFilter, setType] = useState<"all" | RoomType>("all");
  const [statusFilter, setStatus] = useState<"all" | RoomStatus>("all");
  const [sortField, setSortField] = useState<RoomSort>("roomNo");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  function toggleSort(field: RoomSort) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rooms.filter((r) => {
      const matchQ = !q || r.roomNo.toLowerCase().includes(q);
      const matchB = blockFilter === "all" || r.block === blockFilter;
      const matchT = typeFilter === "all" || r.type === typeFilter;
      const matchS = statusFilter === "all" || r.status === statusFilter;
      return matchQ && matchB && matchT && matchS;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === "roomNo") cmp = a.roomNo.localeCompare(b.roomNo);
      if (sortField === "block") cmp = a.block.localeCompare(b.block) || a.floor - b.floor;
      if (sortField === "type") cmp = a.type.localeCompare(b.type);
      if (sortField === "occupancy") cmp = (a.capacity ? a.occupied / a.capacity : 0) - (b.capacity ? b.occupied / b.capacity : 0);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [rooms, query, blockFilter, typeFilter, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilter = query || blockFilter !== "all" || typeFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search room…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
        </div>
        <div className="relative">
          <select value={blockFilter} onChange={(e) => { setBlock(e.target.value); setPage(1); }} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All Blocks</option>
            {blocks.map((b) => <option key={b} value={b}>Block {b}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        <div className="relative">
          <select value={typeFilter} onChange={(e) => { setType(e.target.value as "all" | RoomType); setPage(1); }} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All Types</option>
            <option value="single">Single</option>
            <option value="double">Double</option>
            <option value="triple">Triple</option>
            <option value="dormitory">Dormitory</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => { setStatus(e.target.value as "all" | RoomStatus); setPage(1); }} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        {hasFilter && (
          <button onClick={() => { setQuery(""); setBlock("all"); setType("all"); setStatus("all"); setPage(1); }} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {hasFilter && (
        <div className="flex items-center justify-end">
          <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">Filters active</span>
        </div>
      )}

      <Table
        footer={
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-zinc-500">
              Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
              <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> rooms
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"><ChevronLeft className="h-3.5 w-3.5" /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => setPage(n)} className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${page === n ? "bg-primary-500 text-white" : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"}`}>{n}</button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"><ChevronRight className="h-3.5 w-3.5" /></button>
              </div>
            )}
          </div>
        }
      >
        <TableHead>
          <Th position="first"><button onClick={() => toggleSort("roomNo")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Room <SortIcon active={sortField === "roomNo"} dir={sortDir} /></button></Th>
          <Th><button onClick={() => toggleSort("block")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Block / Floor <SortIcon active={sortField === "block"} dir={sortDir} /></button></Th>
          <Th><button onClick={() => toggleSort("type")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Type <SortIcon active={sortField === "type"} dir={sortDir} /></button></Th>
          <Th>Warden</Th>
          <Th>Amenities</Th>
          <Th><button onClick={() => toggleSort("occupancy")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Occupancy <SortIcon active={sortField === "occupancy"} dir={sortDir} /></button></Th>
          <Th>Status</Th>
          <Th position="last" align="right">Actions</Th>
        </TableHead>
        <TableBody>
          {pageData.length === 0 ? (
            <TableEmptyRow colSpan={8} icon={BedDouble} message="No rooms found" />
          ) : pageData.map((room) => {
            const pct = room.capacity ? Math.round((room.occupied / room.capacity) * 100) : 0;
            const fillCls = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500";
            return (
              <Tr key={room.id} className={room.status === "maintenance" ? "bg-amber-50/30 dark:bg-amber-500/5" : ""}>
                <Td position="first">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10"><BedDouble className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /></div>
                    <p className="font-semibold text-gray-900 dark:text-zinc-100 text-sm">{room.roomNo}</p>
                  </div>
                </Td>
                <Td><p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Block {room.block}</p><p className="text-xs text-gray-400 dark:text-zinc-500">Floor {room.floor}</p></Td>
                <Td><span className="inline-flex items-center rounded-lg bg-primary-500/10 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300">{ROOM_TYPE_LABEL[room.type]}</span></Td>
                <Td><p className={`text-sm whitespace-nowrap ${room.warden === "Unassigned" ? "text-gray-400 dark:text-zinc-500" : "text-gray-700 dark:text-zinc-300"}`}>{room.warden}</p></Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {room.amenities.map((a) => <span key={a} className="rounded-md bg-gray-100 dark:bg-zinc-700 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:text-zinc-400">{a}</span>)}
                  </div>
                </Td>
                <Td>
                  {room.status === "maintenance" ? (
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400"><Wrench className="h-3.5 w-3.5" /><span className="text-xs font-medium">Under repair</span></div>
                  ) : (
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700"><div className={`h-1.5 rounded-full ${fillCls}`} style={{ width: `${pct}%` }} /></div>
                      <span className="text-xs font-semibold tabular-nums text-gray-700 dark:text-zinc-300">{room.occupied}/{room.capacity}</span>
                    </div>
                  )}
                </Td>
                <Td><span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${ROOM_STATUS_BADGE[room.status]}`}>{room.status}</span></Td>
                <Td position="last">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => onView(room)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"><Eye className="h-3.5 w-3.5" /></button>
                    <button onClick={() => onEdit(room)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                  </div>
                </Td>
              </Tr>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

const PAGE_SIZE = 10;
type StudentSort = "name" | "class" | "room" | "feeStatus";

function StudentsTab({ students, blocks, onEdit }: { students: HostelStudent[]; blocks: string[]; onEdit: (student: HostelStudent) => void }) {
  const [query, setQuery] = useState("");
  const [blockFilter, setBlock] = useState("all");
  const [feeFilter, setFee] = useState<"all" | FeeStatus>("all");
  const [sortField, setSortField] = useState<StudentSort>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  function toggleSort(field: StudentSort) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return students.filter((s) => {
      const matchQ = !q || s.studentName.toLowerCase().includes(q) || s.rollNo.includes(q) || s.roomNo.toLowerCase().includes(q) || s.parentName.toLowerCase().includes(q);
      const matchB = blockFilter === "all" || s.block === blockFilter;
      const matchF = feeFilter === "all" || s.feeStatus === feeFilter;
      return matchQ && matchB && matchF;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.studentName.localeCompare(b.studentName);
      if (sortField === "class") cmp = Number(a.classNum) - Number(b.classNum) || a.section.localeCompare(b.section);
      if (sortField === "room") cmp = a.roomNo.localeCompare(b.roomNo);
      if (sortField === "feeStatus") cmp = a.feeStatus.localeCompare(b.feeStatus);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [students, query, blockFilter, feeFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilter = query || blockFilter !== "all" || feeFilter !== "all";

  function clearFilters() { setQuery(""); setBlock("all"); setFee("all"); setPage(1); }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search student, roll no, room or parent…" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
        </div>
        <div className="relative">
          <select value={blockFilter} onChange={(e) => { setBlock(e.target.value); setPage(1); }} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
            <option value="all">All Blocks</option>
            {blocks.map((b) => <option key={b} value={b}>Block {b}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
        <div className="relative">
          <select value={feeFilter} onChange={(e) => { setFee(e.target.value as "all" | FeeStatus); setPage(1); }} className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
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
          <button
            onClick={() => downloadCsv(
              "hostel-students.csv",
              ["Student", "Roll No", "Class", "Section", "Room", "Block", "Join Date", "Monthly Fee", "Fee Status", "Phone", "Parent"],
              filtered.map((s) => [s.studentName, s.rollNo, s.classNum, s.section, s.roomNo, s.block, s.joinDate, s.monthlyFee, s.feeStatus, s.phone, s.parentName]),
            )}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
          >
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </div>
      </div>

      {hasFilter && (
        <div className="flex items-center justify-end">
          <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">Filters active</span>
        </div>
      )}

      <Table
        footer={
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)}</span> of{" "}
              <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> students
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"><ChevronLeft className="h-3.5 w-3.5" /></button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => setPage(n)} className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium transition-colors ${page === n ? "bg-primary-500 text-white" : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-700"}`}>{n}</button>
                ))}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 disabled:opacity-40 hover:enabled:bg-gray-100 dark:hover:enabled:bg-zinc-700 transition-colors"><ChevronRight className="h-3.5 w-3.5" /></button>
              </div>
            )}
          </div>
        }
      >
        <TableHead>
          <Th position="first"><button onClick={() => toggleSort("name")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Student <SortIcon active={sortField === "name"} dir={sortDir} /></button></Th>
          <Th><button onClick={() => toggleSort("class")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Class <SortIcon active={sortField === "class"} dir={sortDir} /></button></Th>
          <Th><button onClick={() => toggleSort("room")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Room <SortIcon active={sortField === "room"} dir={sortDir} /></button></Th>
          <Th>Parent / Guardian</Th>
          <Th>Join Date</Th>
          <Th>Monthly Fee</Th>
          <Th><button onClick={() => toggleSort("feeStatus")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">Fee Status <SortIcon active={sortField === "feeStatus"} dir={sortDir} /></button></Th>
          <Th position="last" align="right">Actions</Th>
        </TableHead>
        <TableBody>
          {pageData.length === 0 ? (
            <TableEmptyRow colSpan={8} icon={Users} message="No students found" />
          ) : pageData.map((s) => (
            <Tr key={s.id} className={s.feeStatus === "overdue" ? "bg-red-50/30 dark:bg-red-500/5" : ""}>
              <Td position="first">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(s.id)}`}>{initials(s.studentName)}</div>
                  <div className="min-w-0"><p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{s.studentName}</p><p className="text-xs text-gray-400 dark:text-zinc-500">{s.rollNo}</p></div>
                </div>
              </Td>
              <Td><span className="inline-flex items-center gap-1 rounded-lg bg-primary-500/10 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300">{s.classNum}–{s.section}</span></Td>
              <Td><p className="text-sm font-medium text-gray-700 dark:text-zinc-300">{s.roomNo}</p><p className="text-xs text-gray-400 dark:text-zinc-500">Block {s.block}</p></Td>
              <Td><p className="text-sm text-gray-700 dark:text-zinc-300 truncate max-w-[140px]">{s.parentName}</p><p className="text-xs text-gray-400 dark:text-zinc-500">{s.phone}</p></Td>
              <Td className="text-sm text-gray-600 dark:text-zinc-400 whitespace-nowrap">{new Date(s.joinDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</Td>
              <Td className="text-sm font-medium text-gray-700 dark:text-zinc-300 tabular-nums whitespace-nowrap">₹{s.monthlyFee.toLocaleString("en-IN")}</Td>
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

// ── Overview tab ──────────────────────────────────────────────────────────────

const ROOM_TYPE_COLOR: Record<RoomType, string> = {
  single: "#6366f1",
  double: "#0891b2",
  triple: "#ec4899",
  dormitory: "#d97706",
};

const ROOM_STATUS_COLOR: Record<RoomStatus, string> = {
  available: "#10b981",
  occupied: "#3b82f6",
  maintenance: "#f59e0b",
};

const FEE_STATUS_COLOR: Record<FeeStatus, string> = {
  paid: "#10b981",
  partial: "#f59e0b",
  overdue: "#ef4444",
};

interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

function Donut({ slices, centerLabel }: { slices: DonutSlice[]; centerLabel: string }) {
  const total = slices.reduce((s, d) => s + d.value, 0);
  const R = 48;
  const cx = 64;
  const cy = 64;
  const circ = 2 * Math.PI * R;

  if (total === 0) {
    return <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No data yet</p>;
  }

  let offset = circ * 0.25;
  const arcs = slices.filter((s) => s.value > 0).map((s) => {
    const dash = (s.value / total) * circ;
    const a = { ...s, dash, offset };
    offset += dash;
    return a;
  });

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0">
        <svg width="128" height="128" viewBox="0 0 128 128">
          {arcs.map((a) => (
            <circle key={a.key} cx={cx} cy={cy} r={R} fill="none"
              stroke={a.color} strokeWidth="18"
              strokeDasharray={`${Math.max(a.dash - 2, 0)} ${circ - a.dash + 2}`}
              strokeDashoffset={-a.offset + circ * 0.25}
              strokeLinecap="round"
            />
          ))}
          <text x={cx} y={cy - 2} textAnchor="middle" fontSize="20" fontWeight="bold" fill="currentColor" className="fill-gray-900 dark:fill-zinc-50">
            {total}
          </text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize="8" fill="currentColor" className="fill-gray-400 dark:fill-zinc-500">
            {centerLabel}
          </text>
        </svg>
      </div>
      <div className="grid gap-2 flex-1">
        {slices.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: s.color }} />
            <span className="text-xs text-gray-600 dark:text-zinc-400 capitalize">{s.label}</span>
            <span className="ml-auto text-xs font-semibold tabular-nums text-gray-800 dark:text-zinc-200">{s.value}</span>
            <span className="w-9 text-right text-[11px] tabular-nums text-gray-400 dark:text-zinc-500">{total ? Math.round((s.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BlockOccupancyBars({ rooms, blocks }: { rooms: HostelRoom[]; blocks: string[] }) {
  if (blocks.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No blocks yet</p>;
  }
  return (
    <div className="space-y-3">
      {blocks.map((block) => {
        const blockRooms = rooms.filter((r) => r.block === block);
        const cap = blockRooms.reduce((s, r) => s + r.capacity, 0);
        const occ = blockRooms.reduce((s, r) => s + r.occupied, 0);
        const pct = cap > 0 ? Math.round((occ / cap) * 100) : 0;
        return (
          <div key={block} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-xs font-medium text-gray-700 dark:text-zinc-300">Block {block}</span>
            <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-zinc-700">
              <div className={`h-2 rounded-full ${pct >= 90 ? "bg-amber-500" : "bg-indigo-500"}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="w-14 text-right text-xs font-semibold tabular-nums text-gray-700 dark:text-zinc-300">{occ}/{cap}</span>
            <span className="w-16 text-right text-[11px] text-gray-400 dark:text-zinc-500">{blockRooms.length} room{blockRooms.length === 1 ? "" : "s"}</span>
          </div>
        );
      })}
    </div>
  );
}

function RecentAllotments({ students }: { students: HostelStudent[] }) {
  const recent = useMemo(
    () => [...students].sort((a, b) => (a.joinDate < b.joinDate ? 1 : -1)).slice(0, 6),
    [students],
  );

  if (recent.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No allotments yet</p>;
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
      {recent.map((s) => (
        <div key={s.id} className="flex items-center gap-3 py-2.5">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(s.id)}`}>{initials(s.studentName)}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{s.studentName}</p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Room {s.roomNo} · Block {s.block}</p>
          </div>
          <span className="shrink-0 text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">
            {new Date(s.joinDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        </div>
      ))}
    </div>
  );
}

function OverviewTab({ rooms, students, blocks }: { rooms: HostelRoom[]; students: HostelStudent[]; blocks: string[] }) {
  const roomTypeSlices: DonutSlice[] = useMemo(() => {
    const order: RoomType[] = ["single", "double", "triple", "dormitory"];
    return order.map((t) => ({
      key: t,
      label: ROOM_TYPE_LABEL[t],
      value: rooms.filter((r) => r.type === t).length,
      color: ROOM_TYPE_COLOR[t],
    }));
  }, [rooms]);

  const roomStatusSlices: DonutSlice[] = useMemo(() => {
    const order: RoomStatus[] = ["available", "occupied", "maintenance"];
    return order.map((st) => ({
      key: st,
      label: st,
      value: rooms.filter((r) => r.status === st).length,
      color: ROOM_STATUS_COLOR[st],
    }));
  }, [rooms]);

  const feeStatusSlices: DonutSlice[] = useMemo(() => {
    const order: FeeStatus[] = ["paid", "partial", "overdue"];
    return order.map((f) => ({
      key: f,
      label: f,
      value: students.filter((s) => s.feeStatus === f).length,
      color: FEE_STATUS_COLOR[f],
    }));
  }, [students]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <div className="mb-5 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Room Type Distribution</p>
          </div>
          <Donut slices={roomTypeSlices} centerLabel="Rooms" />
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <div className="mb-5 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Occupancy by Block</p>
          </div>
          <BlockOccupancyBars rooms={rooms} blocks={blocks} />
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <div className="mb-5 flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Room Status</p>
          </div>
          <Donut slices={roomStatusSlices} centerLabel="Rooms" />
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <div className="mb-5 flex items-center gap-2">
            <IndianRupee className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Fee Status</p>
          </div>
          <Donut slices={feeStatusSlices} centerLabel="Students" />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <div className="mb-2 flex items-center gap-2">
          <Clock className="h-4 w-4 text-gray-400 dark:text-zinc-500" />
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Recent Allotments</p>
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mb-2">Most recently joined residents</p>
        <RecentAllotments students={students} />
      </div>
    </div>
  );
}

type Tab = "overview" | "rooms" | "students";
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: PieChart },
  { id: "rooms", label: "Rooms", icon: BedDouble },
  { id: "students", label: "Students", icon: Users },
];

export default function HostelClient({
  rooms, students, blocks, wardens, eligibleStudents,
}: {
  rooms: HostelRoom[];
  students: HostelStudent[];
  blocks: string[];
  wardens: WardenOption[];
  eligibleStudents: EligibleStudentOption[];
}) {
  const router = useRouter();
  const [activeTab, setTab] = useState<Tab>("overview");
  const [roomModal, setRoomModal] = useState<{ mode: "add" | "edit"; room?: HostelRoom } | null>(null);
  const [viewingRoom, setViewingRoom] = useState<HostelRoom | null>(null);
  const [allotOpen, setAllotOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<HostelStudent | null>(null);

  function refresh() {
    router.refresh();
  }

  function handleExportReport() {
    if (activeTab === "rooms") {
      downloadCsv(
        "hostel-rooms.csv",
        ["Room", "Block", "Floor", "Type", "Warden", "Capacity", "Occupied", "Status"],
        rooms.map((r) => [r.roomNo, r.block, r.floor, ROOM_TYPE_LABEL[r.type], r.warden, r.capacity, r.occupied, r.status]),
      );
    } else if (activeTab === "students") {
      downloadCsv(
        "hostel-students.csv",
        ["Student", "Roll No", "Class", "Section", "Room", "Block", "Join Date", "Monthly Fee", "Fee Status", "Phone", "Parent"],
        students.map((s) => [s.studentName, s.rollNo, s.classNum, s.section, s.roomNo, s.block, s.joinDate, s.monthlyFee, s.feeStatus, s.phone, s.parentName]),
      );
    }
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Hostel</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Rooms, allotments, and residents</p>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          {activeTab !== "overview" && (
            <button onClick={handleExportReport} className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
              <Download className="h-3.5 w-3.5" /> Export Report
            </button>
          )}
          {activeTab === "rooms" && (
            <FancyButton onClick={() => setRoomModal({ mode: "add" })} size="sm"><Plus className="h-4 w-4" /> Add Room</FancyButton>
          )}
          {activeTab === "students" && (
            <FancyButton onClick={() => setAllotOpen(true)} size="sm"><Plus className="h-4 w-4" /> Allot Student</FancyButton>
          )}
        </div>
      </div>

      <StatsRow rooms={rooms} students={students} />

      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === id ? "border-primary-500 text-primary-600 dark:text-primary-400" : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:border-gray-300 dark:hover:border-zinc-600"}`}>
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <OverviewTab rooms={rooms} students={students} blocks={blocks} />}
      {activeTab === "rooms" && <RoomsTab rooms={rooms} blocks={blocks} onView={setViewingRoom} onEdit={(room) => setRoomModal({ mode: "edit", room })} />}
      {activeTab === "students" && <StudentsTab students={students} blocks={blocks} onEdit={setEditingStudent} />}

      {roomModal && (
        <RoomFormModal
          mode={roomModal.mode}
          room={roomModal.room}
          wardens={wardens}
          onClose={() => setRoomModal(null)}
          onSaved={refresh}
        />
      )}

      {viewingRoom && (
        <RoomDetailModal
          room={viewingRoom}
          occupants={students.filter((s) => s.roomNo === viewingRoom.roomNo && s.block === viewingRoom.block)}
          onClose={() => setViewingRoom(null)}
        />
      )}

      {allotOpen && (
        <AllotStudentModal
          rooms={rooms}
          students={eligibleStudents}
          onClose={() => setAllotOpen(false)}
          onSaved={refresh}
        />
      )}

      {editingStudent && (
        <EditAllotmentModal
          student={editingStudent}
          rooms={rooms}
          onClose={() => setEditingStudent(null)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
