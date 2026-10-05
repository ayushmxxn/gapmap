import { describe, expect, it } from "vitest";
import { scanRequestSchema, type ScanInput } from "@/types/scan";

describe("Scan Contract: scanRequestSchema Validation", () => {
  const validPayload: ScanInput = {
    lat: 12.9352,
    lng: 77.6245,
    categoryId: "cafe",
    areaLabel: "Koramangala, Bengaluru",
    scope: "neighborhood",
  };

  it("parses valid payload successfully", () => {
    const result = scanRequestSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lat).toBe(12.9352);
      expect(result.data.lng).toBe(77.6245);
      expect(result.data.categoryId).toBe("cafe");
      expect(result.data.areaLabel).toBe("Koramangala, Bengaluru");
      expect(result.data.scope).toBe("neighborhood");
    }
  });

  it("allows omitting optional scope", () => {
    const withoutScope: ScanInput = {
      lat: validPayload.lat,
      lng: validPayload.lng,
      categoryId: validPayload.categoryId,
      areaLabel: validPayload.areaLabel,
    };
    const result = scanRequestSchema.safeParse(withoutScope);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.scope).toBeUndefined();
    }
  });

  it("validates latitude boundaries (-90 to 90 and finite)", () => {
    expect(scanRequestSchema.safeParse({ ...validPayload, lat: -90 }).success).toBe(true);
    expect(scanRequestSchema.safeParse({ ...validPayload, lat: 90 }).success).toBe(true);
    expect(scanRequestSchema.safeParse({ ...validPayload, lat: -90.01 }).success).toBe(false);
    expect(scanRequestSchema.safeParse({ ...validPayload, lat: 90.01 }).success).toBe(false);
    expect(scanRequestSchema.safeParse({ ...validPayload, lat: Number.NaN }).success).toBe(false);
    expect(scanRequestSchema.safeParse({ ...validPayload, lat: Number.POSITIVE_INFINITY }).success).toBe(false);
  });

  it("validates longitude boundaries (-180 to 180 and finite)", () => {
    expect(scanRequestSchema.safeParse({ ...validPayload, lng: -180 }).success).toBe(true);
    expect(scanRequestSchema.safeParse({ ...validPayload, lng: 180 }).success).toBe(true);
    expect(scanRequestSchema.safeParse({ ...validPayload, lng: -180.01 }).success).toBe(false);
    expect(scanRequestSchema.safeParse({ ...validPayload, lng: 180.01 }).success).toBe(false);
    expect(scanRequestSchema.safeParse({ ...validPayload, lng: Number.NaN }).success).toBe(false);
  });

  it("validates category format, length, and characters", () => {
    // Valid categories
    expect(scanRequestSchema.safeParse({ ...validPayload, categoryId: "pet_grooming" }).success).toBe(true);
    expect(scanRequestSchema.safeParse({ ...validPayload, categoryId: "women's salon" }).success).toBe(true);
    expect(scanRequestSchema.safeParse({ ...validPayload, categoryId: "coffee & tea" }).success).toBe(true);
    expect(scanRequestSchema.safeParse({ ...validPayload, categoryId: "dr. dental" }).success).toBe(true);

    // Invalid categories
    expect(scanRequestSchema.safeParse({ ...validPayload, categoryId: "" }).success).toBe(false);
    expect(scanRequestSchema.safeParse({ ...validPayload, categoryId: "   " }).success).toBe(false);
    expect(scanRequestSchema.safeParse({ ...validPayload, categoryId: "a".repeat(51) }).success).toBe(false);
    expect(scanRequestSchema.safeParse({ ...validPayload, categoryId: "cafe<script>" }).success).toBe(false);
    expect(scanRequestSchema.safeParse({ ...validPayload, categoryId: "cafe; DROP TABLE" }).success).toBe(false);
  });

  it("validates area label trimming and length", () => {
    const trimmedResult = scanRequestSchema.safeParse({
      ...validPayload,
      areaLabel: "  Indiranagar, Bengaluru  ",
    });
    expect(trimmedResult.success).toBe(true);
    if (trimmedResult.success) {
      expect(trimmedResult.data.areaLabel).toBe("Indiranagar, Bengaluru");
    }

    expect(scanRequestSchema.safeParse({ ...validPayload, areaLabel: "" }).success).toBe(false);
    expect(scanRequestSchema.safeParse({ ...validPayload, areaLabel: "   " }).success).toBe(false);
    expect(scanRequestSchema.safeParse({ ...validPayload, areaLabel: "x".repeat(151) }).success).toBe(false);
  });

  it("validates scope enum values", () => {
    expect(scanRequestSchema.safeParse({ ...validPayload, scope: "city" }).success).toBe(true);
    expect(scanRequestSchema.safeParse({ ...validPayload, scope: "neighborhood" }).success).toBe(true);
    // Invalid scope
    expect(scanRequestSchema.safeParse({ ...validPayload, scope: "country" as unknown as "city" }).success).toBe(false);
  });
});
