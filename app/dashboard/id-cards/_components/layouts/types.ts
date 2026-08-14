import type { CardPerson } from "../../_data/people";
import type { IdCardTemplate, CardOrientation, IdCardVisibleFields } from "@/lib/id-cards/templates";

// Every layout component (one per IdCardLayout key) renders a full card from this
// same contract, so a template can pair any layout with any color scheme.
export interface CardLayoutProps {
  person: CardPerson;
  template: IdCardTemplate;
  orientation: CardOrientation;
  widthMm: number;
  heightMm: number;
  showBarcode: boolean;
  showQr: boolean;
  visibleFields: IdCardVisibleFields;
  schoolName: string;
  schoolLogoUrl: string | null;
  className?: string;
}
