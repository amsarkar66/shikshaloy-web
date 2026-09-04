import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Lightbulb } from "lucide-react";
import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { DOC_ROLES, getDocRole, getDocArticle } from "@/lib/docs/roles";
import { breadcrumbJsonLd, OG_IMAGE } from "@/lib/seo";

export function generateStaticParams() {
  return DOC_ROLES.flatMap((role) =>
    role.articles.map((article) => ({ role: role.slug, article: article.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ role: string; article: string }>;
}): Promise<Metadata> {
  const { role: roleSlug, article: articleSlug } = await params;
  const found = getDocArticle(roleSlug, articleSlug);
  if (!found) return {};

  const { role, article } = found;
  const title = `${article.title} — ${role.shortLabel} Docs`;
  const url = `/docs/${role.slug}/${article.slug}`;

  return {
    title,
    description: article.summary,
    alternates: { canonical: url },
    openGraph: { title, description: article.summary, url, images: [OG_IMAGE] },
  };
}

export default async function DocsArticlePage({
  params,
}: {
  params: Promise<{ role: string; article: string }>;
}) {
  const { role: roleSlug, article: articleSlug } = await params;
  const role = getDocRole(roleSlug);
  const found = getDocArticle(roleSlug, articleSlug);
  if (!role || !found) notFound();

  const { article } = found;
  const index = role.articles.findIndex((a) => a.slug === articleSlug);
  const prev = index > 0 ? role.articles[index - 1] : undefined;
  const next = index < role.articles.length - 1 ? role.articles[index + 1] : undefined;

  const breadcrumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Docs", path: "/docs" },
    { name: role.shortLabel, path: `/docs/${role.slug}` },
    { name: article.title, path: `/docs/${role.slug}/${article.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      <section className="pt-32 pb-24 sm:pb-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
            <aside className="lg:h-0">
              <DocsSidebar role={role} activeSlug={article.slug} />
            </aside>

            <div className="min-w-0 max-w-2xl">
              <Link
                href={`/docs/${role.slug}`}
                className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-800 lg:hidden"
              >
                <ArrowLeft className="h-4 w-4" /> {role.shortLabel} guides
              </Link>

              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
                {article.title}
              </h1>
              <p className="mt-3 text-base text-zinc-500">{article.summary}</p>

              <div className="mt-10 space-y-8">
                {article.steps.map((step, i) => (
                  <div key={step.heading} className="flex gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-bold text-primary-700 ring-1 ring-primary-200">
                      {i + 1}
                    </div>
                    <div className="min-w-0 pt-0.5">
                      <h2 className="text-base font-bold text-zinc-900">{step.heading}</h2>
                      <div className="mt-2 space-y-2.5">
                        {step.body.map((p, j) => (
                          <p key={j} className="text-sm leading-relaxed text-zinc-600">
                            {p}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {article.tips && article.tips.length > 0 && (
                <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-semibold text-amber-900">Good to know</p>
                  </div>
                  <ul className="mt-2.5 space-y-1.5">
                    {article.tips.map((tip, i) => (
                      <li key={i} className="text-sm leading-relaxed text-amber-800">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-12 grid grid-cols-1 gap-3 border-t border-zinc-200 pt-8 sm:grid-cols-2">
                {prev ? (
                  <Link
                    href={`/docs/${role.slug}/${prev.slug}`}
                    className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-primary-300"
                  >
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400">
                      <ArrowLeft className="h-3 w-3" /> Previous
                    </span>
                    <span className="mt-1 text-sm font-semibold text-zinc-900">{prev.title}</span>
                  </Link>
                ) : (
                  <div />
                )}
                {next && (
                  <Link
                    href={`/docs/${role.slug}/${next.slug}`}
                    className="group flex flex-col items-end rounded-xl border border-zinc-200 bg-white p-4 text-right transition-colors hover:border-primary-300"
                  >
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-zinc-400">
                      Next <ArrowRight className="h-3 w-3" />
                    </span>
                    <span className="mt-1 text-sm font-semibold text-zinc-900">{next.title}</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
