import { describe, expect, it } from "vitest";
import { resolveCategory } from "@/lib/categories";
import {
  extractCategoryTokens,
  filterRelevantThemes,
  isRelevantTheme,
  isUniversalCustomerExperienceTheme,
} from "@/lib/theme-filter";

describe("Theme Filter: Universal Customer Experience", () => {
  it("recognizes universal customer experience and operational feedback terms", () => {
    expect(isUniversalCustomerExperienceTheme("service")).toBe(true);
    expect(isUniversalCustomerExperienceTheme("customer service")).toBe(true);
    expect(isUniversalCustomerExperienceTheme("wait time")).toBe(true);
    expect(isUniversalCustomerExperienceTheme("queue")).toBe(true);
    expect(isUniversalCustomerExperienceTheme("pricing")).toBe(true);
    expect(isUniversalCustomerExperienceTheme("membership")).toBe(true);
    expect(isUniversalCustomerExperienceTheme("staff")).toBe(true);
    expect(isUniversalCustomerExperienceTheme("behavior")).toBe(true);
    expect(isUniversalCustomerExperienceTheme("cleanliness")).toBe(true);
    expect(isUniversalCustomerExperienceTheme("hygiene")).toBe(true);
    expect(isUniversalCustomerExperienceTheme("washroom")).toBe(true);
    expect(isUniversalCustomerExperienceTheme("parking")).toBe(true);
    expect(isUniversalCustomerExperienceTheme("car parking")).toBe(true);
    expect(isUniversalCustomerExperienceTheme("crowd")).toBe(true);
    expect(isUniversalCustomerExperienceTheme("peak hours crowd")).toBe(true);
    expect(isUniversalCustomerExperienceTheme("ambience")).toBe(true);
    expect(isUniversalCustomerExperienceTheme("lighting")).toBe(true);
    expect(isUniversalCustomerExperienceTheme("booking")).toBe(true);
    expect(isUniversalCustomerExperienceTheme("equipment & maintenance")).toBe(true);
    expect(isUniversalCustomerExperienceTheme("trainer quality")).toBe(true);
  });

  it("does not classify non-business recreational activities or park amenities as universal CX", () => {
    expect(isUniversalCustomerExperienceTheme("jogging")).toBe(false);
    expect(isUniversalCustomerExperienceTheme("garden")).toBe(false);
    expect(isUniversalCustomerExperienceTheme("morning walk")).toBe(false);
    expect(isUniversalCustomerExperienceTheme("evening walk")).toBe(false);
    expect(isUniversalCustomerExperienceTheme("functions")).toBe(false);
    expect(isUniversalCustomerExperienceTheme("cricket")).toBe(false);
    expect(isUniversalCustomerExperienceTheme("lawn tennis")).toBe(false);
  });
});

