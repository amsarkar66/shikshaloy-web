"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Monitor, Smartphone, Tablet } from "lucide-react";
import { cn } from "@/lib/utils";

const DEVICES = {
  mobile: { label: "Mobile", icon: Smartphone, width: 390 },
  tablet: { label: "Tablet", icon: Tablet, width: 834 },
  desktop: { label: "Desktop", icon: Monitor, width: "100%" as const },
};

type Device = keyof typeof DEVICES;

export function PreviewFrame() {
  const [device, setDevice] = useState<Device>("desktop");
  const width = DEVICES[device].width;

  return (
    <div className="flex h-[calc(100vh-60px)] flex-col bg-gray-100 dark:bg-zinc-950">
      <div className="flex shrink-0 items-center gap-3 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2.5">
        <Link
          href="/dashboard/website"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to editor
        </Link>

        <div className="ml-auto flex items-center gap-1 rounded-lg border border-gray-200 dark:border-zinc-800 p-0.5">
          {(Object.keys(DEVICES) as Device[]).map((key) => {
            const { label, icon: Icon } = DEVICES[key];
            return (
              <button
                key={key}
                onClick={() => setDevice(key)}
                title={label}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  device === key
                    ? "bg-primary-500/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400"
                    : "text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto p-4">
        <div
          className="h-full overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-800 bg-white shadow-sm transition-[width] duration-200"
          style={{ width }}
        >
          <iframe
            src="/api/website/preview"
            title="Website live preview"
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
