import { DOC_ROLES } from "@/lib/docs/roles";

export interface DocSearchEntry {
  roleSlug: string;
  roleLabel: string;
  articleSlug: string;
  title: string;
  summary: string;
}

export function getDocSearchIndex(): DocSearchEntry[] {
  return DOC_ROLES.flatMap((role) =>
    role.articles.map((article) => ({
      roleSlug: role.slug,
      roleLabel: role.shortLabel,
      articleSlug: article.slug,
      title: article.title,
      summary: article.summary,
    }))
  );
}
