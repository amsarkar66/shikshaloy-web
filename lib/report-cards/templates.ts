// Color theme for the printable exam Grade Card — the same "pick a theme,
// toggle optional fields" pattern used by ID Cards (lib/id-cards/templates.ts),
// applied to report cards. Deliberately no `dark:` variants: a printed
// document's colors must not shift with the dashboard's light/dark toggle.
export interface ReportCardTemplate {
  id: string;
  name: string;
  swatch: string;
  header: string;
  headerText: string;
  headerSubtext: string;
  crestBox: string;
  crestIcon: string;
  accent: string;
}

export const REPORT_CARD_TEMPLATES: ReportCardTemplate[] = [
  {
    id: "primary-classic",
    name: "Primary Classic",
    swatch: "bg-gradient-to-br from-primary-600 to-primary-500",
    header: "bg-primary-600",
    headerText: "text-white",
    headerSubtext: "text-primary-200",
    crestBox: "bg-white/20",
    crestIcon: "text-white",
    accent: "text-primary-600",
  },
  {
    id: "modern-blue",
    name: "Modern Blue",
    swatch: "bg-gradient-to-br from-indigo-600 to-blue-500",
    header: "bg-gradient-to-r from-indigo-600 to-blue-600",
    headerText: "text-white",
    headerSubtext: "text-indigo-100",
    crestBox: "bg-white/15",
    crestIcon: "text-white",
    accent: "text-indigo-600",
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
    accent: "text-emerald-600",
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
    accent: "text-violet-600",
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
    accent: "text-sky-600",
  },
];

export const DEFAULT_REPORT_CARD_TEMPLATE_ID = REPORT_CARD_TEMPLATES[0].id;

export function getReportCardTemplate(id: string): ReportCardTemplate {
  return REPORT_CARD_TEMPLATES.find((t) => t.id === id) ?? REPORT_CARD_TEMPLATES[0];
}

// Student name, roll number, and the subject-wise marks/summary table always
// show — these are the optional extras.
export interface ReportCardVisibleFields {
  studentClass: boolean;
  attendance: boolean;
  rank: boolean;
}

export const REPORT_CARD_FIELD_OPTIONS: { key: keyof ReportCardVisibleFields; label: string }[] = [
  { key: "studentClass", label: "Class" },
  { key: "attendance",   label: "Attendance %" },
  { key: "rank",         label: "Class Rank" },
];

export interface ReportCardSettings {
  templateId: string;
  visibleFields: ReportCardVisibleFields;
  footerNote: string;
}

export const DEFAULT_REPORT_CARD_SETTINGS: ReportCardSettings = {
  templateId: DEFAULT_REPORT_CARD_TEMPLATE_ID,
  visibleFields: { studentClass: true, attendance: true, rank: true },
  footerNote: "This is a computer-generated grade card.",
};
