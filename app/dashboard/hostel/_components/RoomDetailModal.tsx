"use client";

import { X, BedDouble, Users, Phone } from "lucide-react";
import { ROOM_STATUS_BADGE, ROOM_TYPE_LABEL, FEE_BADGE, avatarColor, initials } from "../_data/hostel";
import type { HostelRoom, HostelStudent } from "../_data/hostel";

interface RoomDetailModalProps {
  room: HostelRoom;
  occupants: HostelStudent[];
  onClose: () => void;
}

export function RoomDetailModal({ room, occupants, onClose }: RoomDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10"><BedDouble className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /></div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Room {room.roomNo}</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500">Block {room.block} · Floor {room.floor}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 dark:text-zinc-500">Type</p>
              <p className="font-medium text-gray-800 dark:text-zinc-200">{ROOM_TYPE_LABEL[room.type]}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-zinc-500">Status</p>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${ROOM_STATUS_BADGE[room.status]}`}>{room.status}</span>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-zinc-500">Occupancy</p>
              <p className="font-medium text-gray-800 dark:text-zinc-200">{room.occupied} / {room.capacity}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-zinc-500">Warden</p>
              <p className="font-medium text-gray-800 dark:text-zinc-200">{room.warden}</p>
            </div>
          </div>

          {room.amenities.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs text-gray-400 dark:text-zinc-500">Amenities</p>
              <div className="flex flex-wrap gap-1.5">
                {room.amenities.map((a) => (
                  <span key={a} className="rounded-md bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:text-zinc-400">{a}</span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-zinc-400">
              <Users className="h-3.5 w-3.5" /> Occupants ({occupants.length})
            </p>
            {occupants.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-200 dark:border-zinc-700 py-6 text-center text-xs text-gray-400 dark:text-zinc-500">No students housed in this room</p>
            ) : (
              <div className="space-y-2">
                {occupants.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-lg border border-gray-100 dark:border-zinc-800 p-2.5">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${avatarColor(s.id)}`}>{initials(s.studentName)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-zinc-100">{s.studentName}</p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">{s.classNum}–{s.section} · {s.rollNo}</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${FEE_BADGE[s.feeStatus]}`}>{s.feeStatus}</span>
                    <a href={`tel:${s.phone}`} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"><Phone className="h-3.5 w-3.5" /></a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
