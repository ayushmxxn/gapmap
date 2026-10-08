import type { Category } from "@/lib/categories";

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "or",
  "in",
  "the",
  "of",
  "for",
  "at",
  "to",
  "by",
  "with",
  "near",
  "shop",
  "shops",
  "store",
  "stores",
  "center",
  "centre",
  "centers",
  "centres",
  "place",
  "places",
  "services",
  "service",
  "business",
  "businesses",
  "station",
  "stations",
  "club",
  "clubs",
  "hub",
  "hubs",
  "zone",
  "zones",
  "point",
  "points",
  "space",
  "spaces",
  "bar",
  "bars",
  "light",
  "lights",
  "pass",
  "passes",
  "game",
  "games",
  "co",
  "diy",
]);

/**
 * Broad terms that must never qualify a review topic on their own as a bare single word.
 */
const DISALLOWED_STANDALONE_TERMS = new Set([
  "light",
  "bar",
  "pass",
  "game",
  "area",
  "room",
  "space",
  "card",
  "desk",
  "club",
  "late",
  "early",
]);

/**
 * Explicit multi-word customer experience and operational phrases.
 */
const UNIVERSAL_CX_PHRASES = new Set([
  "customer service",
  "wait time",
  "waiting time",
  "waiting area",
  "front desk",
  "rush hour",
  "peak hours crowd",
  "day pass",
  "guest pass",
  "value for money",
  "air conditioning",
  "air condition",
  "court lighting",
  "indoor lighting",
  "dim lighting",
  "car parking",
  "bike parking",
  "valet parking",
  "advance booking",
  "online booking",
  "card payment",
  "cash payment",
  "equipment & maintenance",
  "equipment and maintenance",
  "trainer quality",
  "staff behavior",
  "staff behaviour",
  "friendly staff",
  "rude staff",
  "helpful staff",
  "overall experience",
  "worth visiting",
  "worth the money",
]);

/**
 * Universal customer experience and business operations themes applicable
 * across commercial business categories (unambiguous operational terms only).
 */
const UNIVERSAL_CX_TERMS = new Set([
  // Service & Staff
  "service",
  "services",
  "staff",
  "behavior",
  "behaviour",
  "hospitality",
  "support",
  "reception",
  "receptionist",
  "management",
  "manager",
  "owner",
  "trainer",
  "trainers",
  "training",
  "coach",
  "coaches",
  "coaching",
  "instructor",
  "instructors",
  "professional",
  "professionalism",
  "unprofessional",
  "courteous",
  "polite",
  "rude",
  "helpful",
  "attentive",
  "communication",

  // Pricing, Cost & Value
  "price",
  "prices",
  "pricing",
  "cost",
  "costs",
  "costly",
  "expensive",
  "cheap",
  "affordable",
  "budget",
  "value",
  "fee",
  "fees",
  "charge",
  "charges",
  "rate",
  "rates",
  "bill",
  "billing",
  "overpriced",
  "reasonable",
  "membership",
  "package",
  "subscription",
  "deposit",

  // Wait time, speed, timing & crowd
  "queue",
  "delay",
  "delays",
  "timing",
  "timings",
  "hours",
  "schedule",
  "punctual",
  "crowd",
  "crowded",
  "overcrowded",
  "crowds",
  "busy",
  "peaceful",
  "calm",

  // Cleanliness, hygiene & maintenance
  "clean",
  "cleaning",
  "cleanliness",
  "hygiene",
  "hygienic",
  "dirty",
  "unhygienic",
  "tidy",
  "neat",
  "mess",
  "messy",
  "smell",
  "odor",
  "sanitized",
  "washroom",
  "washrooms",
  "restroom",
  "restrooms",
  "toilet",
  "toilets",
  "bathroom",
  "bathrooms",
  "maintenance",
  "maintained",
  "upkeep",
  "condition",
  "renovated",
  "broken",
  "repair",
  "repairs",

  // Environment, comfort, accessibility & facilities
  "ambience",
  "ambiance",
  "atmosphere",
  "vibe",
  "vibes",
  "interior",
  "interiors",
  "decor",
  "decoration",
  "lighting",
  "ac",
  "cooling",
  "heating",
  "ventilation",
  "airy",
  "suffocating",
  "music",
  "noise",
  "noisy",
  "loud",
  "seating",
  "seats",
  "chairs",
  "tables",
  "spacious",
  "cramped",
  "parking",
  "valet",
  "accessibility",
  "wheelchair",
  "elevator",
  "safety",
  "security",
  "cctv",
  "infrastructure",

  // Booking, access & policies
  "booking",
  "bookings",
  "reservation",
  "reservations",
  "appointment",
  "appointments",
  "slot",
  "slots",
  "availability",
  "admission",
  "ticket",
  "tickets",
  "policy",
  "payment",
  "upi",
  "refund",
  "cancellation",

  // Equipment, quality & materials
  "quality",
  "equipment",
  "gear",
  "tools",
  "machine",
  "machines",
  "instruments",
  "materials",
  "inventory",
  "selection",
  "variety",

  // Customer sentiment & feedback
  "experience",
  "worth",
  "recommend",
  "recommended",
  "recommendation",
  "satisfaction",
  "satisfied",
  "disappointed",
  "complaint",
  "complaints",
  "feedback",
]);

