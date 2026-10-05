import { describe, expect, it } from "vitest";
import {
  findMatchingPreset,
  parseSearchQuery,
  resolveLocation,
} from "@/lib/search-parser";

describe("Search Parser: Realistic Queries", () => {
  it('parses "Cafe in Koramangala" with preposition pattern', () => {
    const result = parseSearchQuery("Cafe in Koramangala");
    expect(result.businessText.toLowerCase()).toBe("cafe");
    expect(result.locationText.toLowerCase()).toBe("koramangala");
  });

  it('parses "Bakery Bandra West" using known business prefix without prepositions', () => {
    const result = parseSearchQuery("Bakery Bandra West");
    expect(result.businessText.toLowerCase()).toBe("bakery");
    expect(result.locationText.toLowerCase()).toBe("bandra west");
  });

  it('parses "gym delhi" two-word fallback', () => {
    const result = parseSearchQuery("gym delhi");
    expect(result.businessText.toLowerCase()).toBe("gym");
    expect(result.locationText.toLowerCase()).toBe("delhi");
  });

  it('parses comma-separated query "Cafe, Indiranagar"', () => {
    const result = parseSearchQuery("Cafe, Indiranagar");
    expect(result.businessText.toLowerCase()).toBe("cafe");
    expect(result.locationText.toLowerCase()).toBe("indiranagar");
  });
});

describe("Search Parser: Custom & Multi-word Business Types", () => {
  it('parses multi-word prefix with location: "EV charging station near Connaught Place"', () => {
    const result = parseSearchQuery("EV charging station near Connaught Place");
    expect(result.businessText.toLowerCase()).toBe("ev charging station");
    expect(result.locationText.toLowerCase()).toBe("connaught place");
  });

  it('parses multi-word prefix without preposition: "Pet grooming Hauz Khas"', () => {
    const result = parseSearchQuery("Pet grooming Hauz Khas");
    expect(result.businessText.toLowerCase()).toBe("pet grooming");
    expect(result.locationText.toLowerCase()).toBe("hauz khas");
  });

  it('parses unlisted multi-word business query with preposition: "Specialty coffee roasters in Indiranagar"', () => {
    const result = parseSearchQuery("Specialty coffee roasters in Indiranagar");
    expect(result.businessText.toLowerCase()).toBe("specialty coffee roasters");
    expect(result.locationText.toLowerCase()).toBe("indiranagar");
  });

  it('parses business containing "in": "Walk in clinic in Hauz Khas"', () => {
    const result = parseSearchQuery("Walk in clinic in Hauz Khas");
    expect(result.businessText.toLowerCase()).toBe("walk in clinic");
    expect(result.locationText.toLowerCase()).toBe("hauz khas");
  });
});

describe("Search Parser: Missing & Ambiguous Locations", () => {
  it("handles empty or whitespace-only queries", () => {
    expect(parseSearchQuery("")).toEqual({
      businessText: "",
      locationText: "",
    });
    expect(parseSearchQuery("   ")).toEqual({
      businessText: "",
      locationText: "",
    });
  });

  it("handles standalone category with missing location: \"Cafe\"", () => {
    const result = parseSearchQuery("Cafe");
    expect(result.businessText.toLowerCase()).toBe("cafe");
    expect(result.locationText).toBe("");
  });

  it("handles query ending in preposition: \"Bakery near\"", () => {
    const result = parseSearchQuery("Bakery near");
    expect(result.businessText.toLowerCase()).toBe("bakery");
    expect(result.locationText).toBe("");
  });

  it("handles location-only query starting with preposition: \"in Koramangala\"", () => {
    const result = parseSearchQuery("in Koramangala");
    expect(result.businessText).toBe("");
    expect(result.locationText.toLowerCase()).toBe("koramangala");
  });

  it("handles custom unlisted business with no location: \"Artisan ceramic pottery\"", () => {
    const result = parseSearchQuery("Artisan ceramic pottery");
    expect(result.businessText.toLowerCase()).toBe("artisan ceramic pottery");
    expect(result.locationText).toBe("");
  });
});

describe("Search Parser: findMatchingPreset & resolveLocation", () => {
  it("matches known preset by city or neighborhood name", () => {
    const koramangala = findMatchingPreset("Koramangala");
    expect(koramangala).not.toBeNull();
    expect(koramangala?.id).toBe("koramangala");

    const delhi = findMatchingPreset("Delhi");
    expect(delhi).not.toBeNull();
    expect(delhi?.id).toBe("delhi");
  });

  it("returns null for unknown locations in preset matcher", () => {
    expect(findMatchingPreset("UnknownFictionalCity999")).toBeNull();
    expect(findMatchingPreset("")).toBeNull();
  });

  it("resolves location coordinates and scope for known presets", async () => {
    const resolved = await resolveLocation("Koramangala, Bengaluru");
    expect(resolved).not.toBeNull();
    expect(resolved?.lat).toBeCloseTo(12.9352, 2);
    expect(resolved?.lng).toBeCloseTo(77.6245, 2);
    expect(resolved?.scope).toBe("neighborhood");

    const cityResolved = await resolveLocation("Gwalior");
    expect(cityResolved).not.toBeNull();
    expect(cityResolved?.lat).toBeCloseTo(26.2183, 2);
    expect(cityResolved?.scope).toBe("city");
  });

  it("returns null when resolving empty location", async () => {
    const resolved = await resolveLocation("");
    expect(resolved).toBeNull();
  });
});
