"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { createCustomHostname, getCustomHostname, deleteCustomHostname } from "./cloudflare";

export interface DomainRow {
  id: string;
  domain: string;
  status: "pending" | "verifying" | "active" | "failed";
  sslStatus: string | null;
  errorMessage: string | null;
  createdAt: string;
  verifiedAt: string | null;
}

async function requireOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const role = user?.user_metadata?.role as string | undefined;
  if (!user || (role !== "super_admin" && role !== "kernel")) {
    throw new Error("Unauthorized");
  }
  return user;
}

function toRow(r: {
  id: string;
  domain: string;
  status: string;
  ssl_status: string | null;
  error_message: string | null;
  created_at: string;
  verified_at: string | null;
}): DomainRow {
  return {
    id: r.id,
    domain: r.domain,
    status: r.status as DomainRow["status"],
    sslStatus: r.ssl_status,
    errorMessage: r.error_message,
    createdAt: r.created_at,
    verifiedAt: r.verified_at,
  };
}

export async function listDomains(): Promise<DomainRow[]> {
  const user = await requireOwner();

  const { data } = await supabaseAdmin
    .from("institution_domains")
    .select("id, domain, status, ssl_status, error_message, created_at, verified_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map(toRow);
}

export async function addDomain(domainInput: string): Promise<DomainRow> {
  const user = await requireOwner();

  const domain = domainInput.trim().toLowerCase();
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain)) {
    throw new Error("Enter a valid domain, e.g. www.yourschool.edu.in");
  }

  const hostname = await createCustomHostname(domain);

  const { data, error } = await supabaseAdmin
    .from("institution_domains")
    .insert({
      owner_id: user.id,
      domain,
      status: "verifying",
      cloudflare_hostname_id: hostname.id,
      ssl_status: hostname.ssl.status,
    })
    .select("id, domain, status, ssl_status, error_message, created_at, verified_at")
    .single();

  if (error) throw new Error(`Failed to save domain: ${error.message}`);

  revalidatePath("/dashboard/settings");
  return toRow(data);
}

export async function refreshDomainStatus(domainId: string): Promise<DomainRow> {
  const user = await requireOwner();

  const { data: row } = await supabaseAdmin
    .from("institution_domains")
    .select("id, owner_id, cloudflare_hostname_id")
    .eq("id", domainId)
    .maybeSingle();

  if (!row || row.owner_id !== user.id) throw new Error("Not found");
  if (!row.cloudflare_hostname_id) throw new Error("Domain has no Cloudflare hostname on record");

  const hostname = await getCustomHostname(row.cloudflare_hostname_id);
  const sslActive = hostname.ssl.status === "active";
  const validationError = hostname.ssl.validation_errors?.[0]?.message ?? null;

  const { data, error } = await supabaseAdmin
    .from("institution_domains")
    .update({
      status: sslActive ? "active" : validationError ? "failed" : "verifying",
      ssl_status: hostname.ssl.status,
      error_message: validationError,
      verified_at: sslActive ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", domainId)
    .select("id, domain, status, ssl_status, error_message, created_at, verified_at")
    .single();

  if (error) throw new Error(`Failed to refresh domain: ${error.message}`);

  revalidatePath("/dashboard/settings");
  return toRow(data);
}

export async function removeDomain(domainId: string): Promise<void> {
  const user = await requireOwner();

  const { data: row } = await supabaseAdmin
    .from("institution_domains")
    .select("owner_id, cloudflare_hostname_id")
    .eq("id", domainId)
    .maybeSingle();

  if (!row || row.owner_id !== user.id) throw new Error("Not found");

  if (row.cloudflare_hostname_id) {
    try {
      await deleteCustomHostname(row.cloudflare_hostname_id);
    } catch {
      // Cloudflare-side cleanup is best-effort — don't block removing the
      // record locally if e.g. it was already deleted on their end.
    }
  }

  const { error } = await supabaseAdmin.from("institution_domains").delete().eq("id", domainId);
  if (error) throw new Error(`Failed to remove domain: ${error.message}`);

  revalidatePath("/dashboard/settings");
}
