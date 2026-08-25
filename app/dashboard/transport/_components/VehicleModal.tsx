"use client";

import { useState } from "react";
import { X, Loader2, ChevronDown } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { DatePicker } from "@/components/ui/date-picker";
import { createVehicle, updateVehicle } from "../actions";
import type { Vehicle, VehicleStatus, FuelType } from "../_data/transport";
import type { DriverOption } from "../actions";

interface VehicleModalProps {
  vehicle?: Vehicle | null;
  drivers: DriverOption[];
  onClose: () => void;
  onSaved: () => void;
}

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-60 disabled:cursor-not-allowed";

const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

const FUEL_OPTIONS: FuelType[] = ["diesel", "cng", "electric"];

export function VehicleModal({ vehicle, drivers, onClose, onSaved }: VehicleModalProps) {
  const isEdit = !!vehicle;
  const [regNo, setRegNo] = useState(vehicle?.regNo ?? "");
  const [model, setModel] = useState(vehicle?.model ?? "");
  const [capacity, setCapacity] = useState(String(vehicle?.capacity ?? 40));
  const [year, setYear] = useState(String(vehicle?.year ?? new Date().getFullYear()));
  const [status, setStatus] = useState<VehicleStatus>(vehicle?.status ?? "active");
  const [driverId, setDriverId] = useState(vehicle?.driverId ?? "");
  const [fuelType, setFuelType] = useState<FuelType>(vehicle?.fuelType ?? "diesel");
  const [lastService, setLastService] = useState(vehicle?.lastService ?? "");
  const [nextService, setNextService] = useState(vehicle?.nextService ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!regNo.trim() || !model.trim()) {
      setError("Registration number and model are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const input = {
        regNo: regNo.trim(),
        model: model.trim(),
        capacity: Number(capacity) || 0,
        year: Number(year) || 0,
        status,
        driverId: driverId || null,
        fuelType,
        lastService: lastService || null,
        nextService: nextService || null,
      };
      if (isEdit) {
        await updateVehicle({ ...input, id: vehicle.id });
      } else {
        await createVehicle(input);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vehicle");
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
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{isEdit ? "Edit Vehicle" : "Add Vehicle"}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Registration No. *</label>
              <input className={`${inputClass} font-mono`} value={regNo} onChange={(e) => setRegNo(e.target.value)} placeholder="e.g. WB-06-A-1234" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Model *</label>
              <input className={inputClass} value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. Tata Starbus" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Capacity</label>
              <input type="number" min={1} className={inputClass} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Year</label>
              <input type="number" min={1990} max={2100} className={inputClass} value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Driver</label>
              <div className="relative">
                <select className={selectClass} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                  <option value="">— Unassigned —</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Fuel Type</label>
              <div className="relative">
                <select className={selectClass} value={fuelType} onChange={(e) => setFuelType(e.target.value as FuelType)}>
                  {FUEL_OPTIONS.map((f) => (
                    <option key={f} value={f} className="capitalize">{f}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Last Service</label>
              <DatePicker value={lastService ?? ""} onChange={setLastService} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Next Service</label>
              <DatePicker value={nextService ?? ""} onChange={setNextService} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Status</label>
              <div className="flex gap-2">
                {(["active", "maintenance", "inactive"] as VehicleStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`h-9 flex-1 rounded-lg text-sm font-medium capitalize transition-colors ${status === s ? (s === "active" ? "bg-emerald-500 text-white" : s === "maintenance" ? "bg-amber-500 text-white" : "bg-zinc-500 text-white") : "border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
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
              {isEdit ? "Save Changes" : "Add Vehicle"}
            </FancyButton>
          </div>
        </form>
      </div>
    </div>
  );
}