describe("Theme Filter: Disallowing Broad Ambiguous Matches (light, bar, pass, game)", () => {
  const badmintonCategory = resolveCategory("badminton");
  const gymCategory = resolveCategory("gym");
  const cafeCategory = resolveCategory("cafe");
  const carWashCategory = resolveCategory("car wash");

  it("rejects bare 'light', 'bar', 'pass', and 'game' as standalone review themes", () => {
    // Badminton
    expect(isRelevantTheme("light", badmintonCategory)).toBe(false);
    expect(isRelevantTheme("bar", badmintonCategory)).toBe(false);
    expect(isRelevantTheme("pass", badmintonCategory)).toBe(false);
    expect(isRelevantTheme("game", badmintonCategory)).toBe(false);

    // Gym
    expect(isRelevantTheme("light", gymCategory)).toBe(false);
    expect(isRelevantTheme("bar", gymCategory)).toBe(false);
    expect(isRelevantTheme("pass", gymCategory)).toBe(false);
    expect(isRelevantTheme("game", gymCategory)).toBe(false);

    // Cafe
    expect(isRelevantTheme("light", cafeCategory)).toBe(false);
    expect(isRelevantTheme("bar", cafeCategory)).toBe(false);
    expect(isRelevantTheme("pass", cafeCategory)).toBe(false);
    expect(isRelevantTheme("game", cafeCategory)).toBe(false);

    // Car wash
    expect(isRelevantTheme("light", carWashCategory)).toBe(false);
    expect(isRelevantTheme("bar", carWashCategory)).toBe(false);
    expect(isRelevantTheme("pass", carWashCategory)).toBe(false);
    expect(isRelevantTheme("game", carWashCategory)).toBe(false);
  });

  it("rejects other vague bare single words on their own", () => {
    expect(isRelevantTheme("area", badmintonCategory)).toBe(false);
    expect(isRelevantTheme("room", badmintonCategory)).toBe(false);
    expect(isRelevantTheme("space", badmintonCategory)).toBe(false);
    expect(isRelevantTheme("card", badmintonCategory)).toBe(false);
    expect(isRelevantTheme("desk", badmintonCategory)).toBe(false);
    expect(isRelevantTheme("club", badmintonCategory)).toBe(false);
  });

  it("allows specific, meaningful phrases containing those concepts", () => {
    // Meaningful lighting phrases
    expect(isRelevantTheme("lighting", badmintonCategory)).toBe(true);
    expect(isRelevantTheme("court lighting", badmintonCategory)).toBe(true);
    expect(isRelevantTheme("indoor lighting", badmintonCategory)).toBe(true);

    // Meaningful pass phrases
    expect(isRelevantTheme("day pass", gymCategory)).toBe(true);
    expect(isRelevantTheme("guest pass", gymCategory)).toBe(true);

    // Meaningful operational area/room phrases
    expect(isRelevantTheme("waiting area", carWashCategory)).toBe(true);
    expect(isRelevantTheme("locker room", gymCategory)).toBe(true);
    expect(isRelevantTheme("front desk", gymCategory)).toBe(true);
  });
});

