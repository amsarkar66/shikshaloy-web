"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import jsQR from "jsqr";
import { LogIn, LogOut, Camera, CheckCircle2, AlertCircle, CreditCard } from "lucide-react";
import { checkInByQrToken, checkInByRfidTap, type QrCheckInResult } from "../actions";

interface ScanEntry extends QrCheckInResult {
  id: string;
  ok: boolean;
  message?: string;
}

const RESCAN_COOLDOWN_MS = 4000;
// Keyboard-wedge RFID readers type a card UID + Enter far faster than a
// human can type; anything under this elapsed time is treated as a tap.
const RFID_WEDGE_MAX_MS = 1000;

export default function ScanClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rfidInputRef = useRef<HTMLInputElement>(null);
  const rfidStartAt = useRef<number | null>(null);
  const lastScan = useRef<{ id: string; at: number } | null>(null);
  const eventRef = useRef<"in" | "out">("in");

  const [event, setEvent] = useState<"in" | "out">("in");
  const [rfidValue, setRfidValue] = useState("");
  const [entries, setEntries] = useState<ScanEntry[]>([]);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  eventRef.current = event;

  function runCheckIn(dedupeKey: string, run: () => Promise<QrCheckInResult>) {
    const now = Date.now();
    if (lastScan.current && lastScan.current.id === dedupeKey && now - lastScan.current.at < RESCAN_COOLDOWN_MS) return;
    lastScan.current = { id: dedupeKey, at: now };

    startTransition(async () => {
      try {
        const result = await run();
        setEntries((prev) => [{ ...result, id: `${dedupeKey}-${now}`, ok: true }, ...prev].slice(0, 12));
      } catch (err) {
        const failed: ScanEntry = {
          id: `${dedupeKey}-${now}`,
          ok: false,
          name: "Unrecognized",
          role: "student",
          event: eventRef.current,
          time: new Date().toISOString(),
          message: err instanceof Error ? err.message : "Scan failed",
        };
        setEntries((prev) => [failed, ...prev].slice(0, 12));
      }
    });
  }

  function handleQrToken(token: string) {
    runCheckIn(token, () => checkInByQrToken(token, eventRef.current));
  }

  function handleRfidUid(uid: string) {
    runCheckIn(uid, () => checkInByRfidTap(uid, eventRef.current));
  }

  function focusRfidInput() {
    rfidInputRef.current?.focus();
  }

  function handleRfidChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (rfidStartAt.current === null && value.length > 0) rfidStartAt.current = Date.now();
    setRfidValue(value);
  }

  function handleRfidKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const uid = rfidValue.trim();
    const startedAt = rfidStartAt.current;
    setRfidValue("");
    rfidStartAt.current = null;
    if (!uid || uid.length < 4) return;
    if (startedAt && Date.now() - startedAt > RFID_WEDGE_MAX_MS) return; // typed too slowly to be a wedge reader
    handleRfidUid(uid);
  }

  useEffect(() => {
    let stream: MediaStream | null = null;
    let rafId = 0;
    let cancelled = false;

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(frame.data, frame.width, frame.height);
          if (code?.data) handleQrToken(code.data);
        }
      }
      rafId = requestAnimationFrame(tick);
    }

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch {
        setCameraError("Couldn't access the camera. Check browser permissions and try again.");
      }
    }

    start();
    focusRfidInput();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // Mount-once camera loop; handleQrToken only closes over refs/setState
    // (both stable), so it doesn't need to be in the dependency array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full px-6 py-6 space-y-5" onClick={focusRfidInput}>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Scan Attendance</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Show the student&apos;s ID card to the camera, or tap an RFID card on the connected reader.</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1">
          <button
            onClick={() => setEvent("in")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${event === "in" ? "bg-emerald-500 text-white" : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}
          >
            <LogIn className="h-3.5 w-3.5" /> Check In
          </button>
          <button
            onClick={() => setEvent("out")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${event === "out" ? "bg-amber-500 text-white" : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100"}`}
          >
            <LogOut className="h-3.5 w-3.5" /> Check Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
        <div className="relative rounded-2xl border border-gray-200 dark:border-zinc-800 bg-black overflow-hidden aspect-video">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          <canvas ref={canvasRef} className="hidden" />
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 text-center px-6">
              <AlertCircle className="h-6 w-6 text-red-400" />
              <p className="text-sm text-white">{cameraError}</p>
            </div>
          )}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white">
            <Camera className="h-3 w-3" /> Live
          </div>
          <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white">
            <CreditCard className="h-3 w-3" /> RFID reader ready
          </div>
          {/* Hidden, always-focused field: a USB "keyboard wedge" RFID reader
              types the card UID + Enter into whatever has focus. Kept off
              the video feed so it doesn't cover it. */}
          <input
            ref={rfidInputRef}
            value={rfidValue}
            onChange={handleRfidChange}
            onKeyDown={handleRfidKeyDown}
            onBlur={() => setTimeout(focusRfidInput, 0)}
            className="absolute h-0 w-0 opacity-0"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden flex flex-col max-h-[480px]">
          <div className="border-b border-gray-100 dark:border-zinc-700/50 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Recent scans</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-700/50">
            {entries.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-400 dark:text-zinc-500">Waiting for the first scan…</p>
            ) : entries.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${e.ok ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-red-500/10 text-red-600 dark:text-red-400"}`}>
                  {e.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{e.name}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">
                    {e.ok ? `${e.role === "student" ? "Student" : "Staff"} · ${e.event === "in" ? "Checked in" : "Checked out"}` : e.message}
                  </p>
                </div>
                <span className="text-[11px] text-gray-400 dark:text-zinc-500 tabular-nums shrink-0">
                  {new Date(e.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
