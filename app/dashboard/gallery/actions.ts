"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";

export async function uploadGalleryImage(formData: FormData): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const file = formData.get("image") as File | null;
  if (!file || file.size === 0) throw new Error("No file provided");

  const caption = (formData.get("caption") as string | null)?.trim() || null;

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${schoolId}/${crypto.randomUUID()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabaseAdmin.storage
    .from("school-gallery")
    .upload(path, Buffer.from(arrayBuffer), { contentType: file.type, upsert: false });

  if (uploadError) throw new Error(`Failed to upload image: ${uploadError.message}`);

  const { data: publicUrl } = supabaseAdmin.storage.from("school-gallery").getPublicUrl(path);

  const { count } = await supabaseAdmin
    .from("school_gallery")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId);

  const { error: insertError } = await supabaseAdmin.from("school_gallery").insert({
    school_id: schoolId,
    image_url: publicUrl.publicUrl,
    caption,
    display_order: count ?? 0,
  });

  if (insertError) throw new Error(`Image uploaded, but failed to save: ${insertError.message}`);

  revalidatePath("/dashboard/gallery");
  revalidatePath("/dashboard/website");
}

export async function deleteGalleryImage(id: string, imageUrl: string): Promise<void> {
  const marker = "/school-gallery/";
  const idx = imageUrl.indexOf(marker);
  if (idx !== -1) {
    const path = imageUrl.slice(idx + marker.length);
    await supabaseAdmin.storage.from("school-gallery").remove([path]);
  }

  const { error } = await supabaseAdmin.from("school_gallery").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/gallery");
  revalidatePath("/dashboard/website");
}

export async function moveGalleryImage(id: string, direction: "up" | "down"): Promise<void> {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data: images } = await supabaseAdmin
    .from("school_gallery")
    .select("id, display_order")
    .eq("school_id", schoolId)
    .order("display_order", { ascending: true });

  if (!images) return;

  const idx = images.findIndex((img) => img.id === id);
  if (idx === -1) return;

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= images.length) return;

  const a = images[idx];
  const b = images[swapIdx];

  await Promise.all([
    supabaseAdmin.from("school_gallery").update({ display_order: b.display_order }).eq("id", a.id),
    supabaseAdmin.from("school_gallery").update({ display_order: a.display_order }).eq("id", b.id),
  ]);

  revalidatePath("/dashboard/gallery");
  revalidatePath("/dashboard/website");
}
