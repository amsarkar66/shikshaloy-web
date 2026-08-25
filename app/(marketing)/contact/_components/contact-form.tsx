"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, User, Mail, MessageSquare } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { SimpleSelect } from "@/components/ui/select";
import { submitContactForm } from "../actions";

const TOPIC_OPTIONS = [
  { value: "sales", label: "Sales inquiry" },
  { value: "support", label: "Technical support" },
  { value: "demo", label: "Request a demo" },
  { value: "other", label: "Something else" },
];

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-shadow focus:ring-2 focus:ring-primary-500/40 focus:border-primary-300";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("sales");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) {
      setError("Please accept the Privacy Policy and Terms of Service to continue.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await submitContactForm({ name, email, topic, message });
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10 px-6">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary-50">
          <CheckCircle2 className="h-6 w-6 text-primary-600" />
        </div>
        <h3 className="mt-4 font-semibold text-zinc-900">Message sent</h3>
        <p className="mt-1.5 text-sm text-zinc-500 max-w-xs">
          Thanks for reaching out — we typically reply within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium text-zinc-700 mb-1.5">
          Your full name
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            id="contact-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name..."
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium text-zinc-700 mb-1.5">
          Email address
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            id="contact-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Type your email address..."
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-topic" className="block text-sm font-medium text-zinc-700 mb-1.5">
          Topic
        </label>
        <SimpleSelect
          value={topic}
          onValueChange={setTopic}
          options={TOPIC_OPTIONS}
          placeholder="Choose a topic..."
          className="rounded-xl border-zinc-200 py-2.5 focus:ring-primary-500/40"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium text-zinc-700 mb-1.5">
          Details
        </label>
        <div className="relative">
          <MessageSquare className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-400" />
          <textarea
            id="contact-message"
            required
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-zinc-500 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-primary-600 focus:ring-primary-500/40"
        />
        <span>
          I accept the{" "}
          <Link href="/privacy" className="text-primary-600 font-medium hover:underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="text-primary-600 font-medium hover:underline">
            Terms of Service
          </Link>
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <FancyButton type="submit" disabled={submitting} className="w-full justify-center">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send your message"}
      </FancyButton>
    </form>
  );
}
