"use client";

import type { CardPerson } from "../_data/people";
import { avatarColor, initials } from "../_data/people";
import type { IdCardTemplate, IdCardLayout, CardOrientation, IdCardVisibleFields } from "@/lib/id-cards/templates";
import { CARD_LAYOUTS } from "./layouts";

export interface IdCardProps {
  person: CardPerson;
  template: IdCardTemplate;
  layout: IdCardLayout;
  orientation: CardOrientation;
  widthMm: number;
  heightMm: number;
  showBarcode: boolean;
  showQr: boolean;
  visibleFields: IdCardVisibleFields;
  schoolName: string;
  schoolLogoUrl: string | null;
  variant?: "full" | "mini";
  className?: string;
}

// Mini thumbnails (used for batch previews) stay a single shared design across
// every template/layout — only the full-size card varies by the chosen layout.
export function IdCard({ variant = "full", className = "", layout, ...rest }: IdCardProps) {
  const { person, template } = rest;

  if (variant === "mini") {
    return (
      <div className={`id-card-mini w-24 shrink-0 overflow-hidden rounded-lg border shadow-sm ${template.cardBorder} ${template.cardBg} ${className}`}>
        <div className={`h-8 ${template.header}`} />
        <div className="flex flex-col items-center gap-1 px-2 pt-2 pb-2 -mt-4">
          <div className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-full ring-2 bg-white ${template.photoRing}`}>
            {person.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={person.photoUrl} alt={person.name} className="h-full w-full object-cover" />
            ) : (
              <div className={`flex h-full w-full items-center justify-center text-[10px] font-bold text-white ${avatarColor(person.id)}`}>
                {initials(person.name)}
              </div>
            )}
          </div>
          <p className={`w-full truncate text-center text-[10px] font-semibold ${template.nameText}`}>{person.name}</p>
          <p className={`truncate text-[8.5px] ${template.mutedText}`}>{person.subtitle}</p>
        </div>
      </div>
    );
  }

  const Layout = CARD_LAYOUTS[layout];
  return <Layout {...rest} className={className} />;
}
