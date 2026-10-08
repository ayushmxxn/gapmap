"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ScanResult } from "@/lib/scoring";

interface TooltipPayloadItem {
  value?: number;
  payload?: { date: string; value: number };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-lg border border-border/70 bg-card px-2.5 py-1.5 shadow-xs text-xs">
      <p className="text-[11px] text-muted-foreground">{point.date}</p>
      <p className="font-semibold text-foreground mt-0.5">
        {point.value} <span className="font-normal text-muted-foreground text-[10px]">/ 100 index</span>
      </p>
    </div>
  );
}

function formatTickDate(dateStr: string): string {
  if (!dateStr) return "";
  if (dateStr.length <= 5) return dateStr;
  const monthMatch = dateStr.match(/^([A-Za-z]{3})/);
  const yearMatch = dateStr.match(/\b(20\d{2})\b/);
  if (monthMatch && yearMatch) {
    return `${monthMatch[1]} '${yearMatch[1].slice(-2)}`;
  }
  if (monthMatch) {
    return monthMatch[1];
  }
  return dateStr;
}

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

  const slopeLabel =
    trend.slopeScore > 55
      ? "Rising"
      : trend.slopeScore < 45
        ? "Softening"
        : "Steady";

  const latestPoint = trend.points[trend.points.length - 1];

  const values = trend.points.map((p) => p.value);
  const minVal = values.length ? Math.min(...values) : 0;
  const maxVal = values.length ? Math.max(...values) : 100;
  const spread = maxVal - minVal;
  // Pad the domain so the sparkline has visual headroom and doesn't clip against card boundaries.
  const padBottom = Math.max(4, Math.round(spread * 0.2));
  const padTop = Math.max(6, Math.round(spread * 0.25));
  const yMin = Math.max(0, minVal - padBottom);
  const yMax = Math.min(100, maxVal + padTop);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-normal text-muted-foreground leading-relaxed">
          {directionText}
        </p>

        {latestPoint && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
            <span>
              Latest: <strong className="font-semibold text-foreground">{latestPoint.value}</strong>/100
            </span>
            <span className="text-muted-foreground/30">•</span>
            <span>
              12-mo average: <strong className="font-medium text-foreground">{trend.avgLevel}</strong>/100
            </span>
            <span className="text-muted-foreground/30">•</span>
            <span>
              Direction: <strong className="font-medium text-foreground">{slopeLabel}</strong>
            </span>
          </div>
        )}
      </div>

      <div className="h-40 w-full rounded-xl border border-border/60 bg-card p-3 shadow-2xs">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={trend.points}
            margin={{ top: 10, right: 8, bottom: 2, left: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
              opacity={0.6}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatTickDate}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              minTickGap={28}
              interval="preserveStartEnd"
              axisLine={{ stroke: "var(--border)", opacity: 0.7 }}
              tickLine={false}
              dy={6}
            />
            <YAxis hide domain={[yMin, yMax]} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--foreground)"
              strokeWidth={2}
              fill="var(--foreground)"
              fillOpacity={0.035}
              activeDot={{
                r: 4,
                stroke: "var(--background)",
                strokeWidth: 2,
                fill: "var(--foreground)",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
