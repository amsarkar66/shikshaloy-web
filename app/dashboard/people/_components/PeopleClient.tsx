"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, ChevronDown, Users, GraduationCap, Briefcase, UserCog, Landmark,
} from "lucide-react";
import { Table, TableHead, TableBody, Th, Td, Tr, TableEmptyRow } from "@/components/ui/data-table";

export interface SchoolOption {
  id: string;
  name: string;
}

export interface StudentRow {
  id: string;
  name: string;
  rollNo: string;
  class: string;
  gender: string | null;
  phone: string;
  status: "active" | "inactive" | "graduated";
  schoolId: string;
  schoolName: string;
}

export interface StaffRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: "teaching" | "non_teaching";
  designation: string;
  department: string;
  status: "active" | "on_leave" | "inactive";
  schoolId: string;
  schoolName: string;
}

export interface ParentRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: "active" | "inactive";
  schoolId: string;
  schoolName: string;
}

export interface AdminRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "pending" | "rejected";
  joinedDate: string;
  schoolId: string;
  schoolName: string;
}

type TabKey = "students" | "staff" | "parents" | "admins";

const AVATAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500", "bg-teal-500", "bg-indigo-500", "bg-pink-500",
];
function avatarColor(id: string) {
  const n = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}
function initials(name: string) {
  return name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase() || "—";
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_BADGE: Record<string, string> = {
  active:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  on_leave:  "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  pending:   "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20",
  inactive:  "bg-gray-500/10    text-gray-600    dark:text-zinc-400    border-gray-500/20",
  rejected:  "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20",
  graduated: "bg-sky-500/10     text-sky-600     dark:text-sky-400     border-sky-500/20",
};
const STATUS_LABEL: Record<string, string> = {
  active: "Active", on_leave: "On leave", pending: "Pending",
  inactive: "Inactive", rejected: "Rejected", graduated: "Graduated",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[status] ?? STATUS_BADGE.inactive}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function SchoolCell({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-gray-700 dark:text-zinc-300">
      <Landmark className="h-3.5 w-3.5 shrink-0 text-violet-400" />{name}
    </span>
  );
}

function NameCell({ id, name }: { id: string; name: string }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(id)}`}>
        {initials(name)}
      </div>
      <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate">{name}</p>
    </div>
  );
}

export default function PeopleClient({
  schools, students, staff, parents, admins,
}: {
  schools: SchoolOption[];
  students: StudentRow[];
  staff: StaffRow[];
  parents: ParentRow[];
  admins: AdminRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("students");
  const [query, setQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");

  const tabs: { key: TabKey; label: string; icon: React.ElementType; count: number }[] = [
    { key: "students", label: "Students", icon: GraduationCap, count: students.length },
    { key: "staff",    label: "Staff",    icon: Briefcase,     count: staff.length },
    { key: "parents",  label: "Parents",  icon: Users,         count: parents.length },
    { key: "admins",   label: "Admins",   icon: UserCog,       count: admins.length },
  ];

  const filteredStudents = useMemo(() => {
    const q = query.toLowerCase();
    return students.filter((s) => {
      const matchQ = !q || s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q) || s.phone.toLowerCase().includes(q);
      const matchSchool = schoolFilter === "all" || s.schoolId === schoolFilter;
      return matchQ && matchSchool;
    });
  }, [students, query, schoolFilter]);

  const filteredStaff = useMemo(() => {
    const q = query.toLowerCase();
    return staff.filter((s) => {
      const matchQ = !q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.designation.toLowerCase().includes(q);
      const matchSchool = schoolFilter === "all" || s.schoolId === schoolFilter;
      return matchQ && matchSchool;
    });
  }, [staff, query, schoolFilter]);

  const filteredParents = useMemo(() => {
    const q = query.toLowerCase();
    return parents.filter((p) => {
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q) || p.phone.toLowerCase().includes(q);
      const matchSchool = schoolFilter === "all" || p.schoolId === schoolFilter;
      return matchQ && matchSchool;
    });
  }, [parents, query, schoolFilter]);

  const filteredAdmins = useMemo(() => {
    const q = query.toLowerCase();
    return admins.filter((a) => {
      const matchQ = !q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
      const matchSchool = schoolFilter === "all" || a.schoolId === schoolFilter;
      return matchQ && matchSchool;
    });
  }, [admins, query, schoolFilter]);

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">People</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
          Students, staff, parents, and admins across {schools.length} school{schools.length === 1 ? "" : "s"} in your institution
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {tabs.map((t) => (
          <div key={t.key} className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-violet-500 bg-violet-500/10">
              <t.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold leading-tight text-gray-900 dark:text-zinc-50">{t.count.toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">{t.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-zinc-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex shrink-0 items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === t.key
                ? "border-violet-500 text-violet-600 dark:text-violet-400"
                : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${tabs.find((t) => t.key === tab)?.label.toLowerCase()}…`}
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-violet-400 dark:focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
        <div className="relative">
          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20"
          >
            <option value="all">All Schools</option>
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
        </div>
      </div>

      {tab === "students" && (
        <Table>
          <TableHead>
            <Th position="first">Student</Th>
            <Th>School</Th>
            <Th>Class</Th>
            <Th>Roll No.</Th>
            <Th>Phone</Th>
            <Th position="last">Status</Th>
          </TableHead>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableEmptyRow colSpan={6} icon={GraduationCap} message="No students found" />
            ) : (
              filteredStudents.map((s) => (
                <Tr key={s.id} onClick={() => router.push(`/dashboard/students/${s.id}`)}>
                  <Td position="first"><NameCell id={s.id} name={s.name} /></Td>
                  <Td><SchoolCell name={s.schoolName} /></Td>
                  <Td className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{s.class}</Td>
                  <Td className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{s.rollNo}</Td>
                  <Td className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{s.phone}</Td>
                  <Td position="last"><StatusBadge status={s.status} /></Td>
                </Tr>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {tab === "staff" && (
        <Table>
          <TableHead>
            <Th position="first">Staff</Th>
            <Th>School</Th>
            <Th>Designation</Th>
            <Th>Department</Th>
            <Th>Contact</Th>
            <Th position="last">Status</Th>
          </TableHead>
          <TableBody>
            {filteredStaff.length === 0 ? (
              <TableEmptyRow colSpan={6} icon={Briefcase} message="No staff found" />
            ) : (
              filteredStaff.map((s) => (
                <Tr key={s.id} onClick={() => router.push(`/dashboard/staff/${s.id}`)}>
                  <Td position="first"><NameCell id={s.id} name={s.name} /></Td>
                  <Td><SchoolCell name={s.schoolName} /></Td>
                  <Td className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{s.designation}</Td>
                  <Td className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{s.department}</Td>
                  <Td>
                    <p className="text-sm text-gray-700 dark:text-zinc-300 truncate max-w-[200px]">{s.email}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{s.phone}</p>
                  </Td>
                  <Td position="last"><StatusBadge status={s.status} /></Td>
                </Tr>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {tab === "parents" && (
        <Table>
          <TableHead>
            <Th position="first">Parent</Th>
            <Th>School</Th>
            <Th>Contact</Th>
            <Th position="last">Status</Th>
          </TableHead>
          <TableBody>
            {filteredParents.length === 0 ? (
              <TableEmptyRow colSpan={4} icon={Users} message="No parents found" />
            ) : (
              filteredParents.map((p) => (
                <Tr key={p.id} onClick={() => router.push(`/dashboard/parents/${p.id}`)}>
                  <Td position="first"><NameCell id={p.id} name={p.name} /></Td>
                  <Td><SchoolCell name={p.schoolName} /></Td>
                  <Td>
                    <p className="text-sm text-gray-700 dark:text-zinc-300 truncate max-w-[200px]">{p.email}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{p.phone}</p>
                  </Td>
                  <Td position="last"><StatusBadge status={p.status} /></Td>
                </Tr>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {tab === "admins" && (
        <Table>
          <TableHead>
            <Th position="first">Admin</Th>
            <Th>School</Th>
            <Th>Contact</Th>
            <Th>Joined</Th>
            <Th position="last">Status</Th>
          </TableHead>
          <TableBody>
            {filteredAdmins.length === 0 ? (
              <TableEmptyRow colSpan={5} icon={UserCog} message="No admins found" />
            ) : (
              filteredAdmins.map((a) => (
                <Tr key={a.id}>
                  <Td position="first"><NameCell id={a.id} name={a.name} /></Td>
                  <Td><SchoolCell name={a.schoolName} /></Td>
                  <Td>
                    <p className="text-sm text-gray-700 dark:text-zinc-300 truncate max-w-[200px]">{a.email}</p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">{a.phone}</p>
                  </Td>
                  <Td className="text-sm text-gray-700 dark:text-zinc-300 whitespace-nowrap">{formatDate(a.joinedDate)}</Td>
                  <Td position="last"><StatusBadge status={a.status} /></Td>
                </Tr>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
