// A layout controls card *structure* (photo/QR/field placement, spacing, dividers)
// and is picked independently of a template's colors — see LAYOUT_OPTIONS below.
// New structural designs get their own layout key + component under ./_components/layouts.
export type IdCardLayout = "classic-centered";

export interface LayoutOption {
  id: IdCardLayout;
  name: string;
  description: string;
}

export const LAYOUT_OPTIONS: LayoutOption[] = [
  { id: "classic-centered", name: "Classic Centered", description: "Centered photo, name and fields with a symmetric divider" },
];

export const DEFAULT_CARD_LAYOUT_ID = LAYOUT_OPTIONS[0].id;

export interface IdCardTemplate {
  id: string;
  name: string;
  swatch: string;
  // True when `swatch`'s background is light (e.g. white) — the swatch preview
  // skeleton needs dark dots there instead of the usual light/white ones.
  swatchIsLight?: boolean;
  header: string;
  headerText: string;
  headerSubtext: string;
  crestBox: string;
  crestIcon: string;
  accent: string;
  badge: string;
  tag: string;
  // The template fully owns the card's own colors below — deliberately no
  // `dark:` variants anywhere in a template. A card's appearance is fixed by
  // whichever template is selected and must not shift with the app's light/
  // dark mode toggle (that toggle only affects the surrounding dashboard UI).
  cardBg: string;
  cardBorder: string;
  photoRing: string;
  nameText: string;
  mutedText: string;
  valueText: string;
  // Backdrop behind the ID number overlaid on the barcode lines — same hue as
  // `cardBg` but with opacity, so it reads on top of the barcode's white strip
  // without fully blocking the bars.
  barcodeLabelBg: string;
}

export const ID_CARD_TEMPLATES: IdCardTemplate[] = [
  {
    id: "modern-blue",
    name: "Modern Blue",
    swatch: "bg-gradient-to-br from-indigo-600 to-blue-500",
    header: "bg-gradient-to-r from-indigo-600 to-blue-600",
    headerText: "text-white",
    headerSubtext: "text-indigo-100",
    crestBox: "bg-white/15",
    crestIcon: "text-white",
    accent: "bg-amber-400",
    badge: "bg-indigo-600 text-white",
    tag: "text-indigo-600",
    cardBg: "bg-white",
    cardBorder: "border-gray-200",
    photoRing: "ring-white",
    nameText: "text-gray-900",
    mutedText: "text-gray-400",
    valueText: "text-gray-800",
    barcodeLabelBg: "bg-white/80",
  },
  {
    id: "green-wave",
    name: "Green Wave",
    swatch: "bg-gradient-to-br from-emerald-600 to-teal-500",
    header: "bg-gradient-to-r from-emerald-600 to-teal-500",
    headerText: "text-white",
    headerSubtext: "text-emerald-100",
    crestBox: "bg-white/15",
    crestIcon: "text-white",
    accent: "bg-lime-300",
    badge: "bg-emerald-600 text-white",
    tag: "text-emerald-600",
    cardBg: "bg-white",
    cardBorder: "border-gray-200",
    photoRing: "ring-white",
    nameText: "text-gray-900",
    mutedText: "text-gray-400",
    valueText: "text-gray-800",
    barcodeLabelBg: "bg-white/80",
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    swatch: "bg-gradient-to-br from-violet-700 to-fuchsia-600",
    header: "bg-gradient-to-r from-violet-700 to-fuchsia-600",
    headerText: "text-white",
    headerSubtext: "text-violet-100",
    crestBox: "bg-white/15",
    crestIcon: "text-white",
    accent: "bg-amber-300",
    badge: "bg-violet-600 text-white",
    tag: "text-violet-600",
    cardBg: "bg-white",
    cardBorder: "border-gray-200",
    photoRing: "ring-white",
    nameText: "text-gray-900",
    mutedText: "text-gray-400",
    valueText: "text-gray-800",
    barcodeLabelBg: "bg-white/80",
  },
  {
    id: "minimal-white",
    name: "Minimal White",
    swatch: "bg-white border border-gray-300",
    swatchIsLight: true,
    header: "bg-gray-100",
    headerText: "text-gray-900",
    headerSubtext: "text-gray-500",
    crestBox: "bg-primary-500",
    crestIcon: "text-white",
    accent: "bg-primary-500",
    badge: "bg-gray-900 text-white",
    tag: "text-gray-700",
    cardBg: "bg-white",
    cardBorder: "border-gray-200",
    photoRing: "ring-white",
    nameText: "text-gray-900",
    mutedText: "text-gray-400",
    valueText: "text-gray-800",
    barcodeLabelBg: "bg-white/80",
  },
  {
    id: "dark-navy",
    name: "Dark Navy",
    swatch: "bg-gradient-to-br from-slate-900 to-slate-700",
    header: "bg-gradient-to-r from-slate-900 to-slate-800",
    headerText: "text-white",
    headerSubtext: "text-slate-300",
    crestBox: "bg-white/10",
    crestIcon: "text-sky-400",
    accent: "bg-sky-400",
    badge: "bg-sky-500 text-white",
    tag: "text-sky-400",
    cardBg: "bg-slate-900",
    cardBorder: "border-slate-700",
    photoRing: "ring-slate-900",
    nameText: "text-slate-50",
    mutedText: "text-slate-400",
    valueText: "text-slate-200",
    barcodeLabelBg: "bg-slate-900/80",
  },
];

export const DEFAULT_TEMPLATE_ID = ID_CARD_TEMPLATES[0].id;

export interface CardSizeOption {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
}

// Real-world card sizes. "Standard" is ISO/IEC 7810 ID-1 — the credit-card-size
// PVC format used for the vast majority of student/employee ID cards (also known
// by the trade name "CR80"). "Large Badge" is the common 4"×3" lanyard-badge size.
export const CARD_SIZES: CardSizeOption[] = [
  { id: "standard-cr80", label: "Standard — CR80 / ID-1 (85.6 × 54 mm)", widthMm: 85.6, heightMm: 54 },
  { id: "large-badge", label: "Large Badge (101.6 × 76.2 mm)", widthMm: 101.6, heightMm: 76.2 },
];

export const DEFAULT_CARD_SIZE_ID = CARD_SIZES[0].id;

export type CardOrientation = "vertical" | "horizontal";

// Name, photo and Student/Staff ID always show — these are the optional detail rows.
export interface IdCardVisibleFields {
  admissionNo: boolean;
  dob: boolean;
  bloodGroup: boolean;
  phone: boolean;
}

export const ID_CARD_FIELD_OPTIONS: { key: keyof IdCardVisibleFields; label: string }[] = [
  { key: "admissionNo", label: "Admission No." },
  { key: "dob", label: "Date of Birth" },
  { key: "bloodGroup", label: "Blood Group" },
  { key: "phone", label: "Phone Number" },
];

export interface IdCardSettings {
  templateId: string;
  layoutId: IdCardLayout;
  cardSizeId: string;
  orientation: CardOrientation;
  showBarcode: boolean;
  showQr: boolean;
  visibleFields: IdCardVisibleFields;
}

export const DEFAULT_ID_CARD_SETTINGS: IdCardSettings = {
  templateId: DEFAULT_TEMPLATE_ID,
  layoutId: DEFAULT_CARD_LAYOUT_ID,
  cardSizeId: DEFAULT_CARD_SIZE_ID,
  orientation: "vertical",
  showBarcode: true,
  showQr: true,
  visibleFields: { admissionNo: true, dob: true, bloodGroup: true, phone: true },
};

export const ID_CARD_SETTINGS_STORAGE_KEY = "shikshaloy.idCardSettings.v1";
