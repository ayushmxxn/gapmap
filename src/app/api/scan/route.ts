import { NextResponse } from "next/server";
import { z } from "zod";
import { SerpApiError, logSafeError } from "@/lib/serpapi";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";
import { executeScanPipeline } from "@/lib/services/scan-pipeline";
import { scanRequestSchema } from "@/types/scan";
import { siteUrl } from "@/lib/env";

// Blocks third-party websites from triggering scans and consuming search credits.
function isAllowedOrigin(req: Request): boolean {
  // Reject explicit cross-site browser requests
  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    return false;
  }

  const origin = req.headers.get("origin");
  if (origin) {
    try {
      const originHost = new URL(origin).host.toLowerCase();
      const reqHost = (
        req.headers.get("x-forwarded-host") ||
        req.headers.get("host") ||
        ""
      ).toLowerCase();

      let siteHost = "";
      try {
        siteHost = new URL(siteUrl).host.toLowerCase();
      } catch {
        // siteUrl fallback
      }

      if (originHost !== reqHost && originHost !== siteHost) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
}

export async function POST(req: Request) {
  try {
    // Enforcing JSON Content-Type blocks simple cross-origin form submissions without preflight.
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        {
          error: "Invalid Content-Type. Requests must specify application/json.",
          code: "UNSUPPORTED_MEDIA_TYPE",
        },
        { status: 415 },
      );
    }

    if (!isAllowedOrigin(req)) {
      return NextResponse.json(
        {
          error: "Cross-origin requests to the scan API are forbidden.",
          code: "FORBIDDEN",
        },
        { status: 403 },
      );
    }

    // Rate limit per client IP before triggering external SerpApi requests.
    const ip = extractClientIp(req);
    const rateLimit = checkRateLimit(ip);
    if (rateLimit.limited) {
      return NextResponse.json(
        {
          error: "Scan limit reached. Please try again later.",
          code: "RATE_LIMITED",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.resetSeconds),
          },
        },
      );
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body.", code: "INVALID_JSON" },
        { status: 400 },
      );
    }

    const parsedInput = scanRequestSchema.safeParse(rawBody);
    if (!parsedInput.success) {
      const firstIssue = parsedInput.error.issues[0];
      const message = firstIssue
        ? `${firstIssue.path.join(".") || "input"}: ${firstIssue.message}`
        : "Invalid scan parameters.";
      return NextResponse.json(
        { error: message, code: "VALIDATION_ERROR" },
        { status: 400 },
      );
    }

    try {
      const result = await executeScanPipeline(parsedInput.data);
      return NextResponse.json(result);
    } catch (err) {
      if (err instanceof SerpApiError) {
        logSafeError("Upstream SerpApi failure during scan", err);
        return NextResponse.json(
          { error: err.userMessage, code: err.code },
          { status: err.statusCode },
        );
      }
      if (err instanceof z.ZodError) {
        logSafeError("Scan result schema validation failed", err);
        return NextResponse.json(
          {
            error: "Internal error processing scan results.",
            code: "SCHEMA_VALIDATION_ERROR",
          },
          { status: 500 },
        );
      }
      logSafeError("Unhandled exception in scan pipeline", err);
      return NextResponse.json(
        {
          error: "An unexpected error occurred while processing the scan.",
          code: "INTERNAL_ERROR",
        },
        { status: 500 },
      );
    }
  } catch (err) {
    logSafeError("Fatal unhandled exception in /api/scan POST", err);
    return NextResponse.json(
      {
        error: "An unexpected error occurred while processing the scan.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}
