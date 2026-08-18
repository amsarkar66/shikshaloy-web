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

export const CERT_DOCUMENT_TITLE: Record<CertType, string> = {
  bonafide:  "Bonafide Certificate",
  transfer:  "Transfer Certificate",
  character: "Character Certificate",
  study:     "Study Certificate",
};

export function certificateBody(params: {
  certType: CertType;
  studentName: string;
  rollNo: string;
  classLabel: string;
  purpose: string;
  schoolName: string;
  academicYear: string;
}): string[] {
  const { certType, studentName, rollNo, classLabel, purpose, schoolName, academicYear } = params;
  const yearClause = academicYear ? ` during the academic year ${academicYear}` : "";
  switch (certType) {
    case "bonafide":
      return [
        `This is to certify that ${studentName} (Roll No. ${rollNo}) is a bona fide student of ${schoolName}, studying in Class ${classLabel}${yearClause}.`,
        `This certificate is issued on the student's request for the purpose of ${purpose}.`,
      ];
    case "transfer":
      return [
        `This is to certify that ${studentName} (Roll No. ${rollNo}) was a bona fide student of ${schoolName}, studying in Class ${classLabel}${yearClause}.`,
        `This Transfer Certificate is issued on request for the purpose of ${purpose}. The student's conduct during the period of study at this institution was found to be satisfactory.`,
      ];
    case "character":
      return [
        `This is to certify that ${studentName} (Roll No. ${rollNo}), studying in Class ${classLabel} at ${schoolName}, has, to the best of our knowledge, borne a good moral character during their period of study at this institution.`,
        `This certificate is issued on request for the purpose of ${purpose}.`,
      ];
    case "study":
      return [
        `This is to certify that ${studentName} (Roll No. ${rollNo}) is currently studying in Class ${classLabel} at ${schoolName}${yearClause}.`,
        `This certificate is issued on request for the purpose of ${purpose}.`,
      ];
  }
}
