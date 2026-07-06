"use client";

import { useMemo, useState, useTransition } from "react";
import {
  FolderOpen, FileText, FileSpreadsheet, FileImage, File,
  Search, Upload, Download, X, Trash2, Megaphone, ShieldCheck, ClipboardList, Bell,
} from "lucide-react";
import {
  CATEGORIES, AUDIENCES, formatDate, formatSize,
  type SchoolDocument, type DocCategory, type DocAudience, type FileKind,
} from "../_data/documents";
import { uploadDocument, deleteDocument } from "../actions";

const CATEGORY_ICON: Record<DocCategory, React.ElementType> = {
  Circular: Megaphone,
  Policy: ShieldCheck,
  Form: ClipboardList,
  Notice: Bell,
};

const FILE_ICON: Record<FileKind, React.ElementType> = {
  pdf: FileText,
  doc: FileText,
  xlsx: FileSpreadsheet,
  image: FileImage,
};

function UploadModal({
  onClose, onUploaded,
}: {
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<DocCategory>("Circular");
  const [audience, setAudience] = useState<DocAudience>("All");
  const [file, setFile] = useState<globalThis.File | null>(null);
  const [isPending, startTransition] = useTransition();

  function fileKindOf(name: string): FileKind {
    const ext = name.split(".").pop()?.toLowerCase() ?? "";
    if (["xlsx", "xls", "csv"].includes(ext)) return "xlsx";
    if (["png", "jpg", "jpeg", "gif"].includes(ext)) return "image";
    if (["doc", "docx"].includes(ext)) return "doc";
    return "pdf";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    startTransition(async () => {
      await uploadDocument({
        title,
        category,
        audience,
        fileKind: file ? fileKindOf(file.name) : "pdf",
        sizeKb: file ? Math.max(1, Math.round(file.size / 1024)) : 100,
      });
      onUploaded();
      onClose();
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
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Winter Break Circular" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as DocCategory)} className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20">
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">Audience</label>
              <select value={audience} onChange={(e) => setAudience(e.target.value as DocAudience)} className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20">
                {AUDIENCES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 dark:text-zinc-400">File</label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="w-full text-sm text-gray-600 dark:text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-600" />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-zinc-800 px-5 py-4">
          <button type="button" onClick={onClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">Cancel</button>
          <button type="submit" disabled={isPending} className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white transition-colors disabled:opacity-50"><Upload className="h-4 w-4" /> {isPending ? "Uploading…" : "Upload"}</button>
        </div>
      </form>
    </div>
  );
}

export default function DocumentsClient({ docs }: { docs: SchoolDocument[] }) {
  const [category, setCategory] = useState<"all" | DocCategory>("all");
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return docs
      .filter((d) => category === "all" || d.category === category)
      .filter((d) => !q || d.title.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.uploadedDate).getTime() - new Date(a.uploadedDate).getTime());
  }, [docs, category, query]);

  function remove(id: string) {
    startTransition(async () => { await deleteDocument(id); });
  }

  function refresh() {
    window.location.reload();
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Documents &amp; Circulars</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Central repository for circulars, policies and forms.</p>
        </div>
        <button onClick={() => setUploadOpen(true)} className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white transition-colors shadow-sm sm:ml-auto">
          <Upload className="h-4 w-4" /> Upload
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">
        {/* Folder sidebar */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-2 space-y-1 h-fit">
          <button
            onClick={() => setCategory("all")}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              category === "all" ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700/40"
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
                  category === c ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700/40"
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
              className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 divide-y divide-gray-100 dark:divide-zinc-700/50 overflow-hidden">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-20 text-center">
                <File className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
                <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No documents found</p>
              </div>
            ) : (
              filtered.map((d) => {
                const FileIcon = FILE_ICON[d.fileKind];
                return (
                  <div key={d.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      <FileIcon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-zinc-100">{d.title}</p>
                      <p className="truncate text-xs text-gray-400 dark:text-zinc-500">
                        {d.category} · {d.audience} · {formatSize(d.sizeKb)} · {d.uploadedBy} · {formatDate(d.uploadedDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-700 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors" title="Download">
                        <Download className="h-3.5 w-3.5" />
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
        <UploadModal onClose={() => setUploadOpen(false)} onUploaded={refresh} />
      )}
    </div>
  );
}
