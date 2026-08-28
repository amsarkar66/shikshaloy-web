"use client";

import { BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

function trendDateLabel(date: string) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function trendDotHex(rate: number) {
  return rate >= 90 ? "#10b981" : rate >= 80 ? "#f59e0b" : "#ef4444";
}

function trendTickInterval(days: number) {
  return days <= 15 ? 0 : Math.ceil(days / 12) - 1;
}

const trendChartConfig: ChartConfig = {
  rate: { label: "Attendance Rate", color: "var(--primary)" },
};

function TrendChartTooltip({ active, payload }: { active?: boolean; payload?: readonly { payload?: unknown }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as { date: string; rate: number } | undefined;
  if (!point) return null;
  return (
    <div className="rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs shadow-lg">
      <p className="font-medium text-gray-900 dark:text-zinc-50">{trendDateLabel(point.date)}</p>
      <p className="text-gray-500 dark:text-zinc-400">{point.rate}% attendance</p>
    </div>
  );
}

// Recharts/shadcn bar chart — "no data" days are filtered out of the series
// rather than plotted as zero, so a day nothing was marked on leaves a gap
// instead of reading as "everybody absent".
export function TrendBarChart({ history, height = 180 }: { history: { date: string; rate: number | null }[]; height?: number }) {
  const data = history.filter((h): h is { date: string; rate: number } => h.rate !== null);
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-gray-400 dark:text-zinc-500">No attendance history yet</p>;
  }
  const tickInterval = trendTickInterval(history.length);

  return (
    <ChartContainer config={trendChartConfig} className="aspect-auto w-full" style={{ height }}>
      <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tickFormatter={trendDateLabel}
          tickLine={false}
          axisLine={false}
          interval={tickInterval}
          minTickGap={0}
          tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
          dy={6}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 50, 100]}
          tickFormatter={(v: number) => `${v}%`}
          tickLine={false}
          axisLine={false}
          width={30}
          tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
        />
        <Tooltip cursor={{ fill: "var(--muted)" }} content={TrendChartTooltip} />
        <Bar dataKey="rate" radius={[3, 3, 0, 0]} maxBarSize={24}>
          {data.map((d) => <Cell key={d.date} fill={trendDotHex(d.rate)} />)}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
