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
      <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        No search trend data was available for this category.
      </div>
    );
  }

  const directionText =
    trend.slopeScore > 55
      ? "steadily rising over the past year"
      : trend.slopeScore < 45
        ? "softening over the past year"
        : "holding steady over the past year";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">
          Search interest is {directionText}.
        </p>
        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
          Google search trends over the past 12 months show relative customer interest and demand trajectory.
        </p>
      </div>

      <div className="h-48 w-full rounded-xl border border-border bg-card p-3">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend.points} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              minTickGap={20}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              width={36}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [`${value}/100`, "Interest index"]}
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
              stroke="var(--foreground)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