describe("Theme Filter: Category-Aware Filtering (Badminton Regression)", () => {
  const badmintonCategory = resolveCategory("badminton");

  it("extracts meaningful category tokens without broad stopwords", () => {
    const tokens = extractCategoryTokens(badmintonCategory);
    expect(tokens).toContain("badminton");
    expect(tokens).not.toContain("club");
    expect(tokens).not.toContain("bar");
    expect(tokens).not.toContain("game");
  });

  it("filters out unrelated topics from multi-facility clubs (e.g. Jiwaji Club)", () => {
    // Unrelated activities and amenities surfaced in multi-purpose venues
    expect(isRelevantTheme("jogging", badmintonCategory)).toBe(false);
    expect(isRelevantTheme("garden", badmintonCategory)).toBe(false);
    expect(isRelevantTheme("morning walk", badmintonCategory)).toBe(false);
    expect(isRelevantTheme("evening walk", badmintonCategory)).toBe(false);
    expect(isRelevantTheme("functions", badmintonCategory)).toBe(false);
    expect(isRelevantTheme("wedding", badmintonCategory)).toBe(false);
    expect(isRelevantTheme("banquet", badmintonCategory)).toBe(false);
    expect(isRelevantTheme("cricket", badmintonCategory)).toBe(false);
    expect(isRelevantTheme("lawn tennis", badmintonCategory)).toBe(false);
    expect(isRelevantTheme("swimming pool", badmintonCategory)).toBe(false);
    expect(isRelevantTheme("pool", badmintonCategory)).toBe(false);
    expect(isRelevantTheme("table tennis", badmintonCategory)).toBe(false);
    expect(isRelevantTheme("snooker", badmintonCategory)).toBe(false);
  });

  it("retains category-specific offerings and customer experience themes for badminton", () => {
    expect(isRelevantTheme("badminton", badmintonCategory)).toBe(true);
    expect(isRelevantTheme("badminton court", badmintonCategory)).toBe(true);
    expect(isRelevantTheme("synthetic court", badmintonCategory)).toBe(true);
    expect(isRelevantTheme("wooden court", badmintonCategory)).toBe(true);
    expect(isRelevantTheme("court", badmintonCategory)).toBe(true);
    expect(isRelevantTheme("shuttlecock", badmintonCategory)).toBe(true);
    expect(isRelevantTheme("shuttle", badmintonCategory)).toBe(true);
    expect(isRelevantTheme("racket", badmintonCategory)).toBe(true);
    expect(isRelevantTheme("grip", badmintonCategory)).toBe(true);
    expect(isRelevantTheme("stringing", badmintonCategory)).toBe(true);
    expect(isRelevantTheme("coaching", badmintonCategory)).toBe(true);
    expect(isRelevantTheme("lighting", badmintonCategory)).toBe(true);
    expect(isRelevantTheme("fees", badmintonCategory)).toBe(true);
    expect(isRelevantTheme("cleanliness", badmintonCategory)).toBe(true);
    expect(isRelevantTheme("parking", badmintonCategory)).toBe(true);
    expect(isRelevantTheme("membership", badmintonCategory)).toBe(true);
    expect(isRelevantTheme("tournament", badmintonCategory)).toBe(true);
  });

  it("filters a full list of raw topics correctly", () => {
    const rawThemes = [
      { keyword: "jogging", mentions: 35 },
      { keyword: "garden", mentions: 26 },
      { keyword: "morning walk", mentions: 24 },
      { keyword: "evening walk", mentions: 21 },
      { keyword: "badminton", mentions: 18 },
      { keyword: "lawn tennis", mentions: 17 },
      { keyword: "cricket", mentions: 17 },
      { keyword: "functions", mentions: 16 },
      { keyword: "coaching", mentions: 12 },
      { keyword: "synthetic court", mentions: 9 },
      { keyword: "lighting", mentions: 8 },
      { keyword: "game", mentions: 7 },
      { keyword: "bar", mentions: 6 },
    ];

    const filtered = filterRelevantThemes(rawThemes, badmintonCategory);
    const keywords = filtered.map((t) => t.keyword);

    expect(keywords).toEqual(["badminton", "coaching", "synthetic court", "lighting"]);
    expect(keywords).not.toContain("jogging");
    expect(keywords).not.toContain("garden");
    expect(keywords).not.toContain("morning walk");
    expect(keywords).not.toContain("evening walk");
    expect(keywords).not.toContain("lawn tennis");
    expect(keywords).not.toContain("cricket");
    expect(keywords).not.toContain("functions");
    expect(keywords).not.toContain("game");
    expect(keywords).not.toContain("bar");
  });
});

