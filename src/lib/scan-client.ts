"use client";

import { scanResultSchema, type ScanResult } from "@/lib/scoring";

export interface ScanInput {
  lat: number;
  lng: number;
  categoryId: string;
  areaLabel: string;
  scope?: "city" | "neighborhood";
}

export class ScanClientError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;

  constructor(message: string, code = "UNKNOWN_ERROR", statusCode?: number) {
    super(message);
    this.name = "ScanClientError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

const CLIENT_TIMEOUT_MS = 25000;

export async function postScan(input: ScanInput): Promise<ScanResult> {
  let res: Response;
  try {
    res = await fetch("/api/scan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      throw new ScanClientError(
        "The scan took longer than expected while analyzing data. Please try again.",
        "CLIENT_TIMEOUT",
        408,
      );
    }
    if (err instanceof TypeError || (err instanceof Error && err.message.includes("fetch"))) {
      throw new ScanClientError(
        "Unable to connect to the GapMap service. Please check your internet connection.",
        "NETWORK_ERROR",
      );
    }
    throw new ScanClientError(
      "An unexpected connection error occurred. Please try again.",
      "FETCH_FAILED",
    );
  }

  const json: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    let message = "Scan could not be completed. Please try again.";
    let code = "API_ERROR";

    if (typeof json === "object" && json !== null) {
      const record = json as Record<string, unknown>;
      if (typeof record.error === "string" && record.error.trim().length > 0) {
        message = record.error.trim();
      }
      if (typeof record.code === "string") {
        code = record.code;
      }
    } else {
      if (res.status === 429) {
        message = "Scan limit reached. Please wait a moment before trying again.";
        code = "RATE_LIMITED";
      } else if (res.status === 504) {
        message = "The scan timed out while searching external providers. Please try again.";
        code = "UPSTREAM_TIMEOUT";
      } else if (res.status === 502) {
        message = "External search provider is temporarily unavailable. Please try again shortly.";
        code = "UPSTREAM_ERROR";
      }
    }

    throw new ScanClientError(message, code, res.status);
  }

  const parsed = scanResultSchema.safeParse(json);
  if (!parsed.success) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[GapMap] ScanResult schema validation error:", parsed.error);
    }
    throw new ScanClientError(
      "Received incomplete scan results. Please try again.",
      "INVALID_DATA_SHAPE",
      500,
    );
  }

  return parsed.data;
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
