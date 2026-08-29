"use client";

import { useState } from "react";
import { Loader2, Search, FileWarning, Award } from "lucide-react";
import type { PublicSchool } from "@/lib/domains/public-site-data";
import { checkPublicSiteResults, type PublicExamResult } from "@/lib/domains/public-site-actions";
import { FormSection, TextField, SelectField } from "./form";

export function ResultsForm({
  ownerId,
  schools,
  activeSchool,
}: {
  ownerId: string;
  schools: PublicSchool[];
  activeSchool: PublicSchool;
}) {
  const [schoolId, setSchoolId] = useState(activeSchool.id);
  const [admissionNo, setAdmissionNo] = useState("");
  const [dob, setDob] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ studentName: string; results: PublicExamResult[] } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await checkPublicSiteResults(ownerId, { schoolId, admissionNo, dob });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No matching record found");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <Award className="h-6 w-6" />
        </span>
        <h1 className="mt-3 text-3xl font-bold text-gray-900">Check Your Result</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
          Enter your admission number and date of birth exactly as registered with the school.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8">
        <FormSection title="Student Verification">
          {schools.length > 1 && (
            <SelectField
              label="School"
              required
              full
              value={schoolId}
              onChange={setSchoolId}
              options={schools.map((s) => ({ value: s.id, label: s.name }))}
            />
          )}
          <TextField label="Admission Number" required value={admissionNo} onChange={setAdmissionNo} placeholder="e.g. ADM-2026-001" />
          <TextField label="Date of Birth" type="date" required value={dob} onChange={setDob} />
        </FormSection>

        <button
          type="submit"
          disabled={loading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary-500 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? "Checking…" : "Check Result"}
        </button>
      </form>

      {error && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <FileWarning className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">{result.studentName}</h2>
          {result.results.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">No published results are available yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <th className="pb-2">Exam</th>
                    <th className="pb-2">Subject</th>
                    <th className="pb-2 text-right">Marks</th>
                    <th className="pb-2 text-right">Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {result.results.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2.5 text-gray-700">{r.examName}</td>
                      <td className="py-2.5 text-gray-700">{r.subject}</td>
                      <td className="py-2.5 text-right text-gray-700">
                        {r.isAbsent ? "Absent" : `${r.marksObtained ?? "—"} / ${r.maxMarks ?? "—"}`}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-gray-900">{r.grade ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
