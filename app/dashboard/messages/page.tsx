import { Suspense } from "react";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import MessagesClient from "./_components/MessagesClient";
import type { Conversation, Contact, MessageEntry, ContactRole } from "./_data/messages";

export default async function MessagesPage() {
  const {
    data: { user },
  } = await getUser();

  if (!user) {
    return (
      <Suspense fallback={null}>
        <MessagesClient conversations={[]} contacts={[]} myProfileId={null} />
      </Suspense>
    );
  }

  const myId = user.id;
  const schoolId = await getCurrentSchoolIdOrThrow();

  const [{ data: convRows }, { data: contactRows }] = await Promise.all([
    supabaseAdmin
      .from("conversations")
      .select("id, participant1, participant2, last_message, last_time")
      .eq("school_id", schoolId)
      .or(`participant1.eq.${myId},participant2.eq.${myId}`)
      .order("last_time", { ascending: false }),

    supabaseAdmin
      .from("profiles")
      .select("id, full_name, role, phone")
      .eq("school_id", schoolId)
      .neq("id", myId),
  ]);

  const profileById: Record<string, { full_name: string; role: string; phone: string | null }> = {};
  for (const p of contactRows ?? []) {
    profileById[p.id] = { full_name: p.full_name, role: p.role, phone: p.phone };
  }

  const convIds = (convRows ?? []).map((c) => c.id);
  const { data: messageRows } = convIds.length
    ? await supabaseAdmin
        .from("messages")
        .select("id, conversation_id, sender_id, text, is_read, sent_at")
        .in("conversation_id", convIds)
        .order("sent_at")
    : { data: [] as { id: string; conversation_id: string; sender_id: string; text: string; is_read: boolean | null; sent_at: string }[] };

  const messagesByConv: Record<string, MessageEntry[]> = {};
  const unreadByConv: Record<string, number> = {};
  for (const m of messageRows ?? []) {
    (messagesByConv[m.conversation_id] ??= []).push({
      id: m.id,
      fromMe: m.sender_id === myId,
      text: m.text,
      time: m.sent_at,
    });
    if (m.sender_id !== myId && !m.is_read) {
      unreadByConv[m.conversation_id] = (unreadByConv[m.conversation_id] ?? 0) + 1;
    }
  }

  const conversations: Conversation[] = (convRows ?? []).map((c) => {
    const otherId = c.participant1 === myId ? c.participant2 : c.participant1;
    const other = profileById[otherId];
    return {
      id: c.id,
      contact: {
        profileId: otherId,
        name: other?.full_name ?? "Unknown",
        role: (other?.role ?? "staff") as ContactRole,
        phone: other?.phone ?? null,
      },
      lastMessage: c.last_message ?? "",
      lastTime: c.last_time ?? new Date().toISOString(),
      unread: unreadByConv[c.id] ?? 0,
      messages: messagesByConv[c.id] ?? [],
    };
  });

  const contacts: Contact[] = (contactRows ?? []).map((p) => ({
    profileId: p.id,
    name: p.full_name ?? "Unknown",
    role: (p.role ?? "staff") as ContactRole,
    phone: p.phone,
  }));

  return (
    <Suspense fallback={null}>
      <MessagesClient conversations={conversations} contacts={contacts} myProfileId={myId} />
    </Suspense>
  );
}
