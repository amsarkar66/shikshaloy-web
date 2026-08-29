"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send, MapPin, Phone, Mail } from "lucide-react";
import type { PublicSchool } from "@/lib/domains/public-site-data";
import { submitPublicSiteGrievance } from "@/lib/domains/public-site-actions";
import { FormSection, TextField, SelectField, TextAreaField } from "./form";

interface Values {
  schoolId: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  subject: string;
  message: string;
  website: string; // honeypot — must stay empty
}

function emptyValues(schoolId: string): Values {
  return { schoolId, name: "", email: "", phone: "", category: "other", subject: "", message: "", website: "" };
}

export function ContactForm({
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
  const [submitted, setSubmitted] = useState(false);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await submitPublicSiteGrievance(ownerId, values);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  }

  const address = [activeSchool.address, activeSchool.city, activeSchool.state].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
          <p className="mt-2 text-sm text-gray-500">
            Have a question, feedback, or a grievance? Reach out directly or use the form.
          </p>

          <div className="mt-6 space-y-3 text-sm">
            {address && (
              <p className="flex items-start gap-2 text-gray-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" /> {address}
              </p>
            )}
            {activeSchool.phone && (
              <a href={`tel:${activeSchool.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-primary-600">
                <Phone className="h-4 w-4 shrink-0 text-primary-500" /> {activeSchool.phone}
              </a>
            )}
            {activeSchool.email && (
              <a href={`mailto:${activeSchool.email}`} className="flex items-center gap-2 text-gray-600 hover:text-primary-600">
                <Mail className="h-4 w-4 shrink-0 text-primary-500" /> {activeSchool.email}
              </a>
            )}
          </div>
        </div>

        <div>
          {submitted ? (
            <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-500" />
              <h2 className="mt-3 text-lg font-semibold text-gray-900">Message Sent</h2>
              <p className="mt-1 text-sm text-gray-500">The school will get back to you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}

              <FormSection title="Send a Message">
                {schools.length > 1 && (
                  <SelectField
                    label="School"
                    required
                    full
                    value={values.schoolId}
                    onChange={(v) => set("schoolId", v)}
                    options={schools.map((s) => ({ value: s.id, label: s.name }))}
                  />
                )}
                <TextField label="Your Name" required value={values.name} onChange={(v) => set("name", v)} />
                <SelectField
                  label="Category"
                  value={values.category}
                  onChange={(v) => set("category", v)}
                  options={[
                    { value: "other", label: "General" },
                    { value: "academic", label: "Academic" },
                    { value: "facilities", label: "Facilities" },
                    { value: "transport", label: "Transport" },
                    { value: "fees", label: "Fees" },
                    { value: "staff", label: "Staff" },
                  ]}
                />
                <TextField label="Email" type="email" value={values.email} onChange={(v) => set("email", v)} />
                <TextField label="Phone" value={values.phone} onChange={(v) => set("phone", v)} />
                <TextField label="Subject" required full value={values.subject} onChange={(v) => set("subject", v)} />
                <TextAreaField label="Message" full value={values.message} onChange={(v) => set("message", v)} />
              </FormSection>

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
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? "Sending…" : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
