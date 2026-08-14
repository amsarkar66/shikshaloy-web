import type { ComponentType } from "react";
import type { IdCardLayout } from "@/lib/id-cards/templates";
import type { CardLayoutProps } from "./types";
import { ClassicCenteredLayout } from "./classic-centered-layout";

// Add a new entry here (plus the matching IdCardLayout key + component) to make
// another structural design selectable by any template.
export const CARD_LAYOUTS: Record<IdCardLayout, ComponentType<CardLayoutProps>> = {
  "classic-centered": ClassicCenteredLayout,
};
