"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentInstitutionIdOrThrow } from "@/lib/supabase/institution-context";
import { getVerifiedRole } from "@/lib/auth/verified-role";
import {
  sendSupportRequestEmail,
  sendSupportRequestReplyToTeamEmail,
  sendSupportRequestReplyToUserEmail,
} from "@/lib/email/resend";
import type {
  SupportRequestStatus, SupportRequestSummary, SupportRequestThread, SupportMessage,
} from "./types";

interface AuthedUser {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}

async function requireUser(): Promise<AuthedUser> {
  const {
    data: { user },
  } = await getUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

function senderNameOf(user: AuthedUser): string {
  return (user.user_metadata?.full_name as string) || user.email || "—";
}

interface RequestRow {
  id: string;
  institution_id: string;
  category: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  institutions: { name: string | null; owner_id: string | null } | null;
  support_request_messages?: { id: string; body: string; created_at: string }[];
}

async function listRequestsForInstitutions(institutionIds: string[] | null): Promise<SupportRequestSummary[]> {
  let query = supabaseAdmin
    .from("support_requests")
    .select(
      "id, institution_id, category, subject, status, created_at, updated_at, institutions ( name, owner_id ), support_request_messages ( id, body, created_at )"
    )
    .order("updated_at", { ascending: false });
  if (institutionIds) query = query.in("institution_id", institutionIds);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return ((data ?? []) as unknown as RequestRow[]).map((r) => {
    const messages = r.support_request_messages ?? [];
    const last = messages.slice().sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
    return {
      id: r.id,
      institutionId: r.institution_id,
      institutionName: r.institutions?.name ?? "—",
      category: r.category,
      subject: r.subject,
      status: r.status as SupportRequestStatus,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      messageCount: messages.length,
      lastMessagePreview: last?.body ?? "",
      lastMessageAt: last?.created_at ?? r.created_at,
    };
  });
}

// ── Super admin: create + list their own institution's requests ────────────

export async function createSupportRequest(input: {
  category: string;
  subject: string;
  message: string;
}): Promise<string> {
  const user = await requireUser();
  const role = await getVerifiedRole();
  if (role !== "super_admin") throw new Error("Unauthorized");

  const subject = input.subject.trim();
  const message = input.message.trim();
  if (!subject || !message) throw new Error("Subject and message are required");

  const institutionId = await getCurrentInstitutionIdOrThrow();
  const { data: institution } = await supabaseAdmin
    .from("institutions")
    .select("name")
    .eq("id", institutionId)
    .maybeSingle();

  const { data: request, error } = await supabaseAdmin
    .from("support_requests")
    .insert({ institution_id: institutionId, created_by: user.id, category: input.category, subject })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const { error: msgError } = await supabaseAdmin.from("support_request_messages").insert({
    support_request_id: request.id,
    sender_role: "super_admin",
    sender_name: senderNameOf(user),
    sender_email: user.email ?? null,
    body: message,
  });
  if (msgError) throw new Error(msgError.message);

  await sendSupportRequestEmail({
    institutionName: institution?.name ?? "—",
    fromName: senderNameOf(user),
    fromEmail: user.email ?? "—",
    category: input.category,
    subject,
    message,
  });

  revalidatePath("/dashboard/help");
  return request.id as string;
}

export async function getMySupportRequests(): Promise<SupportRequestSummary[]> {
  await requireUser();
  const role = await getVerifiedRole();
  if (role !== "super_admin") return [];

  const institutionId = await getCurrentInstitutionIdOrThrow();
  return listRequestsForInstitutions([institutionId]);
}

// ── Kernel: list every institution's requests ───────────────────────────────

export async function getAllSupportRequests(): Promise<SupportRequestSummary[]> {
  await requireUser();
  const role = await getVerifiedRole();
  if (role !== "kernel") throw new Error("Unauthorized");
  return listRequestsForInstitutions(null);
}

// ── Shared: read a thread, reply to it ──────────────────────────────────────

export async function getSupportRequestThread(requestId: string): Promise<SupportRequestThread | null> {
  await requireUser();
  const role = await getVerifiedRole();

  const { data, error } = await supabaseAdmin
    .from("support_requests")
    .select("id, institution_id, category, subject, status, created_at, institutions ( name, owner_id )")
    .eq("id", requestId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const request = data as unknown as RequestRow;

  if (role === "super_admin") {
    const institutionId = await getCurrentInstitutionIdOrThrow();
    if (request.institution_id !== institutionId) throw new Error("Unauthorized");
  } else if (role !== "kernel") {
    throw new Error("Unauthorized");
  }

  const { data: messages, error: msgError } = await supabaseAdmin
    .from("support_request_messages")
    .select("id, sender_role, sender_name, sender_email, body, created_at")
    .eq("support_request_id", requestId)
    .order("created_at", { ascending: true });
  if (msgError) throw new Error(msgError.message);

  return {
    id: request.id,
    institutionId: request.institution_id,
    institutionName: request.institutions?.name ?? "—",
    category: request.category,
    subject: request.subject,
    status: request.status as SupportRequestStatus,
    createdAt: request.created_at,
    messages: (messages ?? []).map((m): SupportMessage => ({
      id: m.id,
      senderRole: m.sender_role as SupportMessage["senderRole"],
      senderName: m.sender_name,
      senderEmail: m.sender_email,
      body: m.body,
      createdAt: m.created_at,
    })),
  };
}

export async function replySupportRequest(input: { requestId: string; message: string }): Promise<void> {
  const user = await requireUser();
  const role = await getVerifiedRole();
  const message = input.message.trim();
  if (!message) throw new Error("Message is required");

  const { data, error } = await supabaseAdmin
    .from("support_requests")
    .select("id, institution_id, subject, status, institutions ( name, owner_id )")
    .eq("id", input.requestId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Support request not found");
  const request = data as unknown as RequestRow;

  let senderRole: "super_admin" | "kernel";
  if (role === "super_admin") {
    const institutionId = await getCurrentInstitutionIdOrThrow();
    if (request.institution_id !== institutionId) throw new Error("Unauthorized");
    senderRole = "super_admin";
  } else if (role === "kernel") {
    senderRole = "kernel";
  } else {
    throw new Error("Unauthorized");
  }

  const { error: msgError } = await supabaseAdmin.from("support_request_messages").insert({
    support_request_id: input.requestId,
    sender_role: senderRole,
    sender_name: senderNameOf(user),
    sender_email: user.email ?? null,
    body: message,
  });
  if (msgError) throw new Error(msgError.message);

  // A kernel reply moves an open ticket into review; a super_admin reply
  // (e.g. following up) reopens a resolved one rather than leaving it
  // marked done while there's an unanswered message on it.
  const nextStatus: SupportRequestStatus =
    senderRole === "kernel" ? (request.status === "resolved" ? "resolved" : "in_review") : "open";
  await supabaseAdmin
    .from("support_requests")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", input.requestId);

  if (senderRole === "super_admin") {
    await sendSupportRequestReplyToTeamEmail({
      institutionName: request.institutions?.name ?? "—",
      fromName: senderNameOf(user),
      fromEmail: user.email ?? "—",
      subject: request.subject,
      message,
    });
  } else {
    const ownerId = request.institutions?.owner_id;
    if (ownerId) {
      const { data: ownerUser } = await supabaseAdmin.auth.admin.getUserById(ownerId);
      const ownerEmail = ownerUser?.user?.email;
      if (ownerEmail) {
        await sendSupportRequestReplyToUserEmail({ to: ownerEmail, subject: request.subject, message });
      }
    }
  }

  revalidatePath("/dashboard/help");
  revalidatePath("/dashboard/support");
}

export async function updateSupportRequestStatus(requestId: string, status: SupportRequestStatus): Promise<void> {
  await requireUser();
  const role = await getVerifiedRole();
  if (role !== "kernel") throw new Error("Unauthorized");

  const { error } = await supabaseAdmin
    .from("support_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/support");
}
