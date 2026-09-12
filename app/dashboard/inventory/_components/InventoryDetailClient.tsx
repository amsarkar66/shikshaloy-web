"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Pencil, MoreHorizontal, Trash2, Package, PackageCheck, Wrench, IndianRupee,
  FileText, SlidersHorizontal, ClipboardList,
} from "lucide-react";
import { Table, TableHead, TableBody, Th, Td, Tr } from "@/components/ui/data-table";
import { FancyButton } from "@/components/ui/fancy-button";
import { ItemFormModal } from "./ItemFormModal";
import { DeleteItemModal } from "./DeleteItemModal";
import { AdjustStockModal } from "./AdjustStockModal";
import {
  itemStatus, availableQty, avatarColor, initials, formatCurrency, formatDate, formatDateTime,
  STATUS_BADGE, CONDITION_BADGE,
  type InventoryItem, type ActivityLogEntry,
} from "../_data/inventory";

const EVENT_BADGE: Record<ActivityLogEntry["eventType"], { label: string; cls: string }> = {
  created:        { label: "Created",        cls: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" },
  updated:        { label: "Updated",        cls: "bg-blue-500/10   text-blue-600   dark:text-blue-400   border-blue-500/20"   },
  stock_adjusted: { label: "Stock Adjusted", cls: "bg-amber-500/10  text-amber-600  dark:text-amber-400  border-amber-500/20"  },
};

function MoreMenu({ open, onToggle, onDelete }: { open: boolean; onToggle: () => void; onDelete: () => void }) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        title="More actions"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={onToggle} />
          <div className="absolute right-0 top-full mt-1.5 z-20 w-48 overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg shadow-black/10 py-1">
            <button
              onClick={() => { onToggle(); onDelete(); }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-zinc-700/60 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              Delete Item
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function InventoryDetailClient({
  item, activity, categories,
}: {
  item: InventoryItem;
  activity: ActivityLogEntry[];
  categories: string[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const status = itemStatus(item);
  const avail = availableQty(item);
  const value = item.totalQty * item.unitCost;
  const stBadge = STATUS_BADGE[status];
  const condBadge = CONDITION_BADGE[item.condition];

  const stats = [
    { label: "Total Qty",   value: String(item.totalQty),        icon: Package,      accent: "text-indigo-500  bg-indigo-500/10"  },
    { label: "Available",   value: String(avail),                icon: PackageCheck, accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Damaged",     value: String(item.damaged),         icon: Wrench,       accent: "text-amber-500   bg-amber-500/10"   },
    { label: "Total Value", value: formatCurrency(value),        icon: IndianRupee,  accent: "text-blue-500    bg-blue-500/10"    },
  ];

  const total = item.totalQty || 1;
  const availPct = Math.max(0, (avail / total) * 100);
  const inUsePct = Math.max(0, (item.inUse / total) * 100);
  const damagedPct = Math.max(0, (item.damaged / total) * 100);

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/dashboard/inventory" className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Inventory
        </Link>
        <div className="flex items-center gap-2">
          <FancyButton size="sm" onClick={() => setEditing(true)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </FancyButton>
          <MoreMenu open={menuOpen} onToggle={() => setMenuOpen((o) => !o)} onDelete={() => setDeleting(true)} />
        </div>
      </div>

      {/* Header */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm ${avatarColor(item.id)}`}>
            {initials(item.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">{item.name}</h1>
              <span className="inline-flex items-center rounded-lg bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300">{item.category}</span>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${condBadge.cls}`}>{condBadge.label}</span>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${stBadge.cls}`}>{stBadge.label}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-zinc-400">
              <span>{item.location}</span>
              {item.schoolName && (
                <>
                  <span>·</span>
                  <span>{item.schoolName}</span>
                </>
              )}
              <span>·</span>
              <span>Updated {formatDate(item.lastUpdated)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
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

      {/* Quantity breakdown */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Quantity Breakdown</p>
        <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-zinc-700">
          {availPct > 0 && <div className="h-full bg-emerald-500" style={{ width: `${availPct}%` }} />}
          {inUsePct > 0 && <div className="h-full bg-blue-500" style={{ width: `${inUsePct}%` }} />}
          {damagedPct > 0 && <div className="h-full bg-red-500" style={{ width: `${damagedPct}%` }} />}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-600 dark:text-zinc-400">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Available: <span className="font-semibold text-gray-900 dark:text-zinc-100">{avail}</span></span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500" /> In Use: <span className="font-semibold text-gray-900 dark:text-zinc-100">{item.inUse}</span></span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> Damaged: <span className="font-semibold text-gray-900 dark:text-zinc-100">{item.damaged}</span></span>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-zinc-100">
          <FileText className="h-4 w-4 text-gray-400 dark:text-zinc-500" /> Notes
        </p>
        {item.notes ? (
          <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600 dark:text-zinc-300">{item.notes}</p>
        ) : (
          <p className="mt-2 text-sm text-gray-400 dark:text-zinc-500">No notes added.</p>
        )}
      </div>

      {/* Activity log */}
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-zinc-100">
          <ClipboardList className="h-4 w-4 text-primary-500" /> Activity Log
        </p>
        <button
          onClick={() => setAdjusting(true)}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> Adjust Stock
        </button>
      </div>

      <Table>
        <TableHead>
          <Th position="first">Date</Th>
          <Th>Event</Th>
          <Th>Details</Th>
          <Th position="last">By</Th>
        </TableHead>
        <TableBody>
          {activity.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <ClipboardList className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
                  <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No activity yet</p>
                </div>
              </td>
            </tr>
          ) : (
            activity.map((a) => {
              const badge = EVENT_BADGE[a.eventType];
              return (
                <Tr key={a.id}>
                  <Td position="first"><span className="text-xs text-gray-500 dark:text-zinc-400 whitespace-nowrap">{formatDateTime(a.createdAt)}</span></Td>
                  <Td><span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badge.cls}`}>{badge.label}</span></Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-700 dark:text-zinc-300">{a.description}</p>
                      {a.delta !== null && (
                        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${a.delta > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                          {a.delta > 0 ? "+" : ""}{a.delta}
                        </span>
                      )}
                    </div>
                    {a.reason && <p className="mt-0.5 text-xs text-gray-400 dark:text-zinc-500">Reason: {a.reason}</p>}
                  </Td>
                  <Td position="last"><span className="text-sm text-gray-600 dark:text-zinc-400">{a.actorName}</span></Td>
                </Tr>
              );
            })
          )}
        </TableBody>
      </Table>

      {editing && (
        <ItemFormModal
          mode="edit"
          item={item}
          categories={categories}
          onClose={() => setEditing(false)}
          onSaved={() => router.refresh()}
        />
      )}

      {deleting && (
        <DeleteItemModal
          item={item}
          onClose={() => setDeleting(false)}
          onDeleted={() => router.push("/dashboard/inventory")}
        />
      )}

      {adjusting && (
        <AdjustStockModal
          item={item}
          onClose={() => setAdjusting(false)}
          onAdjusted={() => router.refresh()}
        />
      )}
    </div>
  );
}
