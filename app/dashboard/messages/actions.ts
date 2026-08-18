"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";

async function currentProfileId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export async function sendMessage(conversationId: string, text: string) {
  const myId = await currentProfileId();
  if (!text.trim()) return;

  const { error: msgError } = await supabaseAdmin.from("messages").insert({
    conversation_id: conversationId,
    sender_id: myId,
    text: text.trim(),
    is_read: false,
  });
  if (msgError) throw new Error(msgError.message);

  const { error: convError } = await supabaseAdmin
    .from("conversations")
    .update({ last_message: text.trim(), last_time: new Date().toISOString() })
    .eq("id", conversationId);
  if (convError) throw new Error(convError.message);

  revalidatePath("/dashboard/messages");
}

export async function startConversation(otherProfileId: string, text: string): Promise<string> {
  const myId = await currentProfileId();
  const schoolId = await getCurrentSchoolIdOrThrow();
  if (!text.trim()) throw new Error("Message text is required");

  const { data: existing } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .eq("school_id", schoolId)
    .or(`and(participant1.eq.${myId},participant2.eq.${otherProfileId}),and(participant1.eq.${otherProfileId},participant2.eq.${myId})`)
    .maybeSingle();

  let conversationId = existing?.id;

  if (!conversationId) {
    const { data: created, error } = await supabaseAdmin
      .from("conversations")
      .insert({
        school_id: schoolId,
        participant1: myId,
        participant2: otherProfileId,
        last_message: text.trim(),
        last_time: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    conversationId = created.id;
  }

  await sendMessage(conversationId, text);
  return conversationId;
}

export async function markConversationRead(conversationId: string) {
  const myId = await currentProfileId();
  await supabaseAdmin
    .from("messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .neq("sender_id", myId)
    .eq("is_read", false);
  revalidatePath("/dashboard/messages");
}
