import { BetaAnalyticsDataClient } from "@google-analytics/data";

// GA4 Data API (server-side reporting) — separate from the client-side
// gtag.js snippet (NEXT_PUBLIC_GA_MEASUREMENT_ID) that just tracks visitors.
// This reads that same property's data back out, via a service account with
// Viewer access (GA4 Admin → Property Access Management), not the
// measurement ID itself.
function getClient(): BetaAnalyticsDataClient | null {
  const email = process.env.GA4_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GA4_SERVICE_ACCOUNT_PRIVATE_KEY;
  if (!email || !key) return null;
  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: email,
      // .env files can't hold real newlines — the key is stored with
      // literal "\n" escapes and unescaped here.
      private_key: key.replace(/\\n/g, "\n"),
    },
  });
}

export interface WebsiteAnalytics {
  activeUsers: number;
  newUsers: number;
  sessions: number;
  pageViews: number;
  avgSessionDurationSec: number;
  bounceRate: number; // 0–1
  dailyUsers: { date: string; users: number }[];
  topPages: { path: string; views: number }[];
  trafficSources: { source: string; sessions: number }[];
}

function metricAt(row: { metricValues?: { value?: string | null }[] | null } | undefined, i: number): number {
  return Number(row?.metricValues?.[i]?.value ?? 0);
}

// Returns null when GA4 isn't configured (missing env vars) or the API call
// fails — callers show a "connect Google Analytics" prompt instead of
// crashing the page over a third-party outage or unset credentials.
export async function getWebsiteAnalytics(days = 30): Promise<WebsiteAnalytics | null> {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const client = getClient();
  if (!client || !propertyId) return null;

  const property = `properties/${propertyId}`;
  const dateRanges = [{ startDate: `${days}daysAgo`, endDate: "today" }];

  try {
    const [[summary], [topPagesReport], [sourcesReport], [dailyReport]] = await Promise.all([
      client.runReport({
        property,
        dateRanges,
        metrics: [
          { name: "activeUsers" },
          { name: "newUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
        ],
      }),
      client.runReport({
        property,
        dateRanges,
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 8,
      }),
      client.runReport({
        property,
        dateRanges,
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 6,
      }),
      client.runReport({
        property,
        dateRanges,
        dimensions: [{ name: "date" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
    ]);

    const row = summary.rows?.[0];

    return {
      activeUsers: metricAt(row, 0),
      newUsers: metricAt(row, 1),
      sessions: metricAt(row, 2),
      pageViews: metricAt(row, 3),
      avgSessionDurationSec: metricAt(row, 4),
      bounceRate: metricAt(row, 5),
      dailyUsers: (dailyReport.rows ?? []).map((r) => ({
        date: r.dimensionValues?.[0]?.value ?? "",
        users: Number(r.metricValues?.[0]?.value ?? 0),
      })),
      topPages: (topPagesReport.rows ?? []).map((r) => ({
        path: r.dimensionValues?.[0]?.value ?? "—",
        views: Number(r.metricValues?.[0]?.value ?? 0),
      })),
      trafficSources: (sourcesReport.rows ?? []).map((r) => ({
        source: r.dimensionValues?.[0]?.value ?? "—",
        sessions: Number(r.metricValues?.[0]?.value ?? 0),
      })),
    };
  } catch (err) {
    console.error("Failed to fetch GA4 analytics:", err);
    return null;
  }
}