describe("Theme Filter: Valid Operational Themes Across Different Businesses", () => {
  it("validates gym themes", () => {
    const gym = resolveCategory("gym");
    expect(isRelevantTheme("trainer quality", gym)).toBe(true);
    expect(isRelevantTheme("equipment & maintenance", gym)).toBe(true);
    expect(isRelevantTheme("peak hours crowd", gym)).toBe(true);
    expect(isRelevantTheme("membership", gym)).toBe(true);
    expect(isRelevantTheme("cleanliness", gym)).toBe(true);
    expect(isRelevantTheme("weights", gym)).toBe(true);
    expect(isRelevantTheme("treadmill", gym)).toBe(true);
    expect(isRelevantTheme("locker room", gym)).toBe(true);
    expect(isRelevantTheme("parking", gym)).toBe(true);

    // Rejects non-gym activities
    expect(isRelevantTheme("jogging", gym)).toBe(false);
    expect(isRelevantTheme("morning walk", gym)).toBe(false);
    expect(isRelevantTheme("garden", gym)).toBe(false);
  });

  it("validates salon and personal care themes", () => {
    const salon = resolveCategory("salon");
    expect(isRelevantTheme("haircut", salon)).toBe(true);
    expect(isRelevantTheme("stylist", salon)).toBe(true);
    expect(isRelevantTheme("cleanliness", salon)).toBe(true);
    expect(isRelevantTheme("pricing", salon)).toBe(true);
    expect(isRelevantTheme("appointment", salon)).toBe(true);
    expect(isRelevantTheme("staff", salon)).toBe(true);
    expect(isRelevantTheme("ambience", salon)).toBe(true);

    expect(isRelevantTheme("court", salon)).toBe(false);
    expect(isRelevantTheme("cricket", salon)).toBe(false);
  });

  it("validates automotive and car wash themes", () => {
    const carWash = resolveCategory("car wash");
    expect(isRelevantTheme("car wash", carWash)).toBe(true);
    expect(isRelevantTheme("detailing", carWash)).toBe(true);
    expect(isRelevantTheme("water pressure", carWash)).toBe(true);
    expect(isRelevantTheme("vacuum", carWash)).toBe(true);
    expect(isRelevantTheme("waiting area", carWash)).toBe(true);
    expect(isRelevantTheme("customer service", carWash)).toBe(true);
    expect(isRelevantTheme("pricing", carWash)).toBe(true);

    expect(isRelevantTheme("morning walk", carWash)).toBe(false);
    expect(isRelevantTheme("garden", carWash)).toBe(false);
    expect(isRelevantTheme("game", carWash)).toBe(false);
  });

  it("validates bakery and cafe themes", () => {
    const bakery = resolveCategory("bakery");
    expect(isRelevantTheme("pastries", bakery)).toBe(true);
    expect(isRelevantTheme("bread", bakery)).toBe(true);
    expect(isRelevantTheme("fresh", bakery)).toBe(false); // bare word 'fresh' disallowed as generic unless qualified
    expect(isRelevantTheme("cleanliness", bakery)).toBe(true);
    expect(isRelevantTheme("pricing", bakery)).toBe(true);
    expect(isRelevantTheme("service", bakery)).toBe(true);

    const cafe = resolveCategory("cafe");
    expect(isRelevantTheme("coffee", cafe)).toBe(true);
    expect(isRelevantTheme("espresso", cafe)).toBe(true);
    expect(isRelevantTheme("seating", cafe)).toBe(true);
    expect(isRelevantTheme("ambience", cafe)).toBe(true);
    expect(isRelevantTheme("wait time", cafe)).toBe(true);
    expect(isRelevantTheme("swimming pool", cafe)).toBe(false);
    expect(isRelevantTheme("jogging", cafe)).toBe(false);
  });

  it("validates healthcare / dental clinic themes", () => {
    const dental = resolveCategory("dental clinic");
    expect(isRelevantTheme("teeth cleaning", dental)).toBe(true);
    expect(isRelevantTheme("dentist", dental)).toBe(true);
    expect(isRelevantTheme("doctor", dental)).toBe(true);
    expect(isRelevantTheme("hygiene", dental)).toBe(true);
    expect(isRelevantTheme("appointment", dental)).toBe(true);
    expect(isRelevantTheme("billing", dental)).toBe(true);
    expect(isRelevantTheme("cricket", dental)).toBe(false);
    expect(isRelevantTheme("jogging", dental)).toBe(false);
  });

  it("handles custom category: pickleball", () => {
    const pickleball = resolveCategory("pickleball");
    expect(isRelevantTheme("pickleball", pickleball)).toBe(true);
    expect(isRelevantTheme("court", pickleball)).toBe(true);
    expect(isRelevantTheme("paddle", pickleball)).toBe(true);
    expect(isRelevantTheme("lighting", pickleball)).toBe(true);
    expect(isRelevantTheme("booking", pickleball)).toBe(true);
    expect(isRelevantTheme("game", pickleball)).toBe(false);
    expect(isRelevantTheme("light", pickleball)).toBe(false);
    expect(isRelevantTheme("bar", pickleball)).toBe(false);
    expect(isRelevantTheme("pass", pickleball)).toBe(false);
    expect(isRelevantTheme("jogging", pickleball)).toBe(false);
  });
});
