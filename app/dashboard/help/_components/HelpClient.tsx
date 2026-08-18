"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LifeBuoy, ChevronDown, ChevronUp, CheckCircle2, Loader2, BookOpen, CreditCard, Building2, Bug,
  History, Phone, MessageCircle, Mail, HelpCircle, Search, Send,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { SupportThreadModal } from "@/components/support/support-thread-modal";
import { createSupportRequest } from "@/lib/support/actions";
import type { SupportRequestSummary } from "@/lib/support/types";
import { SUPPORT_STATUS_LABEL, SUPPORT_STATUS_BADGE, SUPPORT_CATEGORY_LABEL, formatSupportDateTime } from "@/lib/support/format";

const SUPPORT_EMAIL = "support@shikshaloy.com";
const SUPPORT_PHONE = "+91 99327 97131";
const SUPPORT_PHONE_TEL = "+919932797131";

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

function SectionHeader({
  icon: Icon, iconClass, title, subtitle, action,
}: {
  icon: React.ElementType;
  iconClass: string;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{title}</p>
        <p className="text-xs text-gray-500 dark:text-zinc-400">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function ContactCard({
  icon: Icon, iconClass, title, detail, cta, href, onClick,
}: {
  icon: React.ElementType;
  iconClass: string;
  title: string;
  detail: string;
  cta?: string;
  href?: string;
  onClick?: () => void;
}) {
  const interactive = !!(href || onClick);
  const content = (
    <>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{title}</p>
        <p className="truncate text-xs text-gray-500 dark:text-zinc-400">{detail}</p>
      </div>
      {cta && (
        <span className="shrink-0 inline-flex h-8 items-center rounded-lg border border-gray-200 dark:border-zinc-700 px-3 text-xs font-medium text-gray-700 dark:text-zinc-300 group-hover:bg-gray-50 dark:group-hover:bg-zinc-700 transition-colors">
          {cta}
        </span>
      )}
    </>
  );
  const className = `group flex items-center gap-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 text-left transition-colors ${
    interactive ? "hover:border-primary-300 dark:hover:border-primary-700" : ""
  }`;

  if (href) {
    return <a href={href} className={className}>{content}</a>;
  }
  if (onClick) {
    return <button onClick={onClick} className={`w-full ${className}`}>{content}</button>;
  }
  return <div className={className}>{content}</div>;
}

function FaqAccordionItem({
  faq, expanded, onToggle,
}: {
  faq: (typeof FAQS)[number];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
      <button onClick={onToggle} className="flex w-full items-start gap-2.5 p-4 text-left">
        <faq.icon className="h-4 w-4 mt-0.5 shrink-0 text-violet-400" />
        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-zinc-100">{faq.q}</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-gray-400 dark:text-zinc-500" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400 dark:text-zinc-500" />
        )}
      </button>
      {expanded && (
        <p className="px-4 pb-4 pl-[26px] text-xs text-gray-500 dark:text-zinc-400 leading-relaxed">{faq.a}</p>
      )}
    </div>
  );
}

