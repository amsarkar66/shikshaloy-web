"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, User, BookOpen, Users, ChevronDown, Siren, HeartPulse } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { DatePicker } from "@/components/ui/date-picker";
import { updateStudent } from "../actions";
import { PhotoUpload } from "../../_components/photo-upload";
import type { SectionOption } from "./add-student-modal";

export interface EditableStudent {
  id: string;
  fullName: string;
  rollNo: string;
  admissionNo: string;
  dob: string;
  gender: "Male" | "Female" | "Other";
  address: string;
  phone: string;
  photoUrl: string | null;
  active: boolean;
  sectionId: string;
  parentId: string | null;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  bloodGroup: string;
  category: string;
  religion: string;
  caste: string;
  motherTongue: string;
  language: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  medicalConditions: string;
  allergies: string;
}

const inputClass =
  "h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

const selectClass =
  "h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20";

const cardClass = "rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5";

const cardTitleClass = "mb-4 text-sm font-semibold text-gray-900 dark:text-zinc-50 flex items-center gap-2";

export function EditStudentForm({ student, sections }: { student: EditableStudent; sections: SectionOption[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ ...student });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.sectionId) {
      setError("Name and class/section are required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await updateStudent({
        studentId: form.id,
        fullName: form.fullName,
        rollNo: form.rollNo,
        admissionNo: form.admissionNo || null,
        dob: form.dob || null,
        gender: form.gender,
        sectionId: form.sectionId,
        phone: form.phone || null,
        address: form.address || null,
        photoUrl: form.photoUrl,
        active: form.active,
        parentId: form.parentId,
        parentName: form.parentName || null,
        parentPhone: form.parentPhone || null,
        parentEmail: form.parentEmail || null,
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
      });
      router.push(`/dashboard/students/${form.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update student");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full px-6 py-6 space-y-6">

      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/dashboard/students/${form.id}`}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Student
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/students/${form.id}`}
            className="flex h-8 items-center rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 text-sm text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </Link>
          <FancyButton type="submit" disabled={busy} size="xs">
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save Changes
          </FancyButton>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Photo + identity */}
      <div className={cardClass}>
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <PhotoUpload value={form.photoUrl} onChange={(url) => update("photoUrl", url)} />
          <div className="grid flex-1 grid-cols-1 sm:grid-cols-3 gap-3 w-full">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Full Name *</label>
              <input className={inputClass} value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Status</label>
              <div className="relative">
                <select
                  className={selectClass}
                  value={form.active ? "active" : "inactive"}
                  onChange={(e) => update("active", e.target.value === "active")}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal + Academic info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Personal */}
        <div className={cardClass}>
          <p className={cardTitleClass}>
            <User className="h-4 w-4 text-primary-500" /> Personal Information
          </p>
          <div className="grid grid-cols-2 gap-3">
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
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Phone</label>
              <input className={inputClass} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Address</label>
              <input className={inputClass} value={form.address} onChange={(e) => update("address", e.target.value)} />
            </div>
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

        {/* Academic */}
        <div className={cardClass}>
          <p className={cardTitleClass}>
            <BookOpen className="h-4 w-4 text-primary-500" /> Academic Information
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Roll No</label>
              <input className={inputClass} value={form.rollNo} onChange={(e) => update("rollNo", e.target.value)} />
            </div>
            <div>
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
          </div>
        </div>

      </div>

      {/* Emergency contact + health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={cardClass}>
          <p className={cardTitleClass}>
            <Siren className="h-4 w-4 text-red-500" /> Emergency Contact
          </p>
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

        <div className={cardClass}>
          <p className={cardTitleClass}>
            <HeartPulse className="h-4 w-4 text-rose-500" /> Health Info
          </p>
          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Medical Conditions</label>
              <input className={inputClass} value={form.medicalConditions} onChange={(e) => update("medicalConditions", e.target.value)} placeholder="e.g. Asthma" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Allergies</label>
              <input className={inputClass} value={form.allergies} onChange={(e) => update("allergies", e.target.value)} placeholder="e.g. Peanuts" />
            </div>
          </div>
        </div>
      </div>

      {/* Parent / Guardian */}
      <div className={cardClass}>
        <p className={cardTitleClass}>
          <Users className="h-4 w-4 text-primary-500" /> Parent / Guardian
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Name</label>
            <input
              className={inputClass}
              value={form.parentName}
              onChange={(e) => update("parentName", e.target.value)}
              disabled={!form.parentId}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Phone</label>
            <input
              className={inputClass}
              value={form.parentPhone}
              onChange={(e) => update("parentPhone", e.target.value)}
              disabled={!form.parentId}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-zinc-400">Email</label>
            <input
              type="email"
              className={inputClass}
              value={form.parentEmail}
              onChange={(e) => update("parentEmail", e.target.value)}
              disabled={!form.parentId}
            />
          </div>
        </div>
        {!form.parentId && (
          <p className="mt-3 text-[11px] text-gray-400 dark:text-zinc-500">
            No parent/guardian linked to this student yet.
          </p>
        )}
      </div>

    </form>
  );
}
