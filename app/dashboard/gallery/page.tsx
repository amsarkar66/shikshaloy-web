import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import GalleryClient from "./_components/GalleryClient";
import type { GalleryImage } from "./_components/GalleryClient";

export default async function GalleryPage() {
  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data } = await supabaseAdmin
    .from("school_gallery")
    .select("id, image_url, caption, display_order")
    .eq("school_id", schoolId)
    .order("display_order", { ascending: true });

  const images: GalleryImage[] = (data ?? []).map((g) => ({
    id: g.id,
    imageUrl: g.image_url,
    caption: g.caption,
  }));

  return <GalleryClient initialData={images} />;
}
