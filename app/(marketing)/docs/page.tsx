import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LifeBuoy } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";
import { DocsSearch } from "@/components/docs/docs-search";
import { DOC_ROLES } from "@/lib/docs/roles";
import { getDocSearchIndex } from "@/lib/docs/search";
import { breadcrumbJsonLd, OG_IMAGE } from "@/lib/seo";

const title = "Documentation";
const description =
  "Step-by-step guides for every Shikshaloy role — institution owners, principals, teachers, parents, students, drivers, and support staff.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/docs" },
  openGraph: { title, description, url: "/docs", images: [OG_IMAGE] },
};

const breadcrumbs = breadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Docs", path: "/docs" },
]);

export default function DocsPage() {
  const searchIndex = getDocSearchIndex();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <section className="relative overflow-hidden pt-40 pb-16 sm:pb-20">
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
              Documentation
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-balance text-zinc-900 sm:text-5xl">
              How to use Shikshaloy
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-balance text-zinc-500">
              Pick your role below for step-by-step guides to every part of the platform.
            </p>
          </FadeIn>
          <FadeIn delay={0.1} className="mt-8">
            <DocsSearch index={searchIndex} />
          </FadeIn>
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {DOC_ROLES.map((role, i) => (
              <FadeIn key={role.slug} delay={i * 0.05}>
                <Link
                  href={`/docs/${role.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg hover:shadow-zinc-200/50"
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${role.colorClass}`}>
                    <role.icon className="h-5.5 w-5.5" />
                  </div>
                  <h2 className="mt-4 text-base font-bold text-zinc-900">{role.label}</h2>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-zinc-500">{role.description}</p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-primary-600">
                    {role.articles.length} guide{role.articles.length === 1 ? "" : "s"}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
            <LifeBuoy className="h-7 w-7 text-primary-500" />
            <p className="text-base font-semibold text-zinc-900">Can&apos;t find what you&apos;re looking for?</p>
            <p className="max-w-md text-sm text-zinc-500">
              Reach out to our support team and we&apos;ll help you out directly.
            </p>
            <Link
              href="/contact"
              className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              Contact Support <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
