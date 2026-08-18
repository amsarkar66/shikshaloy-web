"use client";

import { useState } from "react";
import { X, Loader2, ChevronDown, Plus, Trash2 } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { createRoute, updateRoute } from "../actions";
import type { Route, RouteStatus } from "../_data/transport";
import type { DriverOption } from "../actions";

interface RouteModalProps {
  route?: Route | null;
  drivers: DriverOption[];
  onClose: () => void;
  onSaved: () => void;
}

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60 disabled:cursor-not-allowed";

const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

export function RouteModal({ route, drivers, onClose, onSaved }: RouteModalProps) {
  const isEdit = !!route;
  const [routeNo, setRouteNo] = useState(route?.routeNo ?? "");
  const [routeName, setRouteName] = useState(route?.routeName ?? "");
  const [driverId, setDriverId] = useState(route?.driverId ?? "");
  const [driverPhone, setDriverPhone] = useState(route?.driverPhone ?? "");
  const [stops, setStops] = useState<string[]>(route?.stops.length ? route.stops : [""]);
  const [capacity, setCapacity] = useState(String(route?.capacity ?? 40));
  const [status, setStatus] = useState<RouteStatus>(route?.status ?? "active");
  const [morningDeparture, setMorningDeparture] = useState(route?.morningDeparture ?? "");
  const [eveningDeparture, setEveningDeparture] = useState(route?.eveningDeparture ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateStop(idx: number, value: string) {
    setStops((prev) => prev.map((s, i) => (i === idx ? value : s)));
  }

  function addStop() {
    setStops((prev) => [...prev, ""]);
  }

  function removeStop(idx: number) {
    setStops((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!routeNo.trim() || !routeName.trim()) {
      setError("Route number and name are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const input = {
        routeNo: routeNo.trim(),
        routeName: routeName.trim(),
        driverId: driverId || null,
        driverPhone: driverPhone || null,
        stops,
        capacity: Number(capacity) || 0,
        status,
        morningDeparture: morningDeparture || null,
        eveningDeparture: eveningDeparture || null,
      };
      if (isEdit) {
        await updateRoute({ ...input, id: route.id });
      } else {
        await createRoute(input);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save route");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{isEdit ? "Edit Route" : "Add Route"}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Route Number *</label>
              <input className={inputClass} value={routeNo} onChange={(e) => setRouteNo(e.target.value)} placeholder="e.g. R-01" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Route Name *</label>
              <input className={inputClass} value={routeName} onChange={(e) => setRouteName(e.target.value)} placeholder="e.g. North Loop" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Driver</label>
              <div className="relative">
                <select
                  className={selectClass}
                  value={driverId}
                  onChange={(e) => {
                    setDriverId(e.target.value);
                    const d = drivers.find((d) => d.id === e.target.value);
                    if (d?.phone) setDriverPhone(d.phone);
                  }}
                >
                  <option value="">— Unassigned —</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Driver Phone</label>
              <input className={inputClass} value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} placeholder="e.g. 98765 43210" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Capacity</label>
              <input type="number" min={1} className={inputClass} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Status</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setStatus("active")} className={`h-9 flex-1 rounded-lg text-sm font-medium transition-colors ${status === "active" ? "bg-emerald-500 text-white" : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400"}`}>Active</button>
                <button type="button" onClick={() => setStatus("inactive")} className={`h-9 flex-1 rounded-lg text-sm font-medium transition-colors ${status === "inactive" ? "bg-zinc-500 text-white" : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400"}`}>Inactive</button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Morning Departure</label>
              <input type="time" className={inputClass} value={morningDeparture ?? ""} onChange={(e) => setMorningDeparture(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Evening Departure</label>
              <input type="time" className={inputClass} value={eveningDeparture ?? ""} onChange={(e) => setEveningDeparture(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Stops</label>
            <div className="space-y-2">
              {stops.map((stop, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-[10px] font-bold text-primary-600 dark:text-primary-400">{idx + 1}</span>
                  <input className={inputClass} value={stop} onChange={(e) => updateStop(idx, e.target.value)} placeholder={`Stop ${idx + 1}`} />
                  <button type="button" onClick={() => removeStop(idx)} disabled={stops.length <= 1} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-red-500 disabled:opacity-30 disabled:pointer-events-none">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addStop} className="flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">
                <Plus className="h-3.5 w-3.5" /> Add stop
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
              Cancel
            </button>
            <FancyButton type="submit" disabled={busy} size="sm">
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Route"}
            </FancyButton>
          </div>
        </form>
      </div>
    </div>
  );
}
