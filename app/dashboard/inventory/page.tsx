"use client";

import { useState, useMemo } from "react";
import {
  Package, PackageCheck, PackageX, AlertTriangle, Wrench,
  Search, Plus, Download, ChevronLeft, ChevronRight,
  Pencil, ArrowUpDown, ArrowUp, ArrowDown, X, Eye, IndianRupee,
} from "lucide-react";
import {
  ALL_ITEMS, CATEGORIES, itemStatus, availableQty,
  avatarColor, initials, totalValue, formatCurrency, formatDate,
  type ItemStatus, type ItemCondition, type ItemCategory,
} from "./_data/inventory";

// ── Types ─────────────────────────────────────────────────────────────────────

type SortField = "name" | "category" | "totalQty" | "available" | "damaged" | "value";
type SortDir   = "asc" | "desc";

// ── Badge configs ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<ItemStatus, { label: string; cls: string }> = {
  in_stock:     { label: "In Stock",     cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  low_stock:    { label: "Low Stock",    cls: "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20"   },
  out_of_stock: { label: "Out of Stock", cls: "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20"     },
};

const CONDITION_BADGE: Record<ItemCondition, { label: string; cls: string }> = {
  good: { label: "Good", cls: "bg-blue-500/10   text-blue-600   dark:text-blue-400   border-blue-500/20"   },
  fair: { label: "Fair", cls: "bg-zinc-500/10   text-zinc-600   dark:text-zinc-400   border-zinc-500/20"   },
  poor: { label: "Poor", cls: "bg-red-500/10    text-red-600    dark:text-red-400    border-red-500/20"    },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
}

// ── Stats row ─────────────────────────────────────────────────────────────────

