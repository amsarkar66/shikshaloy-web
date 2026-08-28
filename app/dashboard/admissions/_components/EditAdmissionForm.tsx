"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, GraduationCap, ArrowLeft, Loader2, Save, ChevronDown, StickyNote,
} from "lucide-react";
import { updateApplicationDetails, type ApplicationDetailsPatch } from "../actions";
import { DatePicker } from "@/components/ui/date-picker";
import type { Application } from "./AdmissionsClient";

const inputClass =
  "h-8 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";
const selectClass = `${inputClass} appearance-none pr-7`;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-32 shrink-0 text-xs text-gray-400 dark:text-zinc-500 pt-1.5">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

type EditForm = {
  applicantName: string; dob: string; gender: "Male" | "Female" | "Other"; applyingForClass: string;
  previousSchool: string; bloodGroup: string; category: string; nationality: string; address: string;
  parentName: string; parentPhone: string; parentEmail: string;
  fatherName: string; fatherOccupation: string; fatherPhone: string; fatherEmail: string;
  motherName: string; motherOccupation: string; motherPhone: string; motherEmail: string;
  guardianName: string; guardianRelation: string; guardianPhone: string;
  siblingStudying: boolean; siblingName: string;
  emergencyContactName: string; emergencyContactPhone: string;
  notes: string;
};

function toEditForm(a: Application): EditForm {
  return {
    applicantName: a.applicantName, dob: a.dob, gender: a.gender, applyingForClass: a.applyingForClass,
    previousSchool: a.previousSchool ?? "", bloodGroup: a.bloodGroup ?? "", category: a.category ?? "",
    nationality: a.nationality ?? "", address: a.address ?? "",
    parentName: a.parentName, parentPhone: a.parentPhone, parentEmail: a.parentEmail,
    fatherName: a.fatherName ?? "", fatherOccupation: a.fatherOccupation ?? "", fatherPhone: a.fatherPhone ?? "", fatherEmail: a.fatherEmail ?? "",
    motherName: a.motherName ?? "", motherOccupation: a.motherOccupation ?? "", motherPhone: a.motherPhone ?? "", motherEmail: a.motherEmail ?? "",
    guardianName: a.guardianName ?? "", guardianRelation: a.guardianRelation ?? "", guardianPhone: a.guardianPhone ?? "",
    siblingStudying: a.siblingStudying ?? false, siblingName: a.siblingName ?? "",
    emergencyContactName: a.emergencyContactName ?? "", emergencyContactPhone: a.emergencyContactPhone ?? "",
    notes: a.notes ?? "",
  };
}

function toPatch(f: EditForm): ApplicationDetailsPatch {
  return {
    applicantName: f.applicantName, dob: f.dob || null, gender: f.gender, applyingForGrade: f.applyingForClass,
    previousSchool: f.previousSchool || null, bloodGroup: f.bloodGroup || null, category: f.category || null,
    nationality: f.nationality || null, address: f.address || null,
    parentName: f.parentName, parentPhone: f.parentPhone, parentEmail: f.parentEmail,
    fatherName: f.fatherName || null, fatherOccupation: f.fatherOccupation || null, fatherPhone: f.fatherPhone || null, fatherEmail: f.fatherEmail || null,
    motherName: f.motherName || null, motherOccupation: f.motherOccupation || null, motherPhone: f.motherPhone || null, motherEmail: f.motherEmail || null,
    guardianName: f.guardianName || null, guardianRelation: f.guardianRelation || null, guardianPhone: f.guardianPhone || null,
    siblingStudying: f.siblingStudying, siblingName: f.siblingName || null,
    emergencyContactName: f.emergencyContactName || null, emergencyContactPhone: f.emergencyContactPhone || null,
    notes: f.notes || null,
  };
}

