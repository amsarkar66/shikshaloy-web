import type { Metadata } from "next";
import { FadeIn } from "@/components/ui/fade-in";
import { ChangelogTerminal } from "@/components/marketing/changelog-terminal";
import { breadcrumbJsonLd, OG_IMAGE } from "@/lib/seo";
import { RELEASES } from "@/lib/changelog";

const title = "Changelog";
const description =
  "Everything shipped in Shikshaloy — new modules, improvements, and fixes, in one running log.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/changelog" },
  openGraph: { title, description, url: "/changelog", images: [OG_IMAGE] },
};

const breadcrumbs = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Changelog", path: "/changelog" },
]);

export default function ChangelogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <section className="relative overflow-hidden pt-40 pb-20 sm:pb-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-10%] left-1/2 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-primary-200/40 blur-3xl" />
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.5] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_40%,transparent_100%)]"
          style={{
            backgroundImage: "radial-gradient(circle,#d4d4d8 1px,transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <FadeIn>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary-600">
              Changelog
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-balance text-zinc-900 sm:text-5xl">
              What&apos;s new in Shikshaloy
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-balance text-zinc-500">
              Every module we ship, every bug we squash — logged here as it happens.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <ChangelogTerminal releases={RELEASES} />
        </div>
      </section>
    </>
  );
}