function RequestHistory({ requests, onOpen }: { requests: SupportRequestSummary[]; onOpen: (id: string) => void }) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-14 text-center">
        <History className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
        <p className="text-sm font-medium text-gray-500 dark:text-zinc-400">No requests yet</p>
        <p className="text-xs text-gray-400 dark:text-zinc-500">Anything you send will show up here, with replies in the same thread.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {requests.map((r) => (
        <button
          key={r.id}
          onClick={() => onOpen(r.id)}
          className="w-full rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 text-left hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-zinc-100">{r.subject}</p>
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${SUPPORT_STATUS_BADGE[r.status]}`}>
                  {SUPPORT_STATUS_LABEL[r.status]}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400 truncate">
                {SUPPORT_CATEGORY_LABEL[r.category] ?? r.category} · {formatSupportDateTime(r.updatedAt)}
              </p>
              {r.lastMessagePreview && (
                <p className="mt-1.5 text-xs text-gray-400 dark:text-zinc-500 line-clamp-1">{r.lastMessagePreview}</p>
              )}
            </div>
            <span className="flex shrink-0 items-center gap-1 text-xs text-gray-400 dark:text-zinc-500">
              <MessageCircle className="h-3.5 w-3.5" /> {r.messageCount}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function HelpClient({
  initialRequests,
}: {
  initialRequests: SupportRequestSummary[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"new" | "history">("new");
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [openRequestId, setOpenRequestId] = useState<string | null>(null);

  const [faqQuery, setFaqQuery] = useState("");
  const [expandedFaqs, setExpandedFaqs] = useState<Set<string>>(() => new Set([FAQS[0].q]));

  const filteredFaqs = useMemo(() => {
    const q = faqQuery.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [faqQuery]);

  function toggleFaq(question: string) {
    setExpandedFaqs((prev) => {
      const next = new Set(prev);
      if (next.has(question)) next.delete(question);
      else next.add(question);
      return next;
    });
  }

  async function handleSubmit() {
    if (!subject.trim() || !message.trim()) return;
    setStatus("sending");
    setError("");
    try {
      await createSupportRequest({ category, subject, message });
      setStatus("sent");
      setSubject("");
      setMessage("");
      router.refresh();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to send. Please try again.");
    }
  }

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Help & Support</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Get help and find answers to your questions</p>
      </div>

      {/* Contact method cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <ContactCard
          icon={Mail}
          iconClass="text-emerald-500 bg-emerald-500/10"
          title="Email Support"
          detail={SUPPORT_EMAIL}
          cta="Send Email"
          href={`mailto:${SUPPORT_EMAIL}`}
        />
        <ContactCard
          icon={Phone}
          iconClass="text-blue-500 bg-blue-500/10"
          title="Phone Support"
          detail={SUPPORT_PHONE}
          cta="Call Now"
          href={`tel:${SUPPORT_PHONE_TEL}`}
        />
        <ContactCard
          icon={tab === "history" ? Send : History}
          iconClass="text-violet-500 bg-violet-500/10"
          title={tab === "history" ? "New Request" : "My Requests"}
          detail={
            tab === "history"
              ? "Submit a new support request"
              : `${initialRequests.length} request${initialRequests.length === 1 ? "" : "s"} so far`
          }
          cta={tab === "history" ? "New Request" : "View Requests"}
          onClick={() => setTab(tab === "history" ? "new" : "history")}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* FAQ */}
        <div className="lg:col-span-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-6">
          <SectionHeader
            icon={HelpCircle}
            iconClass="text-violet-500 bg-violet-500/10"
            title="Frequently Asked Questions"
            subtitle="Find quick answers to common questions"
          />
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500 pointer-events-none" />
            <input
              value={faqQuery}
              onChange={(e) => setFaqQuery(e.target.value)}
              placeholder="Search FAQs…"
              className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 pl-9 pr-4 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div className="space-y-2">
            {filteredFaqs.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">No FAQs match &ldquo;{faqQuery}&rdquo;</p>
            ) : (
              filteredFaqs.map((f) => (
                <FaqAccordionItem key={f.q} faq={f} expanded={expandedFaqs.has(f.q)} onToggle={() => toggleFaq(f.q)} />
              ))
            )}
          </div>
        </div>

        {/* Submit a request / My requests */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-6">
          <SectionHeader
            icon={LifeBuoy}
            iconClass="text-primary-500 bg-primary-500/10"
            title={tab === "new" ? "Submit a Request" : "My Requests"}
            subtitle={tab === "new" ? "We'll get back to you soon" : "Follow up in the same thread"}
          />

          {tab === "history" ? (
            <RequestHistory requests={initialRequests} onOpen={setOpenRequestId} />
          ) : status === "sent" ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10"><CheckCircle2 className="h-6 w-6 text-emerald-500" /></div>
              <p className="text-sm font-medium text-gray-900 dark:text-zinc-50">Your message has been sent</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">You can follow the conversation under My Requests.</p>
              <div className="mt-1 flex gap-2">
                <button onClick={() => setStatus("idle")} className="rounded-lg border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">Send another</button>
                <button onClick={() => setTab("history")} className="rounded-lg border border-gray-200 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">View My Requests</button>
              </div>
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
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief description of your issue" className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-600 dark:text-zinc-400">Message</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} placeholder="Describe your issue in detail…" className="w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-gray-900 dark:text-zinc-100 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20 resize-none" />
              </div>
              <FancyButton onClick={handleSubmit} size="sm" className="w-full justify-center" disabled={!subject.trim() || !message.trim() || status === "sending"}>
                {status === "sending" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Submit Request
              </FancyButton>
              {status === "error" && <p className="text-xs text-red-500">{error}</p>}
            </div>
          )}
        </div>
      </div>

      {openRequestId && (
        <SupportThreadModal
          requestId={openRequestId}
          viewerRole="super_admin"
          onClose={() => setOpenRequestId(null)}
          onReplied={() => router.refresh()}
          headerExtra={(t) => (
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${SUPPORT_STATUS_BADGE[t.status]}`}>
              {SUPPORT_STATUS_LABEL[t.status]}
            </span>
          )}
        />
      )}
    </div>
  );
}
