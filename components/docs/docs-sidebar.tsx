import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { DocRole } from "@/lib/docs/types";

export function DocsSidebar({ role, activeSlug }: { role: DocRole; activeSlug?: string }) {
  return (
    <nav className="lg:sticky lg:top-24">
      <Link
        href="/docs"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All roles
      </Link>
      <div className="mb-3 flex items-center gap-2.5">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${role.colorClass}`}>
          <role.icon className="h-4 w-4" />
        </div>
        <p className="text-sm font-bold text-zinc-900">{role.shortLabel}</p>
      </div>
      <ul className="space-y-0.5 border-l border-zinc-200">
        {role.articles.map((article) => {
          const active = article.slug === activeSlug;
          return (
            <li key={article.slug}>
              <Link
                href={`/docs/${role.slug}/${article.slug}`}
                className={`-ml-px block border-l-2 py-1.5 pl-3.5 text-sm transition-colors ${
                  active
                    ? "border-primary-600 font-semibold text-primary-700"
                    : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-900"
                }`}
              >
                {article.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
