import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getPublicSiteSchools } from "@/lib/domains/public-site-data";
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

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header schools={schools} />
      <main className="flex-1">{children}</main>
      <Footer schools={schools} />
      <StickyApplyCta />
    </div>
  );
}
