"use client";

import { useState, useRef, useEffect, useMemo, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  MessageSquare, Search, Plus, X, Send,
  CheckCheck, Info, Phone,
  Circle, ArrowLeft,
} from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import {
  ROLE_BADGE, ROLE_LABEL, ROLE_AVATAR,
  formatTime, formatRelativeDate, getInitials,
  type Conversation, type MessageEntry, type ContactRole, type Contact,
} from "../_data/messages";
import { sendMessage, startConversation, markConversationRead } from "../actions";

function Avatar({ name, role, size = "md" }: { name: string; role: ContactRole; size?: "sm" | "md" | "lg" }) {
  const sz = { sm: "h-7 w-7 text-[10px]", md: "h-9 w-9 text-xs", lg: "h-10 w-10 text-sm" }[size];
  return (
    <div className={`${sz} ${ROLE_AVATAR[role]} flex shrink-0 items-center justify-center rounded-full text-white font-bold select-none`}>
      {getInitials(name)}
    </div>
  );
}

function ConvItem({ conv, selected, onClick }: { conv: Conversation; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-start gap-3 px-3 py-3 transition-colors text-left ${selected ? "bg-primary-50 dark:bg-primary-500/10" : "hover:bg-gray-50 dark:hover:bg-zinc-800/60"}`}>
      <Avatar name={conv.contact.name} role={conv.contact.role} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={`truncate text-sm font-semibold ${selected ? "text-primary-700 dark:text-primary-300" : conv.unread > 0 ? "text-gray-900 dark:text-zinc-50" : "text-gray-700 dark:text-zinc-300"}`}>{conv.contact.name}</span>
          <span className="shrink-0 text-[10px] text-gray-400 dark:text-zinc-500 whitespace-nowrap">{formatRelativeDate(conv.lastTime)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`truncate text-xs ${conv.unread > 0 ? "text-gray-800 dark:text-zinc-200 font-medium" : "text-gray-500 dark:text-zinc-500"}`}>{conv.lastMessage || "No messages yet"}</p>
          {conv.unread > 0 && <span className="shrink-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold text-white">{conv.unread}</span>}
        </div>
        <span className={`mt-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${ROLE_BADGE[conv.contact.role]}`}>{ROLE_LABEL[conv.contact.role]}</span>
      </div>
    </button>
  );
}

function ThreadHeader({ conv, onBack }: { conv: Conversation; onBack: () => void }) {
  const [infoOpen, setInfoOpen] = useState(false);
  return (
    <div className="relative flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4">
      <button onClick={onBack} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors lg:hidden">
        <ArrowLeft className="h-4 w-4" />
      </button>
      <Avatar name={conv.contact.name} role={conv.contact.role} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50 truncate">{conv.contact.name}</p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_BADGE[conv.contact.role]}`}>{ROLE_LABEL[conv.contact.role]}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => setInfoOpen((o) => !o)} className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${infoOpen ? "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200" : "text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-700 dark:hover:text-zinc-200"}`}>
          <Info className="h-4 w-4" />
        </button>
      </div>

      {infoOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setInfoOpen(false)} />
          <div className="absolute right-4 top-full z-50 mt-2 w-60 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-4 shadow-lg shadow-black/10">
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={conv.contact.name} role={conv.contact.role} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-zinc-50">{conv.contact.name}</p>
                <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${ROLE_BADGE[conv.contact.role]}`}>{ROLE_LABEL[conv.contact.role]}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
              <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-zinc-500" />
              {conv.contact.phone ? (
                <a href={`tel:${conv.contact.phone}`} className="text-primary-600 dark:text-primary-400 hover:underline">{conv.contact.phone}</a>
              ) : (
                <span>No phone number on file</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Bubble({ msg, convName, convRole }: { msg: MessageEntry; convName: string; convRole: ContactRole }) {
  const isMe = msg.fromMe;
  return (
    <div className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      {!isMe && <Avatar name={convName} role={convRole} size="sm" />}
      <div className={`max-w-[72%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
        <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${isMe ? "bg-primary-500 text-white rounded-tr-sm" : "bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-100 rounded-tl-sm"}`}>{msg.text}</div>
        <div className={`flex items-center gap-1 text-[10px] text-gray-400 dark:text-zinc-500 ${isMe ? "flex-row-reverse" : ""}`}>
          <span>{formatTime(msg.time)}</span>
          {isMe && <CheckCheck className="h-3 w-3 text-primary-400" />}
        </div>
      </div>
    </div>
  );
}

function MessageThread({ conv, onBack, onSent }: { conv: Conversation; onBack: () => void; onSent: () => void }) {
  const [reply, setReply] = useState("");
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conv.messages.length]);

  function handleSend() {
    if (!reply.trim()) return;
    const text = reply.trim();
    setReply("");
    startTransition(async () => {
      await sendMessage(conv.id, text);
      onSent();
    });
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <>
      <ThreadHeader conv={conv} onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {conv.messages.length === 0 ? (
          <p className="text-center text-sm text-gray-400 dark:text-zinc-500 py-10">No messages yet. Say hello!</p>
        ) : conv.messages.map((msg) => <Bubble key={msg.id} msg={msg} convName={conv.contact.name} convRole={conv.contact.role} />)}
        <div ref={bottomRef} />
      </div>
      <div className="shrink-0 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={handleKey}
            placeholder={`Message ${conv.contact.name}…`}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-4 py-2.5 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 max-h-28 overflow-y-auto"
            style={{ minHeight: 40 }}
          />
          <button onClick={handleSend} disabled={!reply.trim() || isPending} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500 hover:bg-primary-600 text-white transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-gray-400 dark:text-zinc-600 pl-1">Press Enter to send · Shift+Enter for new line</p>
      </div>
    </>
  );
}

