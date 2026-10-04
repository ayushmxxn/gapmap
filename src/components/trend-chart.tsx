"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ScanResult } from "@/lib/scoring";

export function TrendChart({ trend }: { trend: ScanResult["trend"] }) {
  if (!trend) {
    return (
      <section className="rounded-xl border border-dashed border-border p-5">
        <h2 className="font-semibold">Search interest</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No trend data was returned for this scan. The Gap Signal above was
          computed from Maps and review evidence only.
        </p>
      </section>
    );
  }
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-semibold">Search interest</h2>
        <p className="rounded-full bg-muted px-3 py-1 font-mono text-xs text-muted-foreground">
          {trend.scopeLabel} · {trend.evidence}
        </p>
      </div>
      <div className="mt-4 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend.points}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              minTickGap={24}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              width={32}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [`${value}/100`, "Interest"]}
              labelClassName="text-xs"
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                color: "var(--popover-foreground)",
                fontSize: 12,
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--primary)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Avg {trend.avgLevel}/100 · momentum {trend.slopeScore}/100 · relative
        interest, not absolute searches.
      </p>
    </section>
  );
}
