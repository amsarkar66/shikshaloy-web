"use client";

import { useState, type ReactNode } from "react";
import { HelpCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FaqItem {
  q: string;
  a: string;
}

export function FaqAccordion({
  badge = "Need help?",
  heading,
  subtext,
  items,
}: {
  badge?: string;
  heading: string;
  subtext?: ReactNode;
  items: FaqItem[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div>
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
          <HelpCircle className="h-3.5 w-3.5" />
          {badge}
        </span>
        <h2 className="text-3xl font-extrabold tracking-tight text-balance text-zinc-900 sm:text-4xl">
          {heading}
        </h2>
        {subtext && <p className="mt-4 text-balance text-zinc-500">{subtext}</p>}
      </div>

      <div className="mx-auto max-w-2xl space-y-3">
        {items.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div
              key={item.q}
              className={cn(
                "rounded-2xl border bg-white px-6 py-5 transition-colors duration-200",
                isOpen ? "border-primary-100 shadow-sm" : "border-zinc-200"
              )}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 text-left"
              >
                <span
                  className={cn(
                    "text-sm",
                    isOpen ? "font-semibold text-zinc-900" : "font-medium text-zinc-700"
                  )}
                >
                  {item.q}
                </span>
                <span className="shrink-0 text-zinc-400">
                  <Plus
                    className={cn("h-4 w-4 transition-transform duration-300 ease-in-out", isOpen && "rotate-45")}
                  />
                </span>
              </button>
              <div
                className={cn(
                  "grid transition-[grid-template-rows] duration-300 ease-in-out",
                  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                )}
              >
                <div className="overflow-hidden">
                  <p className="mt-3 text-sm leading-relaxed text-zinc-500">{item.a}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
