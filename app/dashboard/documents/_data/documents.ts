export type DocCategory = "Circular" | "Policy" | "Form" | "Notice";
export type DocAudience = "All" | "Staff" | "Parents" | "Students";
export type FileKind = "pdf" | "doc" | "xlsx" | "image";

export interface SchoolDocument {
  id: string;
  title: string;
  category: DocCategory;
  audience: DocAudience;
  fileKind: FileKind;
  sizeKb: number;
  uploadedBy: string;
  uploadedDate: string; // ISO
}

export const CATEGORIES: DocCategory[] = ["Circular", "Policy", "Form", "Notice"];
export const AUDIENCES: DocAudience[] = ["All", "Staff", "Parents", "Students"];

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatSize(kb: number): string {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}
