import { redirect } from "next/navigation";
import { getVerifiedUser } from "@/lib/auth/verified-role";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getSiteSettings, getInstitutionDomainSummary, getWebsiteActivity } from "@/lib/site-settings/actions";
import { listSchoolBanners } from "@/lib/schools/banner-actions";
import { WebsiteEditorShell } from "./_components/WebsiteEditorShell";
import type { GalleryImage } from "./_components/sections/GallerySection";

export default async function WebsitePage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { section } = await searchParams;
  const verifiedUser = await getVerifiedUser();

  if (!verifiedUser || verifiedUser.role !== "super_admin") redirect("/dashboard");

  const { draft, published, publishedAt } = await getSiteSettings();

  const schoolId = await getCurrentSchoolIdOrThrow();
  const { data: galleryRows } = await supabaseAdmin
    .from("school_gallery")
    .select("id, image_url, caption, display_order")
    .eq("school_id", schoolId)
    .order("display_order", { ascending: true });

  const galleryImages: GalleryImage[] = (galleryRows ?? []).map((g) => ({
    id: g.id,
    imageUrl: g.image_url,
    caption: g.caption,
  }));

  const banners = await listSchoolBanners();
  const [domain, activity] = await Promise.all([getInstitutionDomainSummary(), getWebsiteActivity()]);

  return (
    <WebsiteEditorShell
      initialDraft={draft}
      published={published}
      publishedAt={publishedAt}
      initialGalleryImages={galleryImages}
      initialBanners={banners}
      domain={domain}
      activity={activity}
      initialSection={section}
    />
  );
}
