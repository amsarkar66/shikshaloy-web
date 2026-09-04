import type { LucideIcon } from "lucide-react";

export interface DocStep {
  heading: string;
  body: string[];
}

export interface DocArticle {
  slug: string;
  title: string;
  summary: string;
  steps: DocStep[];
  tips?: string[];
}

export interface DocRole {
  slug: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind classes for icon color + background, e.g. "text-violet-600 bg-violet-100". */
  colorClass: string;
  articles: DocArticle[];
}
