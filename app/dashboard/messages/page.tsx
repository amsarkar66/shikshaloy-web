import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin, DEMO_SCHOOL_ID } from "@/lib/supabase/service";
import MessagesClient from "./_components/MessagesClient";
import type { Conversation, Contact, MessageEntry, ContactRole } from "./_data/messages";

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <MessagesClient conversations={[]} contacts={[]} myProfileId={null} />;
  }

  const myId = user.id;

  const [{ data: convRows }, { data: contactRows }] = await Promise.all([
    supabaseAdmin
      .from("conversations")
      .select("id, participant1, participant2, last_message, last_time")
      .eq("school_id", DEMO_SCHOOL_ID)
      .or(`participant1.eq.${myId},participant2.eq.${myId}`)
      .order("last_time", { ascending: false }),

    supabaseAdmin
      .from("profiles")
      .select("id, full_name, role")
      .eq("school_id", DEMO_SCHOOL_ID)
      .neq("id", myId),
  ]);

  const profileById: Record<string, { full_name: string; role: string }> = {};
  for (const p of (contactRows ?? []) as any[]) {
    profileById[p.id] = { full_name: p.full_name, role: p.role };
  }

  const convIds = (convRows ?? []).map((c: any) => c.id);
  const { data: messageRows } = convIds.length
    ? await supabaseAdmin
        .from("messages")
        .select("id, conversation_id, sender_id, text, is_read, sent_at")
        .in("conversation_id", convIds)
        .order("sent_at")
    : { data: [] as any[] };

  const messagesByConv: Record<string, MessageEntry[]> = {};
  const unreadByConv: Record<string, number> = {};
  for (const m of (messageRows ?? []) as any[]) {
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

  const conversations: Conversation[] = (convRows ?? []).map((c: any) => {
    const otherId = c.participant1 === myId ? c.participant2 : c.participant1;
    const other = profileById[otherId];
    return {
      id: c.id,
      contact: {
        profileId: otherId,
        name: other?.full_name ?? "Unknown",
        role: (other?.role ?? "staff") as ContactRole,
      },
      lastMessage: c.last_message ?? "",
      lastTime: c.last_time ?? new Date().toISOString(),
      unread: unreadByConv[c.id] ?? 0,
      messages: messagesByConv[c.id] ?? [],
    };
  });

  const contacts: Contact[] = (contactRows ?? []).map((p: any) => ({
    profileId: p.id,
    name: p.full_name ?? "Unknown",
    role: (p.role ?? "staff") as ContactRole,
  }));

  return <MessagesClient conversations={conversations} contacts={contacts} myProfileId={myId} />;
}
