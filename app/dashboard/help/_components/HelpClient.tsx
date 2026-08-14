"use client";

import { useState } from "react";
import { LifeBuoy, Mail, ChevronDown, CheckCircle2, Loader2, BookOpen, CreditCard, Building2, Bug } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { submitSupportRequest } from "../actions";

const CATEGORIES = [
  { value: "billing", label: "Billing & Subscription" },
  { value: "technical", label: "Technical Issue" },
  { value: "school_setup", label: "School Setup" },
  { value: "other", label: "Other" },
];

const FAQS = [
  { icon: Building2, q: "How do I add another school to my institution?", a: "Go to Schools → Add School. New schools count against your subscription's school limit — upgrade your plan there if you've hit it." },
  { icon: CreditCard, q: "Where can I see my invoices and change my plan?", a: "Billing & Subscription in the sidebar shows your current plan, usage, and renewal date." },
  { icon: BookOpen, q: "How do I invite a Principal for a school?", a: "Principals & School Admins → Invite Principal. They'll get an email with login credentials scoped to that school." },
  { icon: Bug, q: "Something looks broken — what do I do?", a: "Send us a note below with the Technical Issue category and as much detail as you can (what you were doing, what you expected)." },
];

export default function HelpClient({ userEmail }: { userEmail: string }) {
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!subject.trim() || !message.trim()) return;
    setStatus("sending");
    setError("");
    try {
      await submitSupportRequest({ category, subject, message });
      setStatus("sent");
      setSubject("");
      setMessage("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to send. Please try again.");
    }
  }

  return (
    <div className="w-full px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-violet-500 bg-violet-500/10">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Contact Shikshaloy Support</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">We typically respond within one business day.</p>
            </div>
          </div>

          {status === "sent" ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10"><CheckCircle2 className="h-6 w-6 text-emerald-500" /></div>
              <p className="text-sm font-medium text-gray-900 dark:text-zinc-50">Your message has been sent</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">We&apos;ll reply to {userEmail}.</p>
              <button onClick={() => setStatus("idle")} className="mt-1 rounded-lg border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">Send another</button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Category</label>
                <div className="relative">
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-full appearance-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-3 pr-8 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20">
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Subject</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Message</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} placeholder="Tell us what's going on…" className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 resize-none" />
              </div>
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-gray-400 dark:text-zinc-500 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> We&apos;ll reply to {userEmail}</p>
                <FancyButton onClick={handleSubmit} size="sm" disabled={!subject.trim() || !message.trim() || status === "sending"}>
                  {status === "sending" && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Send Message
                </FancyButton>
              </div>
              {status === "error" && <p className="text-xs text-red-500 text-right">{error}</p>}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-3">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50 px-1">Frequently asked</p>
          {FAQS.map((f) => (
            <div key={f.q} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4">
              <div className="flex items-start gap-2.5">
                <f.icon className="h-4 w-4 mt-0.5 shrink-0 text-violet-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">{f.q}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{f.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
