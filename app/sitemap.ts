import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { DOC_ROLES } from "@/lib/docs/roles";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/features", priority: 0.9, changeFrequency: "weekly" },
    { path: "/pricing", priority: 0.9, changeFrequency: "weekly" },
    { path: "/demo", priority: 0.8, changeFrequency: "monthly" },
    { path: "/docs", priority: 0.7, changeFrequency: "monthly" },
    { path: "/changelog", priority: 0.5, changeFrequency: "weekly" },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/account-deletion", priority: 0.2, changeFrequency: "yearly" },
    ...DOC_ROLES.flatMap((role) => [
      { path: `/docs/${role.slug}`, priority: 0.6, changeFrequency: "monthly" as const },
      ...role.articles.map((article) => ({
        path: `/docs/${role.slug}/${article.slug}`,
        priority: 0.5,
        changeFrequency: "monthly" as const,
      })),
    ]),
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
