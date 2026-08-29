"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, GraduationCap } from "lucide-react";
import type { PublicSchool } from "@/lib/domains/public-site-data";
import { submitPublicSiteAdmission } from "@/lib/domains/public-site-actions";
import { FormSection, TextField, SelectField, TextAreaField, CheckboxField, FileField } from "./form";

interface Values {
  schoolId: string;
  applicantName: string;
  dob: string;
  gender: "Male" | "Female" | "Other";
  applyingForGrade: string;
  previousSchool: string;
  address: string;
  bloodGroup: string;
  category: string;
  nationality: string;
  fatherName: string;
  fatherOccupation: string;
  fatherPhone: string;
  fatherEmail: string;
  motherName: string;
  motherOccupation: string;
  motherPhone: string;
  motherEmail: string;
  guardianName: string;
  guardianRelation: string;
  guardianPhone: string;
  primaryContact: "father" | "mother" | "guardian";
  siblingStudying: boolean;
  siblingName: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
  photo: File | null;
  birthCertificate: File | null;
  other: File | null;
  website: string; // honeypot — must stay empty
}

function emptyValues(schoolId: string): Values {
  return {
    schoolId,
    applicantName: "",
    dob: "",
    gender: "Male",
    applyingForGrade: "",
    previousSchool: "",
    address: "",
    bloodGroup: "",
    category: "",
    nationality: "Indian",
    fatherName: "",
    fatherOccupation: "",
    fatherPhone: "",
    fatherEmail: "",
    motherName: "",
    motherOccupation: "",
    motherPhone: "",
    motherEmail: "",
    guardianName: "",
    guardianRelation: "",
    guardianPhone: "",
    primaryContact: "father",
    siblingStudying: false,
    siblingName: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    notes: "",
    photo: null,
    birthCertificate: null,
    other: null,
    website: "",
  };
}

