"use client";

import { useMemo, useState } from "react";
import {
  Search, CheckSquare, Square, ChevronDown, Users, Briefcase, Eye, Filter,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { avatarColor, initials, type CardPerson, type PersonType } from "../_data/people";
import { FancyButton } from "@/components/ui/fancy-button";

const selectClass =
  "h-9 appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2.5 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

export function PersonPickerTable({
  people, type, selected, onToggle, onSelectMany, onClear, onInvert, onGenerate,
}: {
  people: CardPerson[];
  type: PersonType;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectMany: (ids: string[]) => void;
  onClear: () => void;
  onInvert: (ids: string[]) => void;
  onGenerate: () => void;
}) {
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");

  const classes = useMemo(
    () => Array.from(new Set(people.map((p) => p.gradeLevel).filter((g): g is number => g != null))).sort((a, b) => a - b),
    [people]
  );

  const sections = useMemo(() => {
    const set = new Set(
      people
        .filter((p) => classFilter === "all" || p.gradeLevel === Number(classFilter))
        .map((p) => p.section)
        .filter((s): s is string => !!s)
    );
    return Array.from(set).sort();
  }, [people, classFilter]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return people.filter((p) => {
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.idNumber.toLowerCase().includes(q);
      const matchClass = type !== "student" || classFilter === "all" || p.gradeLevel === Number(classFilter);
      const matchSection = type !== "student" || sectionFilter === "all" || p.section === sectionFilter;
      return matchQ && matchClass && matchSection;
    });
  }, [people, query, classFilter, sectionFilter, type]);

  const hasActiveFilter = classFilter !== "all" || sectionFilter !== "all";
  const filteredIds = filtered.map((p) => p.id);
  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const selectedCount = people.filter((p) => selected.has(p.id)).length;

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
      <div className="shrink-0 space-y-3 border-b border-gray-200 dark:border-zinc-800 p-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, roll no. or student ID…"
              className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {type === "student" && (
            <Popover>
              <PopoverTrigger
                title="Filter by class or section"
                className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                  hasActiveFilter
                    ? "border-primary-400 bg-primary-500/10 text-primary-600 dark:text-primary-400"
                    : "border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700"
                }`}
              >
                <Filter className="h-4 w-4" />
                {hasActiveFilter && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary-500 ring-2 ring-white dark:ring-zinc-800" />
                )}
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={6} className="w-64 space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-zinc-400">Class</label>
                  <div className="relative">
                    <select
                      className={`${selectClass} w-full`}
                      value={classFilter}
                      onChange={(e) => { setClassFilter(e.target.value); setSectionFilter("all"); }}
                    >
                      <option value="all">All Classes</option>
                      {classes.map((c) => <option key={c} value={c}>Class {c}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-zinc-400">Section</label>
                  <div className="relative">
                    <select className={`${selectClass} w-full`} value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
                      <option value="all">All Sections</option>
                      {sections.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                  </div>
                </div>
                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={() => { setClassFilter("all"); setSectionFilter("all"); }}
                    className="text-xs font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400"
                  >
                    Clear filters
                  </button>
                )}
              </PopoverContent>
            </Popover>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => (allFilteredSelected ? onInvert(filteredIds) : onSelectMany(filteredIds))}
            className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:text-primary-600 dark:hover:text-primary-400"
          >
            {allFilteredSelected ? <CheckSquare className="h-3.5 w-3.5 text-primary-500" /> : <Square className="h-3.5 w-3.5 text-gray-400" />}
            Select All ({filtered.length})
          </button>
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100">
                Bulk Actions <ChevronDown className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={6} className="w-44">
                <DropdownMenuItem className="cursor-pointer" onClick={() => onSelectMany(filteredIds)}>
                  Select all filtered
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => onInvert(filteredIds)}>
                  Invert selection
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={onClear}>
                  Clear selection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[240px] overflow-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="sticky top-0 bg-gray-50 dark:bg-zinc-800 z-10">
            <tr className="border-b border-gray-200 dark:border-zinc-700">
              <th className="w-8 py-2 pl-3" />
              <th className="py-2 pr-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                {type === "student" ? "Student Name" : "Staff Name"}
              </th>
              <th className="py-2 pr-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                {type === "student" ? "Class" : "Designation"}
              </th>
              <th className="py-2 pr-3 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                {type === "student" ? "Roll No." : "Staff ID"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
            {filtered.map((p) => {
              const checked = selected.has(p.id);
              return (
                <tr
                  key={p.id}
                  onClick={() => onToggle(p.id)}
                  className={`cursor-pointer transition-colors ${checked ? "bg-primary-500/5" : "hover:bg-gray-50 dark:hover:bg-zinc-700/30"}`}
                >
                  <td className="py-2 pl-3 pr-2">
                    {checked ? <CheckSquare className="h-4 w-4 text-primary-500" /> : <Square className="h-4 w-4 text-gray-300 dark:text-zinc-600" />}
                  </td>
                  <td className="py-2 pr-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full">
                        {p.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.photoUrl} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className={`flex h-full w-full items-center justify-center text-[10px] font-bold text-white ${avatarColor(p.id)}`}>
                            {initials(p.name)}
                          </div>
                        )}
                      </div>
                      <span className="truncate font-medium text-gray-900 dark:text-zinc-100">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-3 text-gray-600 dark:text-zinc-400 truncate max-w-[120px]">{p.subtitle}</td>
                  <td className="py-2 pr-3 text-gray-500 dark:text-zinc-400 font-mono text-xs">{p.idNumber}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No matches</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/60 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
          {type === "student" ? <Users className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
          <span className="font-semibold text-gray-900 dark:text-zinc-100">{selectedCount}</span> selected
        </div>
        <FancyButton
          onClick={onGenerate}
          disabled={selectedCount === 0}
          size="sm"
        >
          <Eye className="h-3.5 w-3.5" /> Generate {selectedCount > 0 ? `${selectedCount} ` : ""}Card{selectedCount === 1 ? "" : "s"}
        </FancyButton>
      </div>
    </div>
  );
}
