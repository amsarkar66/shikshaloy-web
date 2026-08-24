import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/dashboard/",
        "/login",
        "/signup",
        "/onboarding",
        "/verify-phone",
        "/api/",
        "/auth/",
        "/s/",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
