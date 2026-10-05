import { NextResponse } from "next/server";
import { z } from "zod";
import { SerpApiError, logSafeError } from "@/lib/serpapi";
import { checkRateLimit, extractClientIp } from "@/lib/rate-limit";
import { executeScanPipeline } from "@/lib/services/scan-pipeline";

const inputSchema = z.object({
  lat: z
    .number()
    .finite("Latitude must be a valid number")
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  lng: z
    .number()
    .finite("Longitude must be a valid number")
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  categoryId: z
    .string()
    .trim()
    .min(1, "Category cannot be empty")
    .max(50, "Category exceeds maximum length")
    .regex(/^[a-zA-Z0-9\s\-_'&.]+$/, "Category contains invalid characters"),
  areaLabel: z
    .string()
    .trim()
    .min(1, "Location label cannot be empty")
    .max(150, "Location label exceeds maximum length"),
  scope: z.enum(["city", "neighborhood"]).optional(),
});

export async function POST(req: Request) {
  try {
    // 1. IP Rate Limiting with safe proxy detection
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

    // 2. Strict Input Validation
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body.", code: "INVALID_JSON" },
        { status: 400 },
      );
    }

    const parsedInput = inputSchema.safeParse(rawBody);
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

    // 3. Delegate to Domain Pipeline Service
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