export function EditAdmissionForm({ app }: { app: Application }) {
  const router = useRouter();
  const detailHref = `/dashboard/admissions/${app.id}`;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<EditForm>(() => toEditForm(app));

  function update<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setBusy(true);
    setError(null);
    try {
      await updateApplicationDetails(app.id, toPatch(form));
      router.push(detailHref);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save changes");
      setBusy(false);
    }
  }

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="space-y-3">
        <Link href={detailHref} className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors w-fit"><ArrowLeft className="h-4 w-4"/> Back to Application</Link>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Edit Application</h1>
            <p className="text-xs text-gray-400 dark:text-zinc-500">{app.applicationNo} · {app.applicantName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={detailHref} className="flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 px-3 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
              Cancel
            </Link>
            <button onClick={handleSave} disabled={busy} className="flex h-8 items-center gap-1.5 rounded-lg bg-primary-500 px-3 text-xs font-medium text-white hover:bg-primary-600 disabled:opacity-50">
              {busy?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<Save className="h-3.5 w-3.5"/>}Save changes
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-4 py-2.5 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 space-y-4">
          <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary-500"/><h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Applicant Information</h3></div>
          {app.photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={app.photoUrl} alt={app.applicantName} className="h-20 w-20 rounded-xl object-cover border border-gray-200 dark:border-zinc-700" />
          )}
          <div className="space-y-3">
            <Field label="Full Name"><input className={inputClass} value={form.applicantName} onChange={(e)=>update("applicantName", e.target.value)} /></Field>
            <Field label="Date of Birth"><DatePicker className="h-8" value={form.dob} onChange={(v)=>update("dob", v)} /></Field>
            <Field label="Gender">
              <div className="relative">
                <select className={selectClass} value={form.gender} onChange={(e)=>update("gender", e.target.value as EditForm["gender"])}>
                  <option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            </Field>
            <Field label="Applying For"><input className={inputClass} value={form.applyingForClass} onChange={(e)=>update("applyingForClass", e.target.value)} /></Field>
            <Field label="Previous School"><input className={inputClass} value={form.previousSchool} onChange={(e)=>update("previousSchool", e.target.value)} /></Field>
            <Field label="Blood Group"><input className={inputClass} value={form.bloodGroup} onChange={(e)=>update("bloodGroup", e.target.value)} /></Field>
            <Field label="Category"><input className={inputClass} value={form.category} onChange={(e)=>update("category", e.target.value)} /></Field>
            <Field label="Nationality"><input className={inputClass} value={form.nationality} onChange={(e)=>update("nationality", e.target.value)} /></Field>
            <Field label="Address"><input className={inputClass} value={form.address} onChange={(e)=>update("address", e.target.value)} /></Field>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 space-y-4">
          <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary-500"/><h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Parent / Guardian</h3></div>
          <div className="space-y-3">
            <Field label="Full Name"><input className={inputClass} value={form.parentName} onChange={(e)=>update("parentName", e.target.value)} /></Field>
            <Field label="Phone"><input className={inputClass} value={form.parentPhone} onChange={(e)=>update("parentPhone", e.target.value)} /></Field>
            <Field label="Email"><input type="email" className={inputClass} value={form.parentEmail} onChange={(e)=>update("parentEmail", e.target.value)} /></Field>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 space-y-4">
        <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary-500"/><h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Family & Emergency Details</h3></div>
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Father</p>
              <input className={inputClass} placeholder="Name" value={form.fatherName} onChange={(e)=>update("fatherName", e.target.value)} />
              <input className={inputClass} placeholder="Occupation" value={form.fatherOccupation} onChange={(e)=>update("fatherOccupation", e.target.value)} />
              <input className={inputClass} placeholder="Phone" value={form.fatherPhone} onChange={(e)=>update("fatherPhone", e.target.value)} />
              <input type="email" className={inputClass} placeholder="Email" value={form.fatherEmail} onChange={(e)=>update("fatherEmail", e.target.value)} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Mother</p>
              <input className={inputClass} placeholder="Name" value={form.motherName} onChange={(e)=>update("motherName", e.target.value)} />
              <input className={inputClass} placeholder="Occupation" value={form.motherOccupation} onChange={(e)=>update("motherOccupation", e.target.value)} />
              <input className={inputClass} placeholder="Phone" value={form.motherPhone} onChange={(e)=>update("motherPhone", e.target.value)} />
              <input type="email" className={inputClass} placeholder="Email" value={form.motherEmail} onChange={(e)=>update("motherEmail", e.target.value)} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Guardian</p>
              <input className={inputClass} placeholder="Name" value={form.guardianName} onChange={(e)=>update("guardianName", e.target.value)} />
              <input className={inputClass} placeholder="Relation" value={form.guardianRelation} onChange={(e)=>update("guardianRelation", e.target.value)} />
              <input className={inputClass} placeholder="Phone" value={form.guardianPhone} onChange={(e)=>update("guardianPhone", e.target.value)} />
            </div>
          </div>
          <div className="pt-3 border-t border-gray-100 dark:border-zinc-700/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-zinc-300">
                <input type="checkbox" checked={form.siblingStudying} onChange={(e)=>update("siblingStudying", e.target.checked)} />
                Sibling studying at this school
              </label>
              {form.siblingStudying && <input className={inputClass} placeholder="Sibling's name" value={form.siblingName} onChange={(e)=>update("siblingName", e.target.value)} />}
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Emergency Contact</p>
              <input className={inputClass} placeholder="Name" value={form.emergencyContactName} onChange={(e)=>update("emergencyContactName", e.target.value)} />
              <input className={inputClass} placeholder="Phone" value={form.emergencyContactPhone} onChange={(e)=>update("emergencyContactPhone", e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
        <div className="flex items-center gap-2 mb-3"><StickyNote className="h-4 w-4 text-primary-500"/><h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Notes</h3></div>
        <textarea className={inputClass} style={{ height: "auto" }} rows={3} value={form.notes} onChange={(e)=>update("notes", e.target.value)} />
      </div>
    </div>
  );
}
