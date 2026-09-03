"use client";

import { useMemo, useState, useTransition } from "react";
import {
  FolderOpen, File,
  Search, Upload, Download, X, Trash2, Megaphone, ShieldCheck, ClipboardList, Bell, ChevronDown, Loader2,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import {
  CATEGORIES, AUDIENCES, formatDate, formatSize,
  type SchoolDocument, type DocCategory, type DocAudience, type FileKind,
} from "../_data/documents";
import { uploadDocument, deleteDocument } from "../actions";
import { uploadSchoolDocumentFile } from "@/lib/documents/document-actions";
import { SchoolFilterSelect, SchoolCell, matchesSchoolFilter } from "../../_components/school-filter";
import type { InstitutionSchool } from "@/lib/supabase/institution-context";

const CATEGORY_ICON: Record<DocCategory, React.ElementType> = {
  Circular: Megaphone,
  Policy: ShieldCheck,
  Form: ClipboardList,
  Notice: Bell,
};

// Custom-provided icons live in public/file-icons/. We have one icon per
// real extension where it was supplied; doc covers both doc and docx, xls
// covers xlsx too (same app, same color), and jpg/jpeg fall back to the
// generic "image" icon since no dedicated jpg artwork was provided.
// Anything else falls back via FIV_FALLBACK_EXTENSION, keyed off the
// coarser FileKind for older rows uploaded before file_name existed.
const FILE_ICON_ASSETS = new Set(["pdf", "doc", "xls", "csv", "png", "webp", "image"]);
const EXTENSION_ALIASES: Record<string, string> = { docx: "doc", xlsx: "xls", jpg: "image", jpeg: "image" };
const FIV_FALLBACK_EXTENSION: Record<FileKind, string> = { pdf: "pdf", doc: "doc", xlsx: "xls", image: "image" };

function fileIconNameOf(d: Pick<SchoolDocument, "fileKind" | "fileName">): string {
  const nameExt = d.fileName?.split(".").pop()?.toLowerCase();
  if (nameExt) {
    const resolved = EXTENSION_ALIASES[nameExt] ?? nameExt;
    if (FILE_ICON_ASSETS.has(resolved)) return resolved;
  }
  return FIV_FALLBACK_EXTENSION[d.fileKind];
}

function DocFileIcon({
  doc, size = 20, className,
}: {
  doc: Pick<SchoolDocument, "fileKind" | "fileName">;
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/file-icons/${fileIconNameOf(doc)}.svg`}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}

function fileKindOf(name: string): FileKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["xlsx", "xls", "csv"].includes(ext)) return "xlsx";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "image";
  if (["doc", "docx"].includes(ext)) return "doc";
  return "pdf";
}

// Downloads via a blob so the browser always saves the file (with the
// original name) instead of just navigating to the Supabase Storage URL,
// which browsers otherwise often open inline rather than downloading.
async function downloadDocumentFile(doc: SchoolDocument) {
  if (!doc.fileUrl) return;
  try {
    const res = await fetch(doc.fileUrl);
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = doc.fileName || doc.title;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(doc.fileUrl, "_blank", "noopener,noreferrer");
  }
}

function UploadModal({
  onClose, onUploaded, schools = [],
}: {
  onClose: () => void;
  onUploaded: () => void;
  schools?: InstitutionSchool[];
}) {
  const multiSchool = schools.length > 1;
  const [schoolId, setSchoolId] = useState(schools[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocCategory>("Circular");
  const [audience, setAudience] = useState<DocAudience>("All");
  const [file, setFile] = useState<globalThis.File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !file) {
      setError("Please select a file to upload.");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("document", file);
        const { fileUrl, fileName } = await uploadSchoolDocumentFile(formData);
        await uploadDocument({
          title,
          category,
          audience,
          fileKind: fileKindOf(file.name),
          sizeKb: Math.max(1, Math.round(file.size / 1024)),
          fileUrl,
          fileName,
          schoolId: multiSchool ? schoolId : undefined,
        });
        onUploaded();
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Upload Document</p>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
        </div>
        <div className="space-y-3 p-5">
          {multiSchool && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">School</label>
              <div className="relative">
                <select value={schoolId} onChange={(e) => setSchoolId(e.target.value)} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                  {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Winter Break Circular" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Category</label>
              <div className="relative">
                <select value={category} onChange={(e) => setCategory(e.target.value as DocCategory)} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Audience</label>
              <div className="relative">
                <select value={audience} onChange={(e) => setAudience(e.target.value as DocAudience)} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-2 pr-8 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                  {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">File</label>
            <input
              type="file"
              required
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-600 dark:text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-500 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-primary-600"
            />
          </div>
          {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">Cancel</button>
          <FancyButton type="submit" disabled={isPending} size="sm">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {isPending ? "Uploading…" : "Upload"}
          </FancyButton>
        </div>
      </form>
    </div>
  );
}

function PreviewModal({
  doc, onClose,
}: {
  doc: SchoolDocument;
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadDocumentFile(doc);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-zinc-800/60">
              <DocFileIcon doc={doc} size={20} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-zinc-50">{doc.title}</p>
              <p className="truncate text-xs text-gray-400 dark:text-zinc-500">
                {doc.category} · {formatSize(doc.sizeKb)} · {formatDate(doc.uploadedDate)}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="shrink-0 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-zinc-950 p-4">
          {!doc.fileUrl ? (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
              <File className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No file was attached to this document.</p>
            </div>
          ) : doc.fileKind === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={doc.fileUrl} alt={doc.title} className="mx-auto max-h-[65vh] w-auto rounded-lg object-contain" />
          ) : doc.fileKind === "pdf" ? (
            <iframe src={doc.fileUrl} title={doc.title} className="h-[65vh] w-full rounded-lg border border-gray-200 dark:border-zinc-800 bg-white" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
              <DocFileIcon doc={doc} size={48} />
              <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">Preview isn&rsquo;t available for this file type.</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500">Download it to view the full document.</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">Close</button>
          <FancyButton type="button" onClick={handleDownload} disabled={!doc.fileUrl || downloading} size="sm">
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download
          </FancyButton>
        </div>
      </div>
    </div>
  );
}

export default function DocumentsClient({ docs, schools = [] }: { docs: SchoolDocument[]; schools?: InstitutionSchool[] }) {
  const [category, setCategory] = useState<"all" | DocCategory>("all");
  const [query, setQuery] = useState("");
  const [schoolFilter, setSchoolFilter] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<SchoolDocument | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return docs
      .filter((d) => category === "all" || d.category === category)
      .filter((d) => !q || d.title.toLowerCase().includes(q))
      .filter((d) => matchesSchoolFilter(schoolFilter, d.schoolId))
      .sort((a, b) => new Date(b.uploadedDate).getTime() - new Date(a.uploadedDate).getTime());
  }, [docs, category, query, schoolFilter]);

  function remove(id: string) {
    startTransition(async () => { await deleteDocument(id); });
  }

  function refresh() {
    window.location.reload();
  }

  async function handleDownloadClick(doc: SchoolDocument) {
    if (!doc.fileUrl) return;
    setDownloadingId(doc.id);
    try {
      await downloadDocumentFile(doc);
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Documents &amp; Circulars</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Policy and compliance documents</p>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <FancyButton onClick={() => setUploadOpen(true)} size="sm">
            <Upload className="h-4 w-4" /> Upload
          </FancyButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
        {/* Folder sidebar */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-2 space-y-1 h-fit">
          <button
            onClick={() => setCategory("all")}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              category === "all" ? "bg-primary-500/10 text-primary-600 dark:text-primary-400" : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700/40"
            }`}
          >
            <FolderOpen className="h-4 w-4" /> All Documents
            <span className="ml-auto text-xs text-gray-400 dark:text-zinc-500">{docs.length}</span>
          </button>
          {CATEGORIES.map((c) => {
            const Icon = CATEGORY_ICON[c];
            const count = docs.filter((d) => d.category === c).length;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  category === c ? "bg-primary-500/10 text-primary-600 dark:text-primary-400" : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700/40"
                }`}
              >
                <Icon className="h-4 w-4" /> {c}s
                <span className="ml-auto text-xs text-gray-400 dark:text-zinc-500">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Document list */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents…"
              className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          {schools.length > 1 && (
            <div className="flex justify-end">
              <SchoolFilterSelect schools={schools} value={schoolFilter} onChange={setSchoolFilter} />
            </div>
          )}

          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 divide-y divide-gray-100 dark:divide-zinc-700/50 overflow-hidden">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-20 text-center">
                <File className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
                <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No documents found</p>
              </div>
            ) : (
              filtered.map((d) => {
                const isDownloading = downloadingId === d.id;
                return (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                    <button
                      onClick={() => setPreviewDoc(d)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 dark:bg-zinc-800/60"
                      title="Preview"
                    >
                      <DocFileIcon doc={d} size={22} />
                    </button>
                    <button onClick={() => setPreviewDoc(d)} className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-zinc-100 hover:underline">{d.title}</p>
                      <p className="truncate text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1">
                        {d.category} · {d.audience} · {formatSize(d.sizeKb)} · {d.uploadedBy} · {formatDate(d.uploadedDate)}
                        {d.schoolName && <> · <SchoolCell name={d.schoolName} /></>}
                      </p>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleDownloadClick(d)}
                        disabled={!d.fileUrl || isDownloading}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title={d.fileUrl ? "Download" : "No file attached"}
                      >
                        {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => remove(d.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {uploadOpen && (
        <UploadModal onClose={() => setUploadOpen(false)} onUploaded={refresh} schools={schools} />
      )}

      {previewDoc && (
        <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
}
