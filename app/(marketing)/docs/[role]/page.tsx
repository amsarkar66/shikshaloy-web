import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";
import { DOC_ROLES, getDocRole } from "@/lib/docs/roles";
import { breadcrumbJsonLd, OG_IMAGE } from "@/lib/seo";

export function generateStaticParams() {
  return DOC_ROLES.map((role) => ({ role: role.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ role: string }>;
}): Promise<Metadata> {
  const { role: roleSlug } = await params;
  const role = getDocRole(roleSlug);
  if (!role) return {};

  const title = `${role.label} Documentation`;
  const description = `${role.description} Step-by-step guides for every ${role.shortLabel.toLowerCase()} feature in Shikshaloy.`;
  const url = `/docs/${role.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: [OG_IMAGE] },
  };
}

export default async function DocsRolePage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role: roleSlug } = await params;
  const role = getDocRole(roleSlug);
  if (!role) notFound();

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Docs", path: "/docs" },
    { name: role.shortLabel, path: `/docs/${role.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <section className="pt-32 pb-16 sm:pb-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/docs"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-800"
          >
            <ArrowLeft className="h-4 w-4" /> All roles
          </Link>

          <FadeIn>
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${role.colorClass}`}>
              <role.icon className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              {role.label}
            </h1>
            <p className="mt-3 max-w-xl text-base text-zinc-500">{role.description}</p>
          </FadeIn>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {role.articles.map((article, i) => (
              <FadeIn key={article.slug} delay={i * 0.03}>
                <Link
                  href={`/docs/${role.slug}/${article.slug}`}
                  className="group flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md hover:shadow-zinc-200/50"
                >
                  <p className="text-sm font-semibold text-zinc-900">{article.title}</p>
                  <p className="mt-1 flex-1 text-xs leading-relaxed text-zinc-500">{article.summary}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary-600">
                    Read guide <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