export function AdmissionsForm({
  ownerId,
  schools,
  activeSchool,
}: {
  ownerId: string;
  schools: PublicSchool[];
  activeSchool: PublicSchool;
}) {
  const [values, setValues] = useState<Values>(emptyValues(activeSchool.id));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applicationNo, setApplicationNo] = useState<string | null>(null);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const form = new FormData();
      for (const [key, value] of Object.entries(values)) {
        if (value instanceof File) {
          if (value.size > 0) form.append(key, value);
        } else if (typeof value === "boolean") {
          form.append(key, value ? "true" : "false");
        } else if (value) {
          form.append(key, value);
        }
      }
      const res = await submitPublicSiteAdmission(ownerId, form);
      setApplicationNo(res.applicationNo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  }

  if (applicationNo) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Application Submitted</h1>
        <p className="mt-2 text-sm text-gray-500">Your application number is</p>
        <p className="mt-1 rounded-lg bg-primary-50 px-4 py-2 text-lg font-bold text-primary-600">{applicationNo}</p>
        <p className="mt-4 text-sm text-gray-500">
          Please save this number — the school will contact you using the details you provided.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <GraduationCap className="h-6 w-6" />
        </span>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">Admissions Application</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
          Fill in the details below to apply for admission to {activeSchool.name}. Fields marked * are required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-10 space-y-5">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {schools.length > 1 && (
          <FormSection title="Which school are you applying to?">
            <SelectField
              label="School"
              required
              full
              value={values.schoolId}
              onChange={(v) => set("schoolId", v)}
              options={schools.map((s) => ({ value: s.id, label: s.name }))}
            />
          </FormSection>
        )}

        <FormSection title="Student Details">
          <TextField label="Full Name" required full value={values.applicantName} onChange={(v) => set("applicantName", v)} />
          <TextField label="Date of Birth" type="date" value={values.dob} onChange={(v) => set("dob", v)} />
          <SelectField
            label="Gender"
            required
            value={values.gender}
            onChange={(v) => set("gender", v as Values["gender"])}
            options={[
              { value: "Male", label: "Male" },
              { value: "Female", label: "Female" },
              { value: "Other", label: "Other" },
            ]}
          />
          <TextField
            label="Applying for Grade"
            required
            placeholder="e.g. Grade 5"
            value={values.applyingForGrade}
            onChange={(v) => set("applyingForGrade", v)}
          />
          <TextField label="Previous School (if any)" value={values.previousSchool} onChange={(v) => set("previousSchool", v)} />
          <SelectField
            label="Blood Group"
            value={values.bloodGroup}
            onChange={(v) => set("bloodGroup", v)}
            options={["", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((v) => ({ value: v, label: v || "Not sure" }))}
          />
          <SelectField
            label="Category"
            value={values.category}
            onChange={(v) => set("category", v)}
            options={["", "General", "OBC", "SC", "ST", "Other"].map((v) => ({ value: v, label: v || "Prefer not to say" }))}
          />
          <TextField label="Nationality" value={values.nationality} onChange={(v) => set("nationality", v)} />
          <TextAreaField label="Address" full value={values.address} onChange={(v) => set("address", v)} />
        </FormSection>

        <FormSection title="Parent / Guardian Details" description="Choose who we should treat as the primary contact.">
          <SelectField
            label="Primary Contact"
            required
            full
            value={values.primaryContact}
            onChange={(v) => set("primaryContact", v as Values["primaryContact"])}
            options={[
              { value: "father", label: "Father" },
              { value: "mother", label: "Mother" },
              { value: "guardian", label: "Guardian" },
            ]}
          />

          <TextField label="Father's Name" value={values.fatherName} onChange={(v) => set("fatherName", v)} />
          <TextField label="Father's Occupation" value={values.fatherOccupation} onChange={(v) => set("fatherOccupation", v)} />
          <TextField label="Father's Phone" value={values.fatherPhone} onChange={(v) => set("fatherPhone", v)} />
          <TextField label="Father's Email" type="email" value={values.fatherEmail} onChange={(v) => set("fatherEmail", v)} />

          <TextField label="Mother's Name" value={values.motherName} onChange={(v) => set("motherName", v)} />
          <TextField label="Mother's Occupation" value={values.motherOccupation} onChange={(v) => set("motherOccupation", v)} />
          <TextField label="Mother's Phone" value={values.motherPhone} onChange={(v) => set("motherPhone", v)} />
          <TextField label="Mother's Email" type="email" value={values.motherEmail} onChange={(v) => set("motherEmail", v)} />

          <TextField label="Guardian's Name" value={values.guardianName} onChange={(v) => set("guardianName", v)} />
          <TextField label="Guardian's Relation" value={values.guardianRelation} onChange={(v) => set("guardianRelation", v)} />
          <TextField label="Guardian's Phone" value={values.guardianPhone} onChange={(v) => set("guardianPhone", v)} />
        </FormSection>

        <FormSection title="Additional Information">
          <CheckboxField
            label="A sibling is currently studying at this school"
            checked={values.siblingStudying}
            onChange={(v) => set("siblingStudying", v)}
          />
          {values.siblingStudying && (
            <TextField label="Sibling's Name" full value={values.siblingName} onChange={(v) => set("siblingName", v)} />
          )}
          <TextField label="Emergency Contact Name" value={values.emergencyContactName} onChange={(v) => set("emergencyContactName", v)} />
          <TextField label="Emergency Contact Phone" value={values.emergencyContactPhone} onChange={(v) => set("emergencyContactPhone", v)} />
          <TextAreaField label="Anything else we should know?" full value={values.notes} onChange={(v) => set("notes", v)} />
        </FormSection>

        <FormSection title="Documents" description="Optional, but speeds up processing.">
          <FileField label="Student Photo" file={values.photo} onChange={(f) => set("photo", f)} />
          <FileField label="Birth Certificate" file={values.birthCertificate} onChange={(f) => set("birthCertificate", f)} />
          <FileField label="Other Document" file={values.other} onChange={(f) => set("other", f)} />
        </FormSection>

        {/* Honeypot — hidden from real visitors via CSS, left empty by humans, filled by bots */}
        <div className="hidden" aria-hidden="true">
          <label>
            Website
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={values.website}
              onChange={(e) => set("website", e.target.value)}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
          {submitting ? "Submitting…" : "Submit Application"}
        </button>
      </form>
    </div>
  );
}
