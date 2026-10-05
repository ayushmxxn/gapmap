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
  if (!trend || trend.points.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/70 p-4 text-xs text-muted-foreground">
        No search trend data was available for this category.
      </div>
    );
  }

  const directionText =
    trend.slopeScore > 55
      ? "Search interest has been steadily rising over the past year."
      : trend.slopeScore < 45
        ? "Search interest has been softening over the past year."
        : "Search interest has been holding steady over the past year.";

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-normal text-muted-foreground leading-relaxed">
        {directionText}
      </p>

      <div className="h-44 w-full rounded-xl border border-border/60 bg-card p-3 shadow-2xs">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend.points} margin={{ top: 6, right: 6, bottom: 0, left: -24 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              minTickGap={24}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              width={32}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [`${value}/100`, "Interest index"]}
              labelClassName="text-xs"
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "0 2px 8px -1px rgba(0, 0, 0, 0.08)",
                color: "var(--popover-foreground)",
                fontSize: 11,
                padding: "6px 10px",
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--foreground)"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