function StatsRow() {
  const totalItems    = ALL_ITEMS.length;
  const totalQty      = ALL_ITEMS.reduce((s, i) => s + i.totalQty, 0);
  const totalDamaged  = ALL_ITEMS.reduce((s, i) => s + i.damaged, 0);
  const inventoryVal  = totalValue(ALL_ITEMS);

  const items = [
    { label: "Item Types",       value: totalItems,              icon: Package,       accent: "text-indigo-500  bg-indigo-500/10",  formatted: String(totalItems)           },
    { label: "Total Units",      value: totalQty,                icon: PackageCheck,  accent: "text-blue-500    bg-blue-500/10",    formatted: String(totalQty)             },
    { label: "Damaged / Faulty", value: totalDamaged,            icon: Wrench,        accent: "text-amber-500   bg-amber-500/10",   formatted: String(totalDamaged)         },
    { label: "Total Value",      value: inventoryVal,            icon: IndianRupee,   accent: "text-emerald-500 bg-emerald-500/10", formatted: formatCurrency(inventoryVal) },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((s) => (
        <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex items-center gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.accent}`}>
            <s.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.formatted}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function InventoryPage() {
  const [query,       setQuery]      = useState("");
  const [catFilter,   setCat]        = useState<"all" | ItemCategory>("all");
  const [statusFilter, setStatus]    = useState<"all" | ItemStatus>("all");
  const [sortField,   setSortField]  = useState<SortField>("name");
  const [sortDir,     setSortDir]    = useState<SortDir>("asc");
  const [page,        setPage]       = useState(1);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return ALL_ITEMS.filter((item) => {
      const matchQ   = !q || item.name.toLowerCase().includes(q) || item.location.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      const matchCat = catFilter === "all" || item.category === catFilter;
      const matchSt  = statusFilter === "all" || itemStatus(item) === statusFilter;
      return matchQ && matchCat && matchSt;
    }).sort((a, b) => {
      let cmp = 0;
      if (sortField === "name")      cmp = a.name.localeCompare(b.name);
      if (sortField === "category")  cmp = a.category.localeCompare(b.category);
      if (sortField === "totalQty")  cmp = a.totalQty - b.totalQty;
      if (sortField === "available") cmp = availableQty(a) - availableQty(b);
      if (sortField === "damaged")   cmp = a.damaged - b.damaged;
      if (sortField === "value")     cmp = (a.totalQty * a.unitCost) - (b.totalQty * b.unitCost);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [query, catFilter, statusFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilter  = query || catFilter !== "all" || statusFilter !== "all";

  function clearFilters() {
    setQuery(""); setCat("all"); setStatus("all"); setPage(1);
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">

      {/* Stats */}
      <StatsRow />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by name, category or location…"
            className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Category filter */}
        <select
          value={catFilter}
          onChange={(e) => { setCat(e.target.value as "all" | ItemCategory); setPage(1); }}
          className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatus(e.target.value as "all" | ItemStatus); setPage(1); }}
          className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
        >
          <option value="all">All Status</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
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
          <button className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 dark:text-zinc-500">
          Showing <span className="font-medium text-gray-700 dark:text-zinc-300">{filtered.length}</span> of{" "}
          <span className="font-medium text-gray-700 dark:text-zinc-300">{ALL_ITEMS.length}</span> items
        </p>
        {hasFilter && (
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Filters active</span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800">
                <th className="py-3 pl-4 pr-3 text-left">
                  <button onClick={() => toggleSort("name")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                    Item <SortIcon active={sortField === "name"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left">
                  <button onClick={() => toggleSort("category")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                    Category <SortIcon active={sortField === "category"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left">
                  <button onClick={() => toggleSort("totalQty")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                    Total <SortIcon active={sortField === "totalQty"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left">
                  <button onClick={() => toggleSort("available")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                    Available <SortIcon active={sortField === "available"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left">
                  <button onClick={() => toggleSort("damaged")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                    Damaged <SortIcon active={sortField === "damaged"} dir={sortDir} />
                  </button>
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                  Condition
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                  Status
                </th>
                <th className="px-3 py-3 text-left">
                  <button onClick={() => toggleSort("value")} className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
                    Value <SortIcon active={sortField === "value"} dir={sortDir} />
                  </button>
                </th>
                <th className="py-3 pl-3 pr-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700/50">
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <PackageX className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
                      <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No items found</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageData.map((item) => {
                  const status    = itemStatus(item);
                  const avail     = availableQty(item);
                  const stBadge   = STATUS_BADGE[status];
                  const condBadge = CONDITION_BADGE[item.condition];
                  const value     = item.totalQty * item.unitCost;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">

                      {/* Item */}
                      <td className="py-3 pl-4 pr-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white ${avatarColor(item.id)}`}>
                            {initials(item.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-zinc-100 leading-tight truncate max-w-[200px]">{item.name}</p>
                            <p className="text-xs text-gray-400 dark:text-zinc-500 truncate max-w-[200px]">{item.location}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                          {item.category}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-3 py-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 tabular-nums">{item.totalQty}</span>
                      </td>

                      {/* Available */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
                            <div
                              className={`h-1.5 rounded-full transition-all ${
                                avail <= 0
                                  ? "bg-red-500"
                                  : avail / item.totalQty <= 0.15
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: item.totalQty > 0 ? `${Math.round((avail / item.totalQty) * 100)}%` : "0%" }}
                            />
                          </div>
                          <span className={`text-xs font-semibold tabular-nums ${
                            avail <= 0
                              ? "text-red-600 dark:text-red-400"
                              : avail / item.totalQty <= 0.15
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}>
                            {avail}
                          </span>
                        </div>
                      </td>

                      {/* Damaged */}
                      <td className="px-3 py-3">
                        {item.damaged > 0 ? (
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                            <AlertTriangle className="h-3 w-3" />
                            {item.damaged}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400 dark:text-zinc-500">—</span>
                        )}
                      </td>

                      {/* Condition */}
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${condBadge.cls}`}>
                          {condBadge.label}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${stBadge.cls}`}>
                          {stBadge.label}
                        </span>
                      </td>

                      {/* Value */}
                      <td className="px-3 py-3">
                        <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 tabular-nums">{formatCurrency(value)}</span>
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
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-zinc-700 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              Page {page} of {totalPages}
            </p>
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