interface DomainConfig {
  triggers: string[];
  terms: string[];
}

/**
 * Tightly bounded category-specific domain configurations.
 * Prevents sport/activity cross-contamination (e.g. swimming or cricket into badminton).
 */
const DOMAIN_CONFIGS: DomainConfig[] = [
  {
    // Badminton & Shuttlecock
    triggers: ["badminton", "shuttle", "shuttlecock"],
    terms: [
      "badminton",
      "shuttle",
      "shuttlecock",
      "racket",
      "racquets",
      "racquet",
      "court",
      "courts",
      "synthetic court",
      "wooden court",
      "indoor court",
      "net",
      "grip",
      "stringing",
      "badminton court",
      "badminton coaching",
      "tournament",
    ],
  },
  {
    // Tennis
    triggers: ["tennis"],
    terms: [
      "tennis",
      "lawn tennis",
      "table tennis",
      "tennis court",
      "clay court",
      "synthetic court",
      "grass court",
      "hard court",
      "tennis racket",
      "racket",
      "racquet",
      "court",
      "courts",
      "net",
    ],
  },
  {
    // Squash
    triggers: ["squash"],
    terms: [
      "squash",
      "squash court",
      "court",
      "racket",
      "glass court",
    ],
  },
  {
    // Pickleball
    triggers: ["pickleball"],
    terms: [
      "pickleball",
      "pickleball court",
      "paddle",
      "paddles",
      "court",
      "courts",
      "net",
    ],
  },
  {
    // Gym & Fitness Centers
    triggers: ["gym", "fitness", "workout", "bodybuilding", "crossfit"],
    terms: [
      "gym",
      "workout",
      "weights",
      "dumbbell",
      "barbell",
      "treadmill",
      "cardio",
      "exercise",
      "squat rack",
      "bench press",
      "machines",
      "lockers",
      "locker room",
    ],
  },
  {
    // Yoga & Pilates
    triggers: ["yoga", "pilates"],
    terms: [
      "yoga",
      "pilates",
      "asana",
      "mat",
      "mats",
      "meditation",
      "instructor",
      "posture",
      "stretching",
      "flexibility",
    ],
  },
  {
    // Swimming & Aquatics
    triggers: ["swimming", "swim", "pool"],
    terms: [
      "swimming",
      "swim",
      "pool",
      "swimming pool",
      "lanes",
      "lifeguard",
      "water cleanliness",
      "changing room",
    ],
  },
  {
    // Cricket
    triggers: ["cricket"],
    terms: [
      "cricket",
      "pitch",
      "nets",
      "bowling",
      "batting",
      "turf",
    ],
  },
  {
    // Football & Turf Sports
    triggers: ["football", "soccer"],
    terms: [
      "football",
      "soccer",
      "turf",
      "pitch",
      "goal",
      "ground",
    ],
  },
  {
    // Food & Beverage / Dining
    triggers: [
      "cafe",
      "coffee",
      "tea",
      "bakery",
      "bake",
      "restaurant",
      "food",
      "dining",
      "bistro",
      "pizzeria",
      "ice cream",
      "juice",
      "smoothie",
      "gelato",
      "eatery",
      "diner",
    ],
    terms: [
      "food",
      "drink",
      "drinks",
      "taste",
      "delicious",
      "tasty",
      "menu",
      "beverage",
      "beverages",
      "coffee",
      "tea",
      "snack",
      "snacks",
      "breakfast",
      "lunch",
      "dinner",
      "meal",
      "meals",
      "dessert",
      "desserts",
      "flavor",
      "flavour",
      "portion",
      "portions",
      "cake",
      "pastry",
      "pastries",
      "bread",
      "crust",
      "coffee beans",
      "espresso",
      "latte",
      "cappuccino",
      "dish",
      "dishes",
      "recipe",
    ],
  },
  {
    // Personal Care & Wellness
    triggers: [
      "salon",
      "barber",
      "hair",
      "beauty",
      "parlour",
      "parlor",
      "spa",
      "nail",
      "tattoo",
    ],
    terms: [
      "haircut",
      "hair",
      "style",
      "stylist",
      "facial",
      "massage",
      "skin",
      "nails",
      "nail",
      "shave",
      "beard",
      "spa",
      "treatment",
      "color",
      "colour",
      "manicure",
      "pedicure",
      "waxing",
      "threading",
    ],
  },
  {
    // Automotive & Clean Energy
    triggers: [
      "car",
      "auto",
      "vehicle",
      "wash",
      "detailing",
      "repair",
      "mechanic",
      "charging",
      "ev",
    ],
    terms: [
      "car",
      "cars",
      "vehicle",
      "auto",
      "wash",
      "washing",
      "detailing",
      "detail",
      "polish",
      "polishing",
      "vacuum",
      "oil",
      "engine",
      "charging",
      "charger",
      "battery",
      "tyre",
      "tyres",
      "tire",
      "tires",
      "mechanic",
      "water pressure",
    ],
  },
  {
    // Pet Care
    triggers: [
      "pet",
      "dog",
      "cat",
      "vet",
      "veterinary",
      "puppy",
    ],
    terms: [
      "pet",
      "pets",
      "dog",
      "dogs",
      "cat",
      "cats",
      "puppy",
      "fur",
      "grooming",
      "groom",
      "bath",
      "bathing",
      "paws",
      "paw",
      "nail trimming",
      "vaccination",
      "vet",
      "doctor",
    ],
  },
  {
    // Healthcare & Dental
    triggers: [
      "dental",
      "dentist",
      "teeth",
      "tooth",
      "clinic",
      "pharmacy",
      "medical",
      "doctor",
    ],
    terms: [
      "teeth",
      "tooth",
      "dental",
      "dentist",
      "doctor",
      "treatment",
      "pain",
      "checkup",
      "cleaning",
      "medicine",
      "medicines",
      "prescription",
      "filling",
      "root canal",
      "extraction",
      "braces",
    ],
  },
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function cleanPhrase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function stemWord(word: string): string {
  const w = word.toLowerCase();
  if (w.endsWith("ies") && w.length > 4) return w.slice(0, -3) + "y";
  if (w.endsWith("es") && w.length > 4) return w.slice(0, -2);
  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) return w.slice(0, -1);
  return w;
}

