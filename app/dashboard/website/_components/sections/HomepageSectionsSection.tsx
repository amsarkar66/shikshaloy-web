"use client";

import { useState } from "react";
import { GripVertical } from "lucide-react";
import { saveDraftSection } from "@/lib/site-settings/actions";
import type { HomepageSectionId, SiteSettings } from "@/lib/site-settings/types";
import { SaveRow, SectionCard, useDraftSave } from "../_field-kit";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const SECTION_LABELS: Record<HomepageSectionId, string> = {
  hero: "Hero / Carousel",
  stats: "Stats Strip",
  announcements: "Announcements",
  events: "Events",
  faculty: "Faculty",
  gallery: "Gallery",
  whyChooseUs: "Why Choose Us",
};

type Sections = SiteSettings["homepage"]["sections"];

export function HomepageSectionsSection({ value }: { value: SiteSettings["homepage"] }) {
  const [sections, setSections] = useState<Sections>(value.sections);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const { run, pending, error, saved } = useDraftSave((v: SiteSettings["homepage"]) => saveDraftSection("homepage", v));

  function reorder(fromId: string, toIndex: number) {
    const fromIndex = sections.findIndex((s) => s.id === fromId);
    if (fromIndex === -1 || fromIndex === toIndex) return;
    const next = [...sections];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setSections(next);
  }

  function toggle(index: number, visible: boolean) {
    const next = [...sections];
    next[index] = { ...next[index], visible };
    setSections(next);
  }

  return (
    <SectionCard title="Homepage Sections" description="Drag to reorder — choose which sections appear on your homepage, and in what order.">
      <div className="space-y-2">
        {sections.map((section, i) => (
          <div
            key={section.id}
            draggable
            onDragStart={() => setDraggedId(section.id)}
            onDragEnter={() => {
              if (draggedId && draggedId !== section.id) {
                reorder(draggedId, i);
                setOverId(section.id);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnd={() => {
              setDraggedId(null);
              setOverId(null);
            }}
            className={cn(
              "flex items-center gap-2 rounded-lg border bg-white dark:bg-zinc-900 px-3 py-2.5 transition-colors",
              draggedId === section.id
                ? "border-primary-300 dark:border-primary-700 opacity-50"
                : "border-gray-200 dark:border-zinc-800",
              overId === section.id && draggedId !== section.id && "border-primary-300 dark:border-primary-700"
            )}
          >
            <button
              type="button"
              className="cursor-grab text-gray-300 hover:text-gray-500 dark:text-zinc-700 dark:hover:text-zinc-400 active:cursor-grabbing"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <span className="flex-1 text-sm font-medium text-gray-900 dark:text-zinc-50">
              {SECTION_LABELS[section.id]}
            </span>
            <Switch size="sm" checked={section.visible} onCheckedChange={(visible) => toggle(i, visible)} />
          </div>
        ))}
      </div>
      <SaveRow pending={pending} error={error} saved={saved} onSave={() => run({ sections })} />
    </SectionCard>
  );
}