function EmptyState({ totalConvs, unread, onCompose }: { totalConvs: number; unread: number; onCompose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500/10"><MessageSquare className="h-8 w-8 text-primary-500" /></div>
        <div>
          <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Your messages</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">Select a conversation to start reading, or compose a new message.</p>
        </div>
        <FancyButton onClick={onCompose} size="sm">
          <Plus className="h-4 w-4" /> Compose
        </FancyButton>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {[
          { label: "Conversations", value: totalConvs, icon: MessageSquare, accent: "text-indigo-500 bg-indigo-500/10" },
          { label: "Unread", value: unread, icon: Circle, accent: "text-amber-500  bg-amber-500/10" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex flex-col gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.accent}`}><s.icon className="h-4 w-4" /></div>
            <div><p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p><p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p></div>
          </div>
        ))}
      </div>
    </div>
  );
}

type ComposeStep = "pick" | "chat";

function ComposeModal({
  contacts, existingConversations, initialContactId, onClose, onOpenExisting, onCreated,
}: {
  contacts: Contact[];
  existingConversations: Conversation[];
  initialContactId?: string | null;
  onClose: () => void;
  onOpenExisting: (conversationId: string) => void;
  onCreated: (conversationId: string) => void;
}) {
  const initialContact = initialContactId ? contacts.find((c) => c.profileId === initialContactId) ?? null : null;
  const [step, setStep] = useState<ComposeStep>(initialContact ? "chat" : "pick");
  const [query, setQuery] = useState("");
  const [contact, setContact] = useState<Contact | null>(initialContact);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return contacts.filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [contacts, query]);

  function handlePick(c: Contact) {
    const existing = existingConversations.find((conv) => conv.contact.profileId === c.profileId);
    if (existing) {
      onOpenExisting(existing.id);
      onClose();
      return;
    }
    setContact(c);
    setStep("chat");
  }

  function handleSend() {
    if (!contact || !text.trim()) return;
    const body = text.trim();
    setText("");
    startTransition(async () => {
      const id = await startConversation(contact.profileId, body);
      onCreated(id);
      onClose();
    });
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-[32rem] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl">
        {step === "pick" ? (
          <>
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 dark:border-zinc-800 px-5 py-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">Select recipient</p>
              <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="shrink-0 px-4 pt-3 pb-1">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search people…"
                  className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 pl-8 pr-3 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {filtered.length === 0 ? (
                <p className="py-10 text-center text-xs text-gray-400 dark:text-zinc-500">
                  {contacts.length === 0 ? "No contacts available yet — accounts need to be set up for messaging." : "No matches"}
                </p>
              ) : filtered.map((c) => (
                <button key={c.profileId} onClick={() => handlePick(c)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800/60">
                  <Avatar name={c.name} role={c.role} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-zinc-100">{c.name}</p>
                    <span className={`mt-0.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${ROLE_BADGE[c.role]}`}>{ROLE_LABEL[c.role]}</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        ) : contact && (
          <>
            <div className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 dark:border-zinc-800 px-4">
              <button onClick={() => { setStep("pick"); setContact(null); }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"><ArrowLeft className="h-4 w-4" /></button>
              <Avatar name={contact.name} role={contact.role} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-zinc-50">{contact.name}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_BADGE[contact.role]}`}>{ROLE_LABEL[contact.role]}</span>
                </div>
              </div>
              <button onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-5">
              <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No messages yet. Say hello!</p>
            </div>
            <div className="shrink-0 border-t border-gray-200 dark:border-zinc-800 px-4 py-3">
              <div className="flex items-end gap-2">
                <textarea
                  autoFocus
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={`Message ${contact.name}…`}
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-4 py-2.5 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 max-h-28 overflow-y-auto"
                  style={{ minHeight: 40 }}
                />
                <button onClick={handleSend} disabled={!text.trim() || isPending} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500 hover:bg-primary-600 text-white transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1.5 pl-1 text-[10px] text-gray-400 dark:text-zinc-600">Sending this will start the conversation</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

type TabValue = "all" | "unread" | "teacher" | "staff" | "parent";
const TABS: { value: TabValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "teacher", label: "Teachers" },
  { value: "staff", label: "Staff" },
  { value: "parent", label: "Parents" },
];

export default function MessagesClient({
  conversations, contacts, myProfileId,
}: {
  conversations: Conversation[];
  contacts: Contact[];
  myProfileId: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedId, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabValue>("all");
  const [composing, setComposing] = useState(false);
  const [presetContactId, setPresetContactId] = useState<string | null>(null);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  useEffect(() => {
    const withId = searchParams.get("with");
    if (!withId) return;
    const existing = conversations.find((c) => c.contact.profileId === withId);
    if (existing) {
      setSelected(existing.id);
    } else if (contacts.some((c) => c.profileId === withId)) {
      setPresetContactId(withId);
      setComposing(true);
    }
    router.replace("/dashboard/messages");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return conversations.filter((c) => {
      const matchQ = !q || c.contact.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q);
      const matchTab = tab === "all" ? true : tab === "unread" ? c.unread > 0 : c.contact.role === tab;
      return matchQ && matchTab;
    });
  }, [conversations, query, tab]);

  function handleSelect(id: string) {
    setSelected(id);
    const conv = conversations.find((c) => c.id === id);
    if (conv && conv.unread > 0) markConversationRead(id);
  }

  function refresh() {
    router.refresh();
  }

  if (!myProfileId) {
    return (
      <div className="flex h-full items-center justify-center px-6">
        <p className="text-sm text-gray-400 dark:text-zinc-500">You need to be signed in to view messages.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className={`flex flex-col border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 ${selected ? "hidden lg:flex w-80 shrink-0" : "flex w-full lg:w-80 lg:shrink-0"}`}>
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 dark:border-zinc-800 px-4 py-4">
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-zinc-50">Messages</h1>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">{totalUnread > 0 ? <span className="text-primary-600 dark:text-primary-400 font-medium">{totalUnread} unread</span> : "All caught up"}</p>
          </div>
          <button onClick={() => { setPresetContactId(null); setComposing(true); }} className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-colors shadow-sm"><Plus className="h-4 w-4" /></button>
        </div>
        <div className="shrink-0 px-3 pt-3 pb-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search messages…" className="h-8 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 pl-8 pr-3 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-primary-400 dark:focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20" />
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-0.5 overflow-x-auto px-3 pt-2 pb-1.5">
          {TABS.map((t) => (
            <button key={t.value} onClick={() => setTab(t.value)} className={`flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${tab === t.value ? "bg-primary-500/10 text-primary-600 dark:text-primary-400" : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800"}`}>
              {t.label}
              {t.value === "unread" && totalUnread > 0 && <span className="rounded-full bg-primary-500 px-1 text-[9px] font-bold text-white leading-tight py-0.5">{totalUnread}</span>}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-800/60">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <MessageSquare className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
              <p className="text-xs text-gray-400 dark:text-zinc-500">No conversations found</p>
            </div>
          ) : filtered.map((c) => <ConvItem key={c.id} conv={c} selected={selectedId === c.id} onClick={() => handleSelect(c.id)} />)}
        </div>
      </div>

      <div className={`flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-zinc-900 ${selected ? "flex" : "hidden lg:flex"}`}>
        {selected ? (
          <MessageThread conv={selected} onBack={() => setSelected(null)} onSent={refresh} />
        ) : (
          <EmptyState totalConvs={conversations.length} unread={totalUnread} onCompose={() => { setPresetContactId(null); setComposing(true); }} />
        )}
      </div>

      {composing && (
        <ComposeModal
          contacts={contacts}
          existingConversations={conversations}
          initialContactId={presetContactId}
          onClose={() => { setComposing(false); setPresetContactId(null); }}
          onOpenExisting={(id) => setSelected(id)}
          onCreated={(id) => { setSelected(id); refresh(); }}
        />
      )}
    </div>
  );
}