export type CategoryContext = Partial<Category> & {
  id?: string;
  label?: string;
  mapsQuery?: string;
  aliases?: string[];
};

/**
 * Extracts distinct informative tokens from a category (label, query, aliases).
 * Filters out generic stopwords and broad ambiguous single-word terms.
 */
export function extractCategoryTokens(category: CategoryContext): string[] {
  const sources = [
    category.id ?? "",
    category.label ?? "",
    category.mapsQuery ?? "",
    ...(category.aliases ?? []),
  ];

  const tokens = new Set<string>();
  for (const src of sources) {
    for (const token of tokenize(src)) {
      if (!STOP_WORDS.has(token) && !DISALLOWED_STANDALONE_TERMS.has(token)) {
        tokens.add(token);
      }
    }
  }
  return Array.from(tokens);
}

/**
 * Checks whether a topic keyword matches universal customer experience / operations.
 */
export function isUniversalCustomerExperienceTheme(keyword: string): boolean {
  const phrase = cleanPhrase(keyword);
  if (!phrase) return false;

  // Single word checks: disallow generic/ambiguous bare terms (e.g. "light", "bar", "pass", "game")
  if (DISALLOWED_STANDALONE_TERMS.has(phrase)) {
    return false;
  }

  // Exact phrase match (e.g. "customer service", "wait time", "day pass", "court lighting")
  if (UNIVERSAL_CX_PHRASES.has(phrase)) {
    return true;
  }

  // Exact single-word match against universal CX terms
  if (UNIVERSAL_CX_TERMS.has(phrase)) {
    return true;
  }

  const topicTokens = tokenize(phrase);

  // If multi-word, check if any token is a strong universal CX keyword
  // (while verifying the topic doesn't consist solely of disallowed terms)
  return topicTokens.some(
    (t) => UNIVERSAL_CX_TERMS.has(t) && !DISALLOWED_STANDALONE_TERMS.has(t),
  );
}

