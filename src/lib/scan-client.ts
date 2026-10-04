"use client";

import { scanResultSchema, type ScanResult } from "@/lib/scoring";

export interface ScanInput {
  lat: number;
  lng: number;
  categoryId: string;
  areaLabel: string;
  scope?: "city" | "neighborhood";
}

export async function postScan(input: ScanInput): Promise<ScanResult> {
  const res = await fetch("/api/scan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const msg =
      typeof json === "object" && json !== null && "error" in json
        ? String((json as { error: unknown }).error)
        : "Scan failed.";
    throw new Error(msg);
  }
  return scanResultSchema.parse(json);
}

export function scanUrl(input: ScanInput): string {
  const params = new URLSearchParams({
    lat: String(input.lat),
    lng: String(input.lng),
    cat: input.categoryId,
    area: input.areaLabel,
  });
  return `?${params.toString()}`;
}
