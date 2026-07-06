"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, GraduationCap, Users, Heart, Phone as PhoneIcon,
} from "lucide-react";
import { createApplication, type NewApplicationInput, type PrimaryContact } from "../actions";
import { APPLY_CLASSES } from "../_data/admissions";
import { PhotoUpload } from "../../_components/photo-upload";

export interface AcademicYearOption {
  id: string;
  name: string;
}

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20";
const labelClass = "mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400";

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-indigo-500" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

const BLANK_FORM = {
  applicantName: "", dob: "", gender: "Male" as "Male" | "Female" | "Other",
  applyingForGrade: APPLY_CLASSES[0] ?? "5", academicYearId: "",
  previousSchool: "", address: "", bloodGroup: "", category: "", nationality: "Indian",

  fatherName: "", fatherOccupation: "", fatherPhone: "", fatherEmail: "",
  motherName: "", motherOccupation: "", motherPhone: "", motherEmail: "",
  guardianName: "", guardianRelation: "", guardianPhone: "",
  primaryContact: "father" as PrimaryContact,

  siblingStudying: false, siblingName: "",
  emergencyContactName: "", emergencyContactPhone: "",
  photoUrl: null as string | null,
  notes: "",
};

export default function NewApplicationForm({ academicYears }: { academicYears: AcademicYearOption[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...BLANK_FORM, academicYearId: academicYears[0]?.id ?? "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.applicantName || !form.academicYearId) {
      setError("Applicant name and academic year are required.");
      return;
    }
    const primaryHasName =
      (form.primaryContact === "father" && form.fatherName) ||
      (form.primaryContact === "mother" && form.motherName) ||
      (form.primaryContact === "guardian" && form.guardianName);
    if (!primaryHasName) {
      setError(`Please fill in the ${form.primaryContact}'s name — they're set as the primary contact.`);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const input: NewApplicationInput = { ...form };
      await createApplication(input);
      router.push("/dashboard/admissions");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create application");
      setBusy(false);
    }
  }

  return (
    <div className="w-full px-6 py-6 space-y-5 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admissions" className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          <ArrowLeft className="h-4 w-4" /> All Applications
        </Link>
      </div>
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">New Admission Application</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Capture full applicant and family details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Section icon={GraduationCap} title="Student Information">
          <div className="sm:col-span-2">
            <label className={labelClass}>Photo</label>
            <PhotoUpload value={form.photoUrl} onChange={(url) => update("photoUrl", url)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Full Name *</label>
            <input className={inputClass} value={form.applicantName} onChange={(e) => update("applicantName", e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>Date of Birth</label>
            <input type="date" className={inputClass} value={form.dob} onChange={(e) => update("dob", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Gender</label>
            <select className={inputClass} value={form.gender} onChange={(e) => update("gender", e.target.value as typeof form.gender)}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Applying For *</label>
            <select className={inputClass} value={form.applyingForGrade} onChange={(e) => update("applyingForGrade", e.target.value)}>
              {APPLY_CLASSES.map((c) => <option key={c} value={c}>Class {c}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Academic Year *</label>
            <select className={inputClass} value={form.academicYearId} onChange={(e) => update("academicYearId", e.target.value)} required>
              {academicYears.map((y) => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Previous School</label>
            <input className={inputClass} value={form.previousSchool} onChange={(e) => update("previousSchool", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Blood Group</label>
            <input className={inputClass} placeholder="e.g. O+" value={form.bloodGroup} onChange={(e) => update("bloodGroup", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <select className={inputClass} value={form.category} onChange={(e) => update("category", e.target.value)}>
              <option value="">—</option>
              <option value="General">General</option>
              <option value="OBC">OBC</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Nationality</label>
            <input className={inputClass} value={form.nationality} onChange={(e) => update("nationality", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Address</label>
            <input className={inputClass} value={form.address} onChange={(e) => update("address", e.target.value)} />
          </div>
        </Section>

        <Section icon={Users} title="Father's Details">
          <div>
            <label className={labelClass}>Name</label>
            <input className={inputClass} value={form.fatherName} onChange={(e) => update("fatherName", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Occupation</label>
            <input className={inputClass} value={form.fatherOccupation} onChange={(e) => update("fatherOccupation", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input className={inputClass} value={form.fatherPhone} onChange={(e) => update("fatherPhone", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" className={inputClass} value={form.fatherEmail} onChange={(e) => update("fatherEmail", e.target.value)} />
          </div>
        </Section>

        <Section icon={Users} title="Mother's Details">
          <div>
            <label className={labelClass}>Name</label>
            <input className={inputClass} value={form.motherName} onChange={(e) => update("motherName", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Occupation</label>
            <input className={inputClass} value={form.motherOccupation} onChange={(e) => update("motherOccupation", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input className={inputClass} value={form.motherPhone} onChange={(e) => update("motherPhone", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" className={inputClass} value={form.motherEmail} onChange={(e) => update("motherEmail", e.target.value)} />
          </div>
        </Section>

        <Section icon={Users} title="Guardian's Details (if applicable)">
          <div>
            <label className={labelClass}>Name</label>
            <input className={inputClass} value={form.guardianName} onChange={(e) => update("guardianName", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Relation to Student</label>
            <input className={inputClass} value={form.guardianRelation} onChange={(e) => update("guardianRelation", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input className={inputClass} value={form.guardianPhone} onChange={(e) => update("guardianPhone", e.target.value)} />
          </div>
        </Section>

        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <p className={labelClass}>Primary Contact *</p>
          <p className="mb-3 text-xs text-gray-400 dark:text-zinc-500">Used for enrollment communication and the parent portal login.</p>
          <div className="flex gap-4">
            {(["father", "mother", "guardian"] as PrimaryContact[]).map((c) => (
              <label key={c} className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300 capitalize cursor-pointer">
                <input type="radio" name="primaryContact" checked={form.primaryContact === c} onChange={() => update("primaryContact", c)} />
                {c}
              </label>
            ))}
          </div>
        </div>

        <Section icon={Heart} title="Sibling">
          <div className="sm:col-span-2 flex items-center gap-2">
            <input type="checkbox" id="sibling" checked={form.siblingStudying} onChange={(e) => update("siblingStudying", e.target.checked)} />
            <label htmlFor="sibling" className="text-sm text-gray-700 dark:text-zinc-300">A sibling is already studying at this school</label>
          </div>
          {form.siblingStudying && (
            <div className="sm:col-span-2">
              <label className={labelClass}>Sibling's Name</label>
              <input className={inputClass} value={form.siblingName} onChange={(e) => update("siblingName", e.target.value)} />
            </div>
          )}
        </Section>

        <Section icon={PhoneIcon} title="Emergency Contact">
          <div>
            <label className={labelClass}>Name</label>
            <input className={inputClass} value={form.emergencyContactName} onChange={(e) => update("emergencyContactName", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input className={inputClass} value={form.emergencyContactPhone} onChange={(e) => update("emergencyContactPhone", e.target.value)} />
          </div>
        </Section>

        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
          <label className={labelClass}>Notes</label>
          <textarea className={inputClass} style={{ height: "auto" }} rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pb-4">
          <Link href="/dashboard/admissions" className="flex h-9 items-center rounded-lg border border-gray-200 dark:border-zinc-700 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800">
            Cancel
          </Link>
          <button type="submit" disabled={busy || academicYears.length === 0} className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 px-4 text-sm font-medium text-white transition-colors">
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {academicYears.length === 0 ? "No academic year available" : "Submit Application"}
          </button>
        </div>
      </form>
    </div>
  );
}
