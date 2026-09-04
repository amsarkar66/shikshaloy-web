"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, Loader2, CheckCircle2, KeyRound, Copy, ChevronDown, Check,
  User, MapPin, HeartPulse, Users, ArrowLeft, ArrowRight, ClipboardCheck,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { DatePicker } from "@/components/ui/date-picker";
import { QualificationSelect } from "@/components/ui/qualification-select";
import { OccupationSelect } from "@/components/ui/occupation-select";
import { DualAddressFields } from "@/components/ui/dual-address-fields";
import { ReligionSelect } from "@/components/ui/religion-select";
import { addStudentManual, type AddStudentInput } from "../actions";
import type { EnrollStudentResult } from "@/lib/students/enroll";
import { EMPTY_ADDRESS, formatAddress } from "@/lib/students/address";
import { PhotoUpload } from "../../_components/photo-upload";

export interface SectionOption {
  id: string;
  name: string;
  gradeLevel: number;
  schoolId?: string;
  schoolName?: string;
}

interface AddStudentModalProps {
  open: boolean;
  onClose: () => void;
  sections: SectionOption[];
  onCreated: () => void;
  defaultCountry?: string;
}

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

const labelClass = "mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400";

const STEPS = [
  { key: "info", label: "Student Info", icon: User },
  { key: "address", label: "Address", icon: MapPin },
  { key: "health", label: "Health & Emergency", icon: HeartPulse },
  { key: "parent", label: "Parent / Guardian", icon: Users },
  { key: "review", label: "Review", icon: ClipboardCheck },
] as const;

