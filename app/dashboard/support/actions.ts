"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { sendContactLeadReplyEmail } from "@/lib/email/resend";

async function requireKernel(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as string | undefined;
  if (!user || role !== "kernel") throw new Error("Unauthorized");
}

export async function replyToContactLead(input: { leadId: string; message: string }): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as string | undefined;
  if (!user || role !== "kernel") throw new Error("Unauthorized");

  const message = input.message.trim();
  if (!message) throw new Error("Reply message is required");

  const { data: lead, error } = await supabaseAdmin
    .from("contact_submissions")
    .select("id, name, email, topic, message")
    .eq("id", input.leadId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!lead) throw new Error("Lead not found");

  await sendContactLeadReplyEmail({
    to: lead.email,
    name: lead.name,
    topic: lead.topic,
    originalMessage: lead.message,
    reply: message,
  });

  const { error: updateError } = await supabaseAdmin
    .from("contact_submissions")
    .update({ replied_at: new Date().toISOString() })
    .eq("id", input.leadId);
  if (updateError) throw new Error(updateError.message);

  revalidatePath("/dashboard/support");
}

export async function toggleContactLeadFlag(leadId: string, flagged: boolean): Promise<void> {
  await requireKernel();

  const { error } = await supabaseAdmin
    .from("contact_submissions")
    .update({ flagged })
    .eq("id", leadId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/support");
}

export async function markContactLeadNotReplied(leadId: string): Promise<void> {
  await requireKernel();

  const { error } = await supabaseAdmin
    .from("contact_submissions")
    .update({ replied_at: null })
    .eq("id", leadId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/support");
}

export async function markContactLeadViewed(leadId: string): Promise<void> {
  await requireKernel();

  const { error } = await supabaseAdmin
    .from("contact_submissions")
    .update({ viewed_at: new Date().toISOString() })
    .eq("id", leadId)
    .is("viewed_at", null);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/support");
}

export async function markContactLeadUnread(leadId: string): Promise<void> {
  await requireKernel();

  const { error } = await supabaseAdmin
    .from("contact_submissions")
    .update({ viewed_at: null })
    .eq("id", leadId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/support");
}

export async function deleteContactLead(leadId: string): Promise<void> {
  await requireKernel();

  const { error } = await supabaseAdmin
    .from("contact_submissions")
    .delete()
    .eq("id", leadId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/support");
}
