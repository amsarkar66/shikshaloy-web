"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2, KeyRound, Copy } from "lucide-react";
import { addStudentManual, type AddStudentInput } from "../actions";
import type { EnrollStudentResult } from "@/lib/students/enroll";
import { PhotoUpload } from "../../_components/photo-upload";

export interface SectionOption {
  id: string;
  name: string;
  gradeLevel: number;
}

interface AddStudentModalProps {
  open: boolean;
  onClose: () => void;
  sections: SectionOption[];
  onCreated: () => void;
}

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20";

export function AddStudentModal({ open, onClose, sections, onCreated }: AddStudentModalProps) {
  const [form, setForm] = useState({
    fullName: "", dob: "", gender: "Male" as "Male" | "Female" | "Other",
    sectionId: sections[0]?.id ?? "", phone: "", address: "",
    parentName: "", parentPhone: "", parentEmail: "",
    photoUrl: null as string | null,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EnrollStudentResult | null>(null);

  if (!open) return null;

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function reset() {
    setForm({
      fullName: "", dob: "", gender: "Male", sectionId: sections[0]?.id ?? "",
      phone: "", address: "", parentName: "", parentPhone: "", parentEmail: "",
      photoUrl: null,
    });
    setError(null);
    setResult(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.sectionId) {
      setError("Name and class/section are required.");
      return;
    }
    const section = sections.find((s) => s.id === form.sectionId);
    if (!section) {
      setError("Please choose a valid class/section.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const input: AddStudentInput = {
        fullName: form.fullName,
        dob: form.dob || null,
        gender: form.gender,
        sectionId: form.sectionId,
        gradeLevel: section.gradeLevel,
        phone: form.phone || null,
        address: form.address || null,
        parentName: form.parentName || null,
        parentPhone: form.parentPhone || null,
        parentEmail: form.parentEmail || null,
        photoUrl: form.photoUrl,
      };
      const res = await addStudentManual(input);
      setResult(res);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add student");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">
            {result ? "Student added" : "Add Student"}
          </p>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        {result ? (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-5 w-5"/></div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{form.fullName}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400">Roll No {result.rollNo}</p>
              </div>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Student login</p>
            <div className="-mt-2 space-y-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 p-3">
              <div className="flex items-center gap-2 text-xs">
                <KeyRound className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500 shrink-0"/>
                <span className="text-gray-500 dark:text-zinc-400 w-16 shrink-0">Email</span>
                <span className="font-mono text-gray-800 dark:text-zinc-200 truncate">{result.loginEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <KeyRound className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500 shrink-0"/>
                <span className="text-gray-500 dark:text-zinc-400 w-16 shrink-0">Password</span>
                <span className="font-mono text-gray-800 dark:text-zinc-200">{result.loginPassword}</span>
              </div>
            </div>

            {result.parentLogin && (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Parent login</p>
                <div className="-mt-2 space-y-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 p-3">
                  <div className="flex items-center gap-2 text-xs">
                    <KeyRound className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500 shrink-0"/>
                    <span className="text-gray-500 dark:text-zinc-400 w-16 shrink-0">Email</span>
                    <span className="font-mono text-gray-800 dark:text-zinc-200 truncate">{result.parentLogin.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <KeyRound className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500 shrink-0"/>
                    <span className="text-gray-500 dark:text-zinc-400 w-16 shrink-0">Password</span>
                    <span className="font-mono text-gray-800 dark:text-zinc-200">{result.parentLogin.password}</span>
                  </div>
                </div>
              </>
            )}

            <p className="text-[11px] text-gray-400 dark:text-zinc-500">Share these with the student/parent — they won&apos;t be shown again.</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  let text = `Student login\nEmail: ${result.loginEmail}\nPassword: ${result.loginPassword}`;
                  if (result.parentLogin) text += `\n\nParent login\nEmail: ${result.parentLogin.email}\nPassword: ${result.parentLogin.password}`;
                  navigator.clipboard.writeText(text);
                }}
                className="flex flex-1 h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
              >
                <Copy className="h-3.5 w-3.5"/>Copy credentials
              </button>
              <button onClick={handleClose} className="flex-1 h-9 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-xs font-medium text-white transition-colors">Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Photo</label>
                <PhotoUpload value={form.photoUrl} onChange={(url) => update("photoUrl", url)} />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Full Name *</label>
                <input className={inputClass} value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Date of Birth</label>
                <input type="date" className={inputClass} value={form.dob} onChange={(e) => update("dob", e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Gender</label>
                <select className={inputClass} value={form.gender} onChange={(e) => update("gender", e.target.value as typeof form.gender)}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Class / Section *</label>
                <select className={inputClass} value={form.sectionId} onChange={(e) => update("sectionId", e.target.value)} required>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>Class {s.gradeLevel}-{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Phone</label>
                <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Address</label>
                <input className={inputClass} value={form.address} onChange={(e) => update("address", e.target.value)} />
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Parent / Guardian</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Name</label>
                  <input className={inputClass} value={form.parentName} onChange={(e) => update("parentName", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Phone</label>
                  <input className={inputClass} value={form.parentPhone} onChange={(e) => update("parentPhone", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Email</label>
                  <input type="email" className={inputClass} value={form.parentEmail} onChange={(e) => update("parentEmail", e.target.value)} />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={handleClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
                Cancel
              </button>
              <button type="submit" disabled={busy || sections.length === 0} className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 px-4 text-sm font-medium text-white transition-colors">
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {sections.length === 0 ? "No sections available" : "Add Student"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