/**
 * Checks if a topic phrase/tokens match a category token on word boundaries.
 */
function matchesCategoryToken(
  topicTokens: string[],
  catToken: string,
): boolean {
  if (catToken.length < 3 || DISALLOWED_STANDALONE_TERMS.has(catToken)) {
    return false;
  }
  const cStem = stemWord(catToken);

  for (const t of topicTokens) {
    if (t === catToken || stemWord(t) === cStem) {
      return true;
    }
  }
  return false;
}

/**
 * Determines deterministically whether a review theme keyword is relevant
 * to the searched business category or represents meaningful customer experience feedback.
 *
 * Excludes unrelated amenities/activities that bleed into review topics from multi-purpose
 * complexes, parks, clubs, or hotels (e.g. "jogging", "garden", "morning walk" when searching for "Badminton"),
 * as well as overly broad ambiguous words ("light", "bar", "pass", "game") on their own.
 */
export function isRelevantTheme(
  keyword: string,
  category: CategoryContext,
): boolean {
  const trimmed = keyword.trim();
  if (!trimmed) return false;

  const phrase = cleanPhrase(trimmed);
  if (!phrase) return false;

  // Reject standalone disallowed broad words immediately
  if (DISALLOWED_STANDALONE_TERMS.has(phrase)) {
    return false;
  }

  // 1. Universal Customer Experience & Business Operations match
  if (isUniversalCustomerExperienceTheme(phrase)) {
    return true;
  }

  const topicTokens = tokenize(phrase);

  // 2. Direct Category Match (exact phrase or token match on word boundaries)
  const categoryTokens = extractCategoryTokens(category);
  for (const catToken of categoryTokens) {
    if (matchesCategoryToken(topicTokens, catToken)) {
      return true;
    }
  }

  // Check multi-word category query exact phrase containment
  const cleanedCategory = cleanPhrase(
    `${category.label ?? ""} ${category.mapsQuery ?? ""}`,
  );
  if (
    cleanedCategory.length >= 4 &&
    (phrase === cleanedCategory || phrase.includes(cleanedCategory))
  ) {
    return true;
  }

  // 3. Category-Specific Domain Match (tightly bounded triggers to terms)
  const categoryText = cleanPhrase(
    `${category.id ?? ""} ${category.label ?? ""} ${category.mapsQuery ?? ""}`,
  );

  for (const config of DOMAIN_CONFIGS) {
    const isDomainActive = config.triggers.some((trigger) => {
      // Trigger must match on token boundary, not arbitrary substring
      const cTokens = tokenize(categoryText);
      return cTokens.some((t) => t === trigger || stemWord(t) === stemWord(trigger));
    });

    if (isDomainActive) {
      if (config.terms.includes(phrase)) return true;

      for (const tToken of topicTokens) {
        if (
          !DISALLOWED_STANDALONE_TERMS.has(tToken) &&
          config.terms.includes(tToken)
        ) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Filters an array of themes to retain only category-relevant or customer-experience themes.
 */
export function filterRelevantThemes<T extends { keyword: string }>(
  themes: T[],
  category: CategoryContext,
): T[] {
  return themes.filter((t) => isRelevantTheme(t.keyword, category));
}
