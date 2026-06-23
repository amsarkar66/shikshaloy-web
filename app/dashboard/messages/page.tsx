"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  MessageSquare, Search, Plus, X, Send,
  CheckCheck, MoreVertical, Phone, Video,
  GraduationCap, Briefcase, Heart, Users,
  Circle, Info, ArrowLeft,
} from "lucide-react";
import {
  ALL_CONVERSATIONS, ROLE_BADGE, ROLE_LABEL, ROLE_AVATAR,
  formatTime, formatRelativeDate, getInitials,
  type Conversation, type MessageEntry, type ContactRole,
} from "./_data/messages";

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({
  name, role, size = "md",
}: {
  name: string; role: ContactRole; size?: "sm" | "md" | "lg";
}) {
  const sz = { sm: "h-7 w-7 text-[10px]", md: "h-9 w-9 text-xs", lg: "h-10 w-10 text-sm" }[size];
  return (
    <div className={`${sz} ${ROLE_AVATAR[role]} flex shrink-0 items-center justify-center rounded-full text-white font-bold select-none`}>
      {getInitials(name)}
    </div>
  );
}

// ── Conversation list item ─────────────────────────────────────────────────────

function ConvItem({
  conv, selected, onClick,
}: {
  conv: Conversation; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-3 py-3 transition-colors text-left ${
        selected
          ? "bg-indigo-50 dark:bg-indigo-500/10"
          : "hover:bg-gray-50 dark:hover:bg-zinc-800/60"
      }`}
    >
      <div className="relative shrink-0">
        <Avatar name={conv.name} role={conv.role} />
        {conv.online && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-zinc-950 bg-emerald-500" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={`truncate text-sm font-semibold ${
            selected
              ? "text-indigo-700 dark:text-indigo-300"
              : conv.unread > 0
              ? "text-gray-900 dark:text-zinc-50"
              : "text-gray-700 dark:text-zinc-300"
          }`}>
            {conv.name}
          </span>
          <span className="shrink-0 text-[10px] text-gray-400 dark:text-zinc-500 whitespace-nowrap">
            {formatRelativeDate(conv.lastTime)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className={`truncate text-xs ${
            conv.unread > 0
              ? "text-gray-800 dark:text-zinc-200 font-medium"
              : "text-gray-500 dark:text-zinc-500"
          }`}>
            {conv.lastMessage}
          </p>
          {conv.unread > 0 && (
            <span className="shrink-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[10px] font-bold text-white">
              {conv.unread}
            </span>
          )}
        </div>

        <span className={`mt-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${ROLE_BADGE[conv.role]}`}>
          {ROLE_LABEL[conv.role]}
        </span>
      </div>
    </button>
  );
}

// ── Thread header ─────────────────────────────────────────────────────────────

function ThreadHeader({ conv, onBack }: { conv: Conversation; onBack: () => void }) {
  return (
    <div className="flex h-14 shrink-0 items-center gap-3 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4">
      <button
        onClick={onBack}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors lg:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <div className="relative shrink-0">
        <Avatar name={conv.name} role={conv.role} />
        {conv.online && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white dark:border-zinc-950 bg-emerald-500" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50 truncate">{conv.name}</p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_BADGE[conv.role]}`}>
            {ROLE_LABEL[conv.role]}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
          {conv.online ? (
            <span className="text-emerald-600 dark:text-emerald-400">Online</span>
          ) : (
            "Offline"
          )}
          {" · "}{conv.detail}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
          <Phone className="h-4 w-4" />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
          <Info className="h-4 w-4" />
        </button>
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function Bubble({ msg, convName, convRole }: { msg: MessageEntry; convName: string; convRole: ContactRole }) {
  const isMe = msg.from === "me";
  return (
    <div className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
      {!isMe && <Avatar name={convName} role={convRole} size="sm" />}

      <div className={`max-w-[72%] flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
        <div className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isMe
            ? "bg-indigo-500 text-white rounded-tr-sm"
            : "bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-zinc-100 rounded-tl-sm"
        }`}>
          {msg.text}
        </div>
        <div className={`flex items-center gap-1 text-[10px] text-gray-400 dark:text-zinc-500 ${isMe ? "flex-row-reverse" : ""}`}>
          <span>{formatTime(msg.time)}</span>
          {isMe && <CheckCheck className="h-3 w-3 text-indigo-400" />}
        </div>
      </div>
    </div>
  );
}

// ── Message thread ────────────────────────────────────────────────────────────

function MessageThread({
  conv, reply, setReply, onSend, onBack,
}: {
  conv: Conversation;
  reply: string;
  setReply: (v: string) => void;
  onSend: () => void;
  onBack: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv.messages]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <>
      <ThreadHeader conv={conv} onBack={onBack} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {conv.messages.map((msg) => (
          <Bubble key={msg.id} msg={msg} convName={conv.name} convRole={conv.role} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      <div className="shrink-0 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={handleKey}
            placeholder={`Message ${conv.name}…`}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-4 py-2.5 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 max-h-28 overflow-y-auto"
            style={{ minHeight: 40 }}
          />
          <button
            onClick={onSend}
            disabled={!reply.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-gray-400 dark:text-zinc-600 pl-1">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({
  totalConvs, unread, onCompose,
}: {
  totalConvs: number; unread: number; onCompose: () => void;
}) {
  const stats = [
    { label: "Conversations", value: totalConvs, icon: MessageSquare, accent: "text-indigo-500 bg-indigo-500/10" },
    { label: "Unread",        value: unread,      icon: Circle,        accent: "text-amber-500  bg-amber-500/10"  },
    { label: "Teachers",      value: ALL_CONVERSATIONS.filter(c => c.role === "teacher").length, icon: GraduationCap, accent: "text-emerald-500 bg-emerald-500/10" },
    { label: "Parents",       value: ALL_CONVERSATIONS.filter(c => c.role === "parent").length,  icon: Heart,         accent: "text-rose-500   bg-rose-500/10"   },
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10">
          <MessageSquare className="h-8 w-8 text-indigo-500" />
        </div>
        <div>
          <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">Your messages</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
            Select a conversation to start reading, or compose a new message.
          </p>
        </div>
        <button
          onClick={onCompose}
          className="flex h-9 items-center gap-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Compose
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex flex-col gap-2"
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.accent}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-zinc-50">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Compose modal ─────────────────────────────────────────────────────────────

const COMPOSE_RECIPIENTS = [
  "Mrs. Kavita Sharma (Teacher, 7A)",
  "Mr. Rajesh Kumar (Vice Principal)",
  "Mr. Suresh Menon (Teacher, Math)",
  "Mrs. Anita Joshi (Teacher, Science)",
  "Mrs. Deepa Singh (Accountant)",
  "Miss Roopa Bhat (Librarian)",
  "Mr. Prakash Iyer (IT Coordinator)",
];

function ComposeModal({ onClose }: { onClose: () => void }) {
  const [to, setTo]       = useState("");
  const [body, setBody]   = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 px-5 py-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">New Message</p>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1.5">To</label>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 text-sm text-gray-700 dark:text-zinc-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Select recipient…</option>
              {COMPOSE_RECIPIENTS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-zinc-400 block mb-1.5">Message</label>
            <textarea
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message…"
              className="w-full resize-none rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-gray-100 dark:border-zinc-800 px-5 py-4">
          <button
            onClick={onClose}
            disabled={!to || !body.trim()}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-600 px-4 text-sm font-medium text-white transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-3.5 w-3.5" /> Send
          </button>
          <button
            onClick={onClose}
            className="flex h-9 items-center px-3 text-sm font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tab config ────────────────────────────────────────────────────────────────

type TabValue = "all" | "unread" | "teacher" | "staff" | "parent";
const TABS: { value: TabValue; label: string }[] = [
  { value: "all",     label: "All"      },
  { value: "unread",  label: "Unread"   },
  { value: "teacher", label: "Teachers" },
  { value: "staff",   label: "Staff"    },
  { value: "parent",  label: "Parents"  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const [convs, setConvs]         = useState(ALL_CONVERSATIONS);
  const [selectedId, setSelected] = useState<number | null>(null);
  const [query, setQuery]         = useState("");
  const [tab, setTab]             = useState<TabValue>("all");
  const [composing, setComposing] = useState(false);
  const [reply, setReply]         = useState("");

  const selected = convs.find((c) => c.id === selectedId) ?? null;

  const totalUnread = convs.reduce((sum, c) => sum + c.unread, 0);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return convs.filter((c) => {
      const matchQ  = !q || c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q) || c.detail.toLowerCase().includes(q);
      const matchTab = tab === "all"    ? true
        : tab === "unread" ? c.unread > 0
        : c.role === tab;
      return matchQ && matchTab;
    });
  }, [convs, query, tab]);

  function handleSelect(id: number) {
    setSelected(id);
    setReply("");
    setConvs((prev) => prev.map((c) => c.id === id ? { ...c, unread: 0 } : c));
  }

  function handleSend() {
    if (!reply.trim() || !selected) return;
    const msg: MessageEntry = {
      id:   Date.now(),
      from: "me",
      text: reply.trim(),
      time: new Date().toISOString(),
    };
    setConvs((prev) => prev.map((c) =>
      c.id === selected.id
        ? { ...c, messages: [...c.messages, msg], lastMessage: msg.text, lastTime: msg.time }
        : c
    ));
    setReply("");
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <div className={`flex flex-col border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 ${
        selected ? "hidden lg:flex w-80 shrink-0" : "flex w-full lg:w-80 lg:shrink-0"
      }`}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 dark:border-zinc-800 px-4 py-4">
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-zinc-50">Messages</h1>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
              {totalUnread > 0
                ? <span className="text-indigo-600 dark:text-indigo-400 font-medium">{totalUnread} unread</span>
                : "All caught up"}
            </p>
          </div>
          <button
            onClick={() => setComposing(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="shrink-0 px-3 pt-3 pb-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search messages…"
              className="h-8 w-full rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 pl-8 pr-3 text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 flex items-center gap-0.5 overflow-x-auto px-3 pt-2 pb-1.5 scrollbar-none">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                tab === t.value
                  ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                  : "text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800"
              }`}
            >
              {t.label}
              {t.value === "unread" && totalUnread > 0 && (
                <span className="rounded-full bg-indigo-500 px-1 text-[9px] font-bold text-white leading-tight py-0.5">
                  {totalUnread}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-800/60">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16">
              <MessageSquare className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
              <p className="text-xs text-gray-400 dark:text-zinc-500">No conversations found</p>
            </div>
          ) : (
            filtered.map((c) => (
              <ConvItem
                key={c.id}
                conv={c}
                selected={selectedId === c.id}
                onClick={() => handleSelect(c.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right panel ────────────────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-zinc-900 ${
        selected ? "flex" : "hidden lg:flex"
      }`}>
        {selected ? (
          <MessageThread
            conv={selected}
            reply={reply}
            setReply={setReply}
            onSend={handleSend}
            onBack={() => setSelected(null)}
          />
        ) : (
          <EmptyState
            totalConvs={convs.length}
            unread={totalUnread}
            onCompose={() => setComposing(true)}
          />
        )}
      </div>

      {/* Compose modal */}
      {composing && <ComposeModal onClose={() => setComposing(false)} />}
    </div>
  );
}
