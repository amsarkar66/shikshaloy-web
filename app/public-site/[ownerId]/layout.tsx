import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import { getPublicSiteSchools } from "@/lib/domains/public-site-data";
import { getDraftSiteSettings, getPublishedSiteSettings } from "@/lib/site-settings/public";
import { Header } from "../_components/Header";
import { Footer } from "../_components/Footer";
import { StickyApplyCta } from "../_components/StickyApplyCta";

export default async function PublicSiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ ownerId: string }>;
}) {
  const { ownerId } = await params;

  const schools = await getPublicSiteSchools(ownerId);
  if (schools.length === 0) notFound();

  const { isEnabled: isPreview } = await draftMode();
  const settings = isPreview ? await getDraftSiteSettings(ownerId) : await getPublishedSiteSettings(ownerId);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {isPreview && (
        <div className="sticky top-0 z-40 bg-amber-400 px-4 py-1.5 text-center text-xs font-semibold text-amber-950">
          Draft preview — these changes are not published yet
        </div>
      )}
      <Header schools={schools} settings={settings} />
      <main className="flex-1">{children}</main>
      <Footer schools={schools} settings={settings} />
      <StickyApplyCta />
    </div>
  );
}
