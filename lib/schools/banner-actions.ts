"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";

export interface SchoolBanner {
  id: string;
  imageUrl: string;
  displayOrder: number;
}

export async function listSchoolBanners(): Promise<SchoolBanner[]> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data } = await supabaseAdmin
    .from("school_banners")
    .select("id, image_url, display_order")
    .eq("school_id", schoolId)
    .order("display_order", { ascending: true });

  return (data ?? []).map((b) => ({ id: b.id, imageUrl: b.image_url, displayOrder: b.display_order }));
}

export async function addSchoolBanner(formData: FormData): Promise<SchoolBanner> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const file = formData.get("banner") as File | null;
  if (!file || file.size === 0) throw new Error("No file provided");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `banners/${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabaseAdmin.storage
    .from("school-logos")
    .upload(path, Buffer.from(arrayBuffer), { contentType: file.type, upsert: false });

  if (uploadError) throw new Error(`Failed to upload banner: ${uploadError.message}`);

  const { data: publicUrl } = supabaseAdmin.storage.from("school-logos").getPublicUrl(path);

  const { count } = await supabaseAdmin
    .from("school_banners")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId);

  const { data, error } = await supabaseAdmin
    .from("school_banners")
    .insert({ school_id: schoolId, image_url: publicUrl.publicUrl, display_order: count ?? 0 })
    .select("id, image_url, display_order")
    .single();

  if (error || !data) throw new Error(error?.message ?? "Failed to save banner");

  revalidatePath("/dashboard/settings");
  return { id: data.id, imageUrl: data.image_url, displayOrder: data.display_order };
}

export async function removeSchoolBanner(id: string): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { error } = await supabaseAdmin.from("school_banners").delete().eq("id", id).eq("school_id", schoolId);
  if (error) throw new Error(`Failed to remove banner: ${error.message}`);
  revalidatePath("/dashboard/settings");
}

export async function moveSchoolBanner(id: string, direction: "up" | "down"): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data: banners } = await supabaseAdmin
    .from("school_banners")
    .select("id, display_order")
    .eq("school_id", schoolId)
    .order("display_order", { ascending: true });

  const list = banners ?? [];
  const index = list.findIndex((b) => b.id === id);
  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapIndex < 0 || swapIndex >= list.length) return;

  const a = list[index];
  const b = list[swapIndex];

  await Promise.all([
    supabaseAdmin.from("school_banners").update({ display_order: b.display_order }).eq("id", a.id),
    supabaseAdmin.from("school_banners").update({ display_order: a.display_order }).eq("id", b.id),
  ]);

  revalidatePath("/dashboard/settings");
}
