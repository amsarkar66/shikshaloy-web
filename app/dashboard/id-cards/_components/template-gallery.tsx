"use client";

import { Check } from "lucide-react";
import { ID_CARD_TEMPLATES, type IdCardLayout } from "@/lib/id-cards/templates";

// Mirrors the selected layout's actual composition so each color swatch previews
// what that combination will really look like, not a generic mock.
function getSkeleton(layoutId: IdCardLayout) {
  switch (layoutId) {
    case "classic-centered":
    default:
      return {
        avatar: "left-1/2 top-3 h-5 w-5 -translate-x-1/2",
        line1: "left-1/2 top-10 h-1.5 w-10 -translate-x-1/2",
        line2: "left-1/2 top-[3.25rem] h-1.5 w-7 -translate-x-1/2",
      };
  }
}

export function TemplateGallery({
  selectedId, layoutId, onSelect,
}: {
  selectedId: string;
  layoutId: IdCardLayout;
  onSelect: (id: string) => void;
}) {
  const skeleton = getSkeleton(layoutId);

  return (
    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
      {ID_CARD_TEMPLATES.map((t) => {
        const active = t.id === selectedId;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className="flex w-[calc((100%-2.25rem)/4)] shrink-0 snap-start flex-col items-center gap-1.5 text-left"
          >
            <div
              className={`relative h-20 w-full overflow-hidden rounded-lg ${t.swatch} ${
                active ? "ring-2 ring-inset ring-primary-500" : ""
              }`}
            >
              <div className={`absolute rounded-full ${t.swatchIsLight ? "bg-gray-400/70" : "bg-white/70"} ${skeleton.avatar}`} />
              <div className={`absolute rounded-full ${t.swatchIsLight ? "bg-gray-400/50" : "bg-white/50"} ${skeleton.line1}`} />
              <div className={`absolute rounded-full ${t.swatchIsLight ? "bg-gray-400/30" : "bg-white/30"} ${skeleton.line2}`} />
              {active && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-white">
                  <Check className="h-2.5 w-2.5" />
                </span>
              )}
            </div>
            <p className={`w-full truncate text-center text-[11px] font-medium ${active ? "text-primary-600 dark:text-primary-400" : "text-gray-600 dark:text-zinc-400"}`}>
              {t.name}
            </p>
          </button>
        );
      })}
    </div>
  );
}
