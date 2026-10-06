// Sibling queries benchmark relative interest in a single Trends call (5 term max).
export interface Category {
  id: string;
  label: string;
  mapsQuery: string;
  trendsQuery: string;
  /** Sibling trend queries, target excluded. Target + siblings <= 5. */
  siblings: string[];
  /** Search synonyms and variations (e.g. plurals, alternative names). */
  aliases?: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: "cafe",
    label: "Cafe",
    mapsQuery: "cafe",
    trendsQuery: "cafe",
    siblings: ["bakery", "salon", "gym"],
    aliases: [
      "cafe",
      "cafes",
      "coffee",
      "coffee shop",
      "coffee shops",
      "espresso bar",
      "tea house",
    ],
  },
  {
    id: "bakery",
    label: "Bakery",
    mapsQuery: "bakery",
    trendsQuery: "bakery",
    siblings: ["cafe", "salon", "gym"],
    aliases: ["bakery", "bakeries", "bakehouse", "pastry shop", "baker"],
  },
  {
    id: "salon",
    label: "Salon",
    mapsQuery: "salon",
    trendsQuery: "salon",
    siblings: ["cafe", "spa", "barber"],
    aliases: [
      "salon",
      "salons",
      "beauty salon",
      "hair salon",
      "parlour",
      "parlor",
      "barber",
      "barbershop",
    ],
  },
  {
    id: "gym",
    label: "Gym",
    mapsQuery: "gym",
    trendsQuery: "gym",
    siblings: ["yoga studio", "cafe", "salon"],
    aliases: [
      "gym",
      "gyms",
      "fitness",
      "fitness center",
      "fitness club",
      "health club",
      "gymnasium",
    ],
  },
  {
    id: "laundromat",
    label: "Laundry",
    mapsQuery: "laundromat",
    trendsQuery: "laundromat",
    siblings: ["dry cleaner", "salon", "cafe"],
    aliases: [
      "laundromat",
      "laundromats",
      "laundry",
      "dry cleaner",
      "dry cleaners",
      "launderette",
    ],
  },
  {
    id: "pet-grooming",
    label: "Pet grooming",
    mapsQuery: "pet grooming",
    trendsQuery: "pet grooming",
    siblings: ["veterinary", "pet store", "salon"],
    aliases: [
      "pet grooming",
      "pet groomer",
      "pet groomers",
      "pet spa",
      "dog grooming",
      "pet salon",
    ],
  },
];

export interface DirectoryGroup {
  name: string;
  items: { id: string; label: string }[];
}

export const BUSINESS_DIRECTORY: DirectoryGroup[] = [
  {
    name: "Food & Beverage",
    items: [
      { id: "cafe", label: "Cafe" },
      { id: "bakery", label: "Bakery" },
      { id: "restaurant", label: "Restaurant" },
      { id: "coffee-shop", label: "Coffee shop" },
      { id: "ice-cream", label: "Ice cream & Gelato" },
      { id: "pizzeria", label: "Pizzeria" },
      { id: "bistro", label: "Bistro & Bar" },
      { id: "tea-house", label: "Tea house" },
      { id: "juice-bar", label: "Juice & Smoothie bar" },
    ],
  },
  {
    name: "Health & Fitness",
    items: [
      { id: "gym", label: "Gym" },
      { id: "yoga-studio", label: "Yoga studio" },
      { id: "pilates-studio", label: "Pilates studio" },
      { id: "fitness-center", label: "CrossFit & Fitness" },
      { id: "martial-arts", label: "Martial arts & Boxing" },
      { id: "spa", label: "Spa & Wellness" },
    ],
  },
  {
    name: "Personal Care",
    items: [
      { id: "salon", label: "Salon" },
      { id: "barbershop", label: "Barber shop" },
      { id: "nail-salon", label: "Nail salon" },
      { id: "tattoo-studio", label: "Tattoo studio" },
      { id: "beauty-parlour", label: "Beauty parlour" },
    ],
  },
  {
    name: "Services & Daily Needs",
    items: [
      { id: "laundromat", label: "Laundry" },
      { id: "dry-cleaner", label: "Dry cleaner" },
      { id: "pet-grooming", label: "Pet grooming" },
      { id: "veterinary", label: "Veterinary clinic" },
      { id: "coworking", label: "Coworking space" },
      { id: "daycare", label: "Daycare & Preschool" },
    ],
  },
  {
    name: "Retail & Specialized",
    items: [
      { id: "bookstore", label: "Bookstore" },
      { id: "boutique", label: "Boutique & Apparel" },
      { id: "florist", label: "Flower shop & Florist" },
      { id: "pharmacy", label: "Pharmacy & Chemist" },
      { id: "bicycle-shop", label: "Bicycle shop" },
      { id: "dental-clinic", label: "Dental clinic" },
    ],
  },
  {
    name: "Automotive & Clean Energy",
    items: [
      { id: "ev-charging", label: "EV charging station" },
      { id: "car-wash", label: "Car wash & Detailing" },
      { id: "auto-repair", label: "Auto repair workshop" },
    ],
  },
];

const KNOWN_ACRONYMS: Record<string, string> = {
  ev: "EV",
  atm: "ATM",
  bbq: "BBQ",
  f45: "F45",
  diy: "DIY",
  co: "Co",
};

export function getCategory(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function resolveCategory(idOrQuery: string): Category {
  const trimmed = idOrQuery.trim();
  if (!trimmed) {
    return CATEGORIES[0];
  }

  const clean = trimmed.toLowerCase();

  const existing = CATEGORIES.find(
    (c) =>
      c.id.toLowerCase() === clean ||
      c.label.toLowerCase() === clean ||
      c.aliases?.some((a) => a.toLowerCase() === clean),
  );
  if (existing) return existing;

  for (const group of BUSINESS_DIRECTORY) {
    const item = group.items.find(
      (i) => i.id.toLowerCase() === clean || i.label.toLowerCase() === clean,
    );
    if (item) {
      return {
        id: item.id,
        label: item.label,
        mapsQuery: item.label.toLowerCase(),
        trendsQuery: item.label.toLowerCase(),
        siblings: [],
      };
    }
  }

  // Build fallback category descriptors on the fly for custom or unlisted business searches.
  const normalized = trimmed.replace(/[-_]+/g, " ");
  const label = normalized
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      const lower = w.toLowerCase();
      if (KNOWN_ACRONYMS[lower]) {
        return KNOWN_ACRONYMS[lower];
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(" ");

  const slug = normalized
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return {
    id: slug || "custom-business",
    label: label || "Custom Business",
    mapsQuery: normalized.toLowerCase(),
    trendsQuery: normalized.toLowerCase(),
    siblings: [],
  };
}

export { AREA_PRESETS, type AreaPreset } from "@/lib/places";
