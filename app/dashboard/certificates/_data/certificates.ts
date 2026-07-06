export type CertType   = "bonafide" | "transfer" | "character" | "study";
export type CertStatus = "pending" | "ready" | "issued" | "rejected";

export const CERT_TYPE_LABEL: Record<CertType, string> = {
  bonafide:  "Bonafide",
  transfer:  "Transfer (TC)",
  character: "Character",
  study:     "Study Certificate",
};

export const CERT_TYPE_BADGE: Record<CertType, string> = {
  bonafide:  "bg-blue-500/10   text-blue-700   dark:text-blue-300",
  transfer:  "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  character: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  study:     "bg-amber-500/10  text-amber-700  dark:text-amber-300",
};

export const STATUS_BADGE: Record<CertStatus, { label: string; cls: string }> = {
  pending:  { label: "Pending",  cls: "bg-amber-500/10   text-amber-600   dark:text-amber-400   border-amber-500/20"   },
  ready:    { label: "Ready",    cls: "bg-blue-500/10    text-blue-600    dark:text-blue-400    border-blue-500/20"    },
  issued:   { label: "Issued",   cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  rejected: { label: "Rejected", cls: "bg-red-500/10     text-red-600     dark:text-red-400     border-red-500/20"     },
};

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
