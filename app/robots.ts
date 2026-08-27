import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const DISALLOW = [
  "/dashboard",
  "/dashboard/",
  "/login",
  "/signup",
  "/onboarding",
  "/verify-phone",
  "/api/",
  "/auth/",
  "/s/",
];

// AI crawlers get the same open rule as everyone else — listed explicitly so
// it's clear this site intentionally welcomes AI search/answer engines
// (ChatGPT, Perplexity, Google AI Overviews, Claude) rather than leaving it
// to an implicit wildcard match.
const AI_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "PerplexityBot",
  "Perplexity-User",
  "ClaudeBot",
  "Claude-User",
  "anthropic-ai",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "Bytespider",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: DISALLOW },
      ...AI_USER_AGENTS.map((userAgent) => ({ userAgent, allow: "/", disallow: DISALLOW })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
