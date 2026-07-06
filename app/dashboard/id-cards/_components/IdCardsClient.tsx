"use client";

import { useMemo, useState } from "react";
import {
  IdCard, Search, Printer, GraduationCap, Droplets,
  CheckSquare, Square, Users, Briefcase,
} from "lucide-react";
import { avatarColor, initials, type PersonType, type CardPerson } from "../_data/people";

function IdCardPreview({ person }: { person: CardPerson }) {
  return (
    <div className="id-card w-[320px] shrink-0 overflow-hidden rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm">
      <div className="flex items-center gap-2 bg-indigo-500 px-4 py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/20">
          <GraduationCap className="h-3.5 w-3.5 text-white" />
        </div>
        <p className="text-sm font-bold tracking-tight text-white">Shikshaloy</p>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-white/80">
          {person.type === "student" ? "Student ID" : "Staff ID"}
        </span>
      </div>

      <div className="flex gap-3 p-4">
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white ${avatarColor(person.id)}`}>
          {initials(person.name)}
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate font-semibold text-gray-900 dark:text-zinc-50">{person.name}</p>
          <p className="truncate text-xs text-gray-500 dark:text-zinc-400">{person.subtitle}</p>
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{person.idNumber}</p>
          <div className="flex items-center gap-1 pt-1 text-[11px] text-gray-500 dark:text-zinc-400">
            <Droplets className="h-3 w-3" /> {person.bloodGroup}
          </div>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-dashed border-gray-300 dark:border-zinc-600">
          <div className="grid grid-cols-4 gap-0.5">
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 ${(i * 7) % 3 === 0 ? "bg-gray-800 dark:bg-zinc-300" : "bg-transparent"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 dark:border-zinc-800 px-4 py-2">
        <p className="text-[10px] text-gray-400 dark:text-zinc-500">Valid till {person.validTill}</p>
        <p className="text-[10px] text-gray-400 dark:text-zinc-500">shikshaloy.com</p>
      </div>
    </div>
  );
}

export default function IdCardsClient({ people }: { people: CardPerson[] }) {
  const [tab, setTab] = useState<PersonType>("student");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return people.filter(
      (p) => p.type === tab && (!q || p.name.toLowerCase().includes(q) || p.idNumber.toLowerCase().includes(q))
    );
  }, [people, tab, query]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const allSelected = filtered.every((p) => prev.has(p.id));
      const next = new Set(prev);
      filtered.forEach((p) => (allSelected ? next.delete(p.id) : next.add(p.id)));
      return next;
    });
  }

  const selectedPeople = people.filter((p) => selected.has(p.id));
  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #id-card-print-area, #id-card-print-area * { visibility: visible; }
          #id-card-print-area { position: absolute; inset: 0; }
        }
      `}</style>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">ID Card Generator</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Select students or staff to generate printable ID cards.</p>
        </div>
        <button
          onClick={() => window.print()}
          disabled={selectedPeople.length === 0}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 px-4 text-sm font-medium text-white transition-colors shadow-sm"
        >
          <Printer className="h-4 w-4" /> Print {selectedPeople.length > 0 ? `(${selectedPeople.length})` : ""}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5">
        {/* Selection panel */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-zinc-800">
            {(["student", "staff"] as PersonType[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors ${
                  tab === t
                    ? "border-b-2 border-indigo-500 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"
                }`}
              >
                {t === "student" ? <Users className="h-4 w-4" /> : <Briefcase className="h-4 w-4" />}
                {t === "student" ? "Students" : "Staff"}
              </button>
            ))}
          </div>

          <div className="p-3 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or ID…"
                className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <button
              onClick={toggleAll}
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {allFilteredSelected ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
              {allFilteredSelected ? "Deselect all" : "Select all"} ({filtered.length})
            </button>

            <div className="max-h-[420px] space-y-1 overflow-y-auto">
              {filtered.map((p) => {
                const checked = selected.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                      checked ? "bg-indigo-500/10" : "hover:bg-gray-50 dark:hover:bg-zinc-700/40"
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="h-4 w-4 shrink-0 text-indigo-500" />
                    ) : (
                      <Square className="h-4 w-4 shrink-0 text-gray-300 dark:text-zinc-600" />
                    )}
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white ${avatarColor(p.id)}`}>
                      {initials(p.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-zinc-100">{p.name}</p>
                      <p className="truncate text-xs text-gray-400 dark:text-zinc-500">{p.idNumber} · {p.subtitle}</p>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">No matches</p>
              )}
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/40 p-5">
          {selectedPeople.length === 0 ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-2 text-center">
              <IdCard className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No cards selected</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500">Pick students or staff on the left to preview their ID cards here.</p>
            </div>
          ) : (
            <div id="id-card-print-area" className="flex flex-wrap gap-4">
              {selectedPeople.map((p) => (
                <IdCardPreview key={p.id} person={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