function SummarySection({
  title, stepIndex, items, onEdit,
}: {
  title: string;
  stepIndex: number;
  items: { label: string; value?: string | null }[];
  onEdit: (i: number) => void;
}) {
  const filled = items.filter((it): it is { label: string; value: string } => !!it.value);
  return (
    <div className="rounded-lg border border-gray-200 dark:border-zinc-700 p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">{title}</p>
        <button
          type="button"
          onClick={() => onEdit(stepIndex)}
          className="text-[11px] font-medium text-primary-600 dark:text-primary-400 hover:underline"
        >
          Edit
        </button>
      </div>
      {filled.length === 0 ? (
        <p className="text-xs italic text-gray-400 dark:text-zinc-500">No details added</p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-zinc-800">
          {filled.map((it) => (
            <div key={it.label} className="flex items-start justify-between gap-3 py-1 text-xs">
              <span className="shrink-0 text-gray-400 dark:text-zinc-500">{it.label}</span>
              <span className="text-right font-medium text-gray-800 dark:text-zinc-200">{it.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// When sections span more than one school (institution-wide view), group
// the options under a per-school <optgroup> instead of just listing every
// section flat, so it's clear which school each class/section belongs to.
function groupSectionsBySchool(sections: SectionOption[]): Map<string, SectionOption[]> {
  const groups = new Map<string, SectionOption[]>();
  for (const s of sections) {
    const key = s.schoolName ?? "";
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }
  return groups;
}

// Step header — numbered badges connected by a fill line, each with its own
// label underneath (chosen over the other style variants that were explored).
function Stepper({ step }: { step: number }) {
  return (
    <div className="bg-gray-50 dark:bg-zinc-800/40 border-b border-gray-100 dark:border-zinc-800 px-5 pt-4 pb-3">
      <div className="flex items-start">
        {STEPS.map((s, i) => (
          <div key={s.key} className={`flex items-start ${i < STEPS.length - 1 ? "flex-1" : ""}`}>
            <div className="flex shrink-0 flex-col items-center">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold leading-none transition-colors ${
                  i < step
                    ? "bg-primary-500 text-white"
                    : i === step
                    ? "bg-primary-500/10 text-primary-600 dark:text-primary-400 ring-2 ring-primary-500"
                    : "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500"
                }`}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <p
                className={`mt-1.5 w-16 truncate text-center text-[10px] font-medium ${
                  i === step ? "text-gray-700 dark:text-zinc-200" : "text-gray-400 dark:text-zinc-500"
                }`}
                title={s.label}
              >
                {s.label}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1 mt-3.5 h-0.5 flex-1 transition-colors ${i < step ? "bg-primary-500" : "bg-gray-200 dark:bg-zinc-700"}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Alternative step header style (flat underline tabs) — not currently used,
// kept here in case we want to swap the look again later. To use it, render
// <StepperUnderlineTabs step={step} /> instead of <Stepper step={step} />.
export function StepperUnderlineTabs({ step }: { step: number }) {
  return (
    <div className="px-5 pt-4">
      <div className="flex border-b border-gray-200 dark:border-zinc-800">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`-mb-px min-w-0 flex-1 truncate border-b-2 px-1 pb-2 text-center text-[11px] font-medium transition-colors ${
              i === step
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : i < step
                ? "border-transparent text-gray-500 dark:text-zinc-400"
                : "border-transparent text-gray-300 dark:text-zinc-600"
            }`}
            title={s.label}
          >
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AddStudentModal({ open, onClose, sections, onCreated, defaultCountry }: AddStudentModalProps) {
  const initialAddress = { ...EMPTY_ADDRESS, country: defaultCountry ?? "" };
  const [form, setForm] = useState({
    fullName: "", dob: "", gender: "Male" as "Male" | "Female" | "Other",
    sectionId: sections[0]?.id ?? "", admissionNo: "", phone: "",
    presentAddress: initialAddress, permanentAddress: initialAddress, permanentSameAsPresent: true,
    parentName: "", parentPhone: "", parentEmail: "", parentQualification: "", parentOccupation: "",
    photoUrl: null as string | null,
    bloodGroup: "", category: "", religion: "", caste: "", motherTongue: "", language: "",
    emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelation: "",
    medicalConditions: "", allergies: "",
  });
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
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
      phone: "", presentAddress: initialAddress, permanentAddress: initialAddress, permanentSameAsPresent: true,
      parentName: "", parentPhone: "", parentEmail: "", parentQualification: "", parentOccupation: "",
      photoUrl: null,
      bloodGroup: "", category: "", religion: "", caste: "", motherTongue: "", language: "",
      emergencyContactName: "", emergencyContactPhone: "", emergencyContactRelation: "",
      medicalConditions: "", allergies: "",
    });
    setStep(0);
    setDirection(1);
    setError(null);
    setResult(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function goNext() {
    if (step === 0 && (!form.fullName || !form.sectionId)) {
      setError("Name and class/section are required.");
      return;
    }
    if (step === 3 && (!form.parentName || !form.parentPhone || !form.parentEmail)) {
      setError("Parent/guardian name, phone, and email are required — they need these to receive updates from the school.");
      return;
    }
    setError(null);
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setError(null);
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }

  function jumpToStep(i: number) {
    setError(null);
    setDirection(i > step ? 1 : -1);
    setStep(i);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step !== STEPS.length - 1) {
      goNext();
      return;
    }
    if (!form.fullName || !form.sectionId) {
      setError("Name and class/section are required.");
      return;
    }
    if (!form.parentName || !form.parentPhone || !form.parentEmail) {
      setError("Parent/guardian name, phone, and email are required — they need these to receive updates from the school.");
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
        presentAddress: form.presentAddress,
        permanentAddress: form.permanentSameAsPresent ? form.presentAddress : form.permanentAddress,
        parentName: form.parentName || null,
        parentPhone: form.parentPhone || null,
        parentEmail: form.parentEmail || null,
        parentOccupation: form.parentOccupation || null,
        parentQualification: form.parentQualification || null,
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

  const isLastStep = step === STEPS.length - 1;
  const selectedSection = sections.find((s) => s.id === form.sectionId);
  const effectivePermanentAddress = form.permanentSameAsPresent ? form.presentAddress : form.permanentAddress;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={handleClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl max-h-[90vh] overflow-y-auto"
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
          <form onSubmit={handleSubmit}>
            <Stepper step={step} />

            <div className="overflow-hidden p-5">
              <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  initial={{ opacity: 0, x: direction * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: direction * -24 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  {step === 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className={labelClass}>Photo</label>
                        <PhotoUpload value={form.photoUrl} onChange={(url) => update("photoUrl", url)} />
                      </div>
                      <div className="col-span-2">
                        <label className={labelClass}>Full Name *</label>
                        <input className={inputClass} value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required />
                      </div>
                      <div>
                        <label className={labelClass}>Date of Birth</label>
                        <DatePicker value={form.dob} onChange={(v) => update("dob", v)} />
                      </div>
                      <div>
                        <label className={labelClass}>Gender</label>
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
                        <label className={labelClass}>Class / Section *</label>
                        <div className="relative">
                          <select className={selectClass} value={form.sectionId} onChange={(e) => update("sectionId", e.target.value)} required>
                            {sections.some((s) => s.schoolName) ? (
                              Array.from(groupSectionsBySchool(sections)).map(([schoolName, group]) => (
                                <optgroup key={schoolName} label={schoolName}>
                                  {group.map((s) => (
                                    <option key={s.id} value={s.id}>Class {s.gradeLevel}-{s.name}</option>
                                  ))}
                                </optgroup>
                              ))
                            ) : (
                              sections.map((s) => (
                                <option key={s.id} value={s.id}>Class {s.gradeLevel}-{s.name}</option>
                              ))
                            )}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className={labelClass}>Admission No.</label>
                        <input className={inputClass} value={form.admissionNo} onChange={(e) => update("admissionNo", e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <label className={labelClass}>Phone</label>
                        <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                      </div>

                      <div className="col-span-2 border-t border-gray-100 dark:border-zinc-800 pt-3">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Additional Details</p>
                      </div>
                      <div>
                        <label className={labelClass}>Blood Group</label>
                        <div className="relative">
                          <select className={selectClass} value={form.bloodGroup} onChange={(e) => update("bloodGroup", e.target.value)}>
                            <option value="">Select</option>
                            {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Mother Tongue</label>
                        <input className={inputClass} value={form.motherTongue} onChange={(e) => update("motherTongue", e.target.value)} />
                      </div>
                      <div>
                        <label className={labelClass}>Religion</label>
                        <ReligionSelect
                          value={form.religion}
                          onChange={(v) => update("religion", v)}
                          selectClassName={selectClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Caste</label>
                        <input className={inputClass} value={form.caste} onChange={(e) => update("caste", e.target.value)} />
                      </div>
                      <div>
                        <label className={labelClass}>Category</label>
                        <div className="relative">
                          <select className={selectClass} value={form.category} onChange={(e) => update("category", e.target.value)}>
                            <option value="">Select</option>
                            {["General", "OBC", "SC", "ST", "EWS"].map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                        </div>
                      </div>
                      <div>
                        <label className={labelClass}>Language(s) Known</label>
                        <input className={inputClass} value={form.language} onChange={(e) => update("language", e.target.value)} placeholder="e.g. English, Hindi" />
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <DualAddressFields
                      presentValue={form.presentAddress}
                      permanentValue={form.permanentAddress}
                      sameAsPresent={form.permanentSameAsPresent}
                      onPresentChange={(v) => update("presentAddress", v)}
                      onPermanentChange={(v) => update("permanentAddress", v)}
                      onSameAsPresentChange={(v) => update("permanentSameAsPresent", v)}
                      inputClassName={inputClass}
                      selectClassName={selectClass}
                    />
                  )}

                  {step === 2 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className={labelClass}>Medical Conditions</label>
                          <input className={inputClass} value={form.medicalConditions} onChange={(e) => update("medicalConditions", e.target.value)} placeholder="e.g. Asthma" />
                        </div>
                        <div className="col-span-2">
                          <label className={labelClass}>Allergies</label>
                          <input className={inputClass} value={form.allergies} onChange={(e) => update("allergies", e.target.value)} placeholder="e.g. Peanuts" />
                        </div>
                      </div>
                      <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-zinc-500">Emergency Contact</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className={labelClass}>Name</label>
                            <input className={inputClass} value={form.emergencyContactName} onChange={(e) => update("emergencyContactName", e.target.value)} />
                          </div>
                          <div>
                            <label className={labelClass}>Phone</label>
                            <input className={inputClass} value={form.emergencyContactPhone} onChange={(e) => update("emergencyContactPhone", e.target.value)} />
                          </div>
                          <div>
                            <label className={labelClass}>Relation</label>
                            <input className={inputClass} value={form.emergencyContactRelation} onChange={(e) => update("emergencyContactRelation", e.target.value)} placeholder="e.g. Uncle" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className={labelClass}>Name *</label>
                        <input className={inputClass} value={form.parentName} onChange={(e) => update("parentName", e.target.value)} required />
                      </div>
                      <div>
                        <label className={labelClass}>Phone *</label>
                        <input className={inputClass} value={form.parentPhone} onChange={(e) => update("parentPhone", e.target.value)} required />
                      </div>
                      <div>
                        <label className={labelClass}>Email *</label>
                        <input type="email" className={inputClass} value={form.parentEmail} onChange={(e) => update("parentEmail", e.target.value)} required />
                      </div>
                      <div>
                        <label className={labelClass}>Qualification</label>
                        <QualificationSelect
                          value={form.parentQualification}
                          onChange={(v) => update("parentQualification", v)}
                          selectClassName={selectClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Occupation</label>
                        <OccupationSelect
                          value={form.parentOccupation}
                          onChange={(v) => update("parentOccupation", v)}
                          selectClassName={selectClass}
                        />
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-3">
                      <p className="text-xs text-gray-400 dark:text-zinc-500">Review the details below, then add the student. Click &quot;Edit&quot; on any section to go back and change it.</p>
                      <SummarySection
                        title="Student Info"
                        stepIndex={0}
                        onEdit={jumpToStep}
                        items={[
                          { label: "Full Name", value: form.fullName },
                          { label: "Date of Birth", value: form.dob },
                          { label: "Gender", value: form.gender },
                          { label: "Class / Section", value: selectedSection ? `Class ${selectedSection.gradeLevel}-${selectedSection.name}` : "" },
                          { label: "Admission No.", value: form.admissionNo },
                          { label: "Phone", value: form.phone },
                          { label: "Blood Group", value: form.bloodGroup },
                          { label: "Mother Tongue", value: form.motherTongue },
                          { label: "Religion", value: form.religion },
                          { label: "Caste", value: form.caste },
                          { label: "Category", value: form.category },
                          { label: "Language(s)", value: form.language },
                        ]}
                      />
                      <SummarySection
                        title="Address"
                        stepIndex={1}
                        onEdit={jumpToStep}
                        items={[
                          { label: "Present Address", value: formatAddress(form.presentAddress) },
                          { label: "Permanent Address", value: form.permanentSameAsPresent ? "Same as present address" : formatAddress(effectivePermanentAddress) },
                        ]}
                      />
                      <SummarySection
                        title="Health & Emergency"
                        stepIndex={2}
                        onEdit={jumpToStep}
                        items={[
                          { label: "Medical Conditions", value: form.medicalConditions },
                          { label: "Allergies", value: form.allergies },
                          { label: "Emergency Contact", value: form.emergencyContactName },
                          { label: "Emergency Phone", value: form.emergencyContactPhone },
                          { label: "Relation", value: form.emergencyContactRelation },
                        ]}
                      />
                      <SummarySection
                        title="Parent / Guardian"
                        stepIndex={3}
                        onEdit={jumpToStep}
                        items={[
                          { label: "Name", value: form.parentName },
                          { label: "Phone", value: form.parentPhone },
                          { label: "Email", value: form.parentEmail },
                          { label: "Qualification", value: form.parentQualification },
                          { label: "Occupation", value: form.parentOccupation },
                        ]}
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {error && (
                <div className="mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-gray-100 dark:border-zinc-800 px-5 py-4">
              <button type="button" onClick={handleClose} className="h-9 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
                Cancel
              </button>
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={goBack}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                )}
                {isLastStep ? (
                  <FancyButton type="submit" disabled={busy || sections.length === 0} size="sm">
                    {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {sections.length === 0 ? "No sections available" : "Submit"}
                  </FancyButton>
                ) : (
                  <FancyButton type="submit" size="sm">
                    Next <ArrowRight className="h-3.5 w-3.5" />
                  </FancyButton>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
