"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2, KeyRound, Copy, ChevronDown } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { DatePicker } from "@/components/ui/date-picker";
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
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

export function AddStudentModal({ open, onClose, sections, onCreated }: AddStudentModalProps) {
  const [form, setForm] = useState({
    fullName: "", dob: "", gender: "Male" as "Male" | "Female" | "Other",
    sectionId: sections[0]?.id ?? "", admissionNo: "", phone: "", address: "",
    parentName: "", parentPhone: "", parentEmail: "",
    photoUrl: null as string | null,
    bloodGroup: "", category: "", religion: "", caste: "", motherTongue: "", language: "",
    emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelation: "",
    medicalConditions: "", allergies: "",
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
      fullName: "", dob: "", gender: "Male", sectionId: sections[0]?.id ?? "", admissionNo: "",
      phone: "", address: "", parentName: "", parentPhone: "", parentEmail: "",
      photoUrl: null,
      bloodGroup: "", category: "", religion: "", caste: "", motherTongue: "", language: "",
      emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelation: "",
      medicalConditions: "", allergies: "",
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
        admissionNo: form.admissionNo || null,
        phone: form.phone || null,
        address: form.address || null,
        parentName: form.parentName || null,
        parentPhone: form.parentPhone || null,
        parentEmail: form.parentEmail || null,
        photoUrl: form.photoUrl,
        bloodGroup: form.bloodGroup || null,
        category: form.category || null,
        religion: form.religion || null,
        caste: form.caste || null,
        motherTongue: form.motherTongue || null,
        language: form.language || null,
        emergencyContactName: form.emergencyContactName || null,
        emergencyContactPhone: form.emergencyContactPhone || null,
        emergencyContactRelation: form.emergencyContactRelation || null,
        medicalConditions: form.medicalConditions || null,
        allergies: form.allergies || null,
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
              <FancyButton onClick={handleClose} size="sm" className="flex-1">Done</FancyButton>
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
                <DatePicker value={form.dob} onChange={(v) => update("dob", v)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Gender</label>
                <div className="relative">
                  <select className={selectClass} value={form.gender} onChange={(e) => update("gender", e.target.value as typeof form.gender)}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                </div>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Class / Section *</label>
                <div className="relative">
                  <select className={selectClass} value={form.sectionId} onChange={(e) => update("sectionId", e.target.value)} required>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>Class {s.gradeLevel}-{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                </div>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Admission No.</label>
                <input className={inputClass} value={form.admissionNo} onChange={(e) => update("admissionNo", e.target.value)} />
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
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Additional Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Blood Group</label>
                  <div className="relative">
                    <select className={selectClass} value={form.bloodGroup} onChange={(e) => update("bloodGroup", e.target.value)}>
                      <option value="">Select</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Mother Tongue</label>
                  <input className={inputClass} value={form.motherTongue} onChange={(e) => update("motherTongue", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Religion</label>
                  <input className={inputClass} value={form.religion} onChange={(e) => update("religion", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Caste</label>
                  <input className={inputClass} value={form.caste} onChange={(e) => update("caste", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Category</label>
                  <div className="relative">
                    <select className={selectClass} value={form.category} onChange={(e) => update("category", e.target.value)}>
                      <option value="">Select</option>
                      {["General", "OBC", "SC", "ST", "EWS"].map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Language(s) Known</label>
                  <input className={inputClass} value={form.language} onChange={(e) => update("language", e.target.value)} placeholder="e.g. English, Hindi" />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Health Info</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Medical Conditions</label>
                  <input className={inputClass} value={form.medicalConditions} onChange={(e) => update("medicalConditions", e.target.value)} placeholder="e.g. Asthma" />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Allergies</label>
                  <input className={inputClass} value={form.allergies} onChange={(e) => update("allergies", e.target.value)} placeholder="e.g. Peanuts" />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Emergency Contact</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Name</label>
                  <input className={inputClass} value={form.emergencyContactName} onChange={(e) => update("emergencyContactName", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Phone</label>
                  <input className={inputClass} value={form.emergencyContactPhone} onChange={(e) => update("emergencyContactPhone", e.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Relation</label>
                  <input className={inputClass} value={form.emergencyContactRelation} onChange={(e) => update("emergencyContactRelation", e.target.value)} placeholder="e.g. Uncle" />
                </div>
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
              <FancyButton type="submit" disabled={busy || sections.length === 0} size="sm">
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {sections.length === 0 ? "No sections available" : "Add Student"}
              </FancyButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
