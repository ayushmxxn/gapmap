import type { Competitor, ScanResult } from "@/lib/scoring";

/** Typed mock placeholders. No network. Mirror of the live result shape. */

export interface MockNotice {
  id: string;
  message: string;
}

export const mockNotices: MockNotice[] = [
  { id: "mock-1", message: "Mock mode is on. No live calls are made." },
];

/** Deterministic mock scan: Koramangala cafes. Matches scanResultSchema. */
export const mockScanResult: ScanResult = {
  mode: "mock",
  version: "v0",
  area: { label: "Koramangala, Bengaluru", lat: 12.9352, lng: 77.6245 },
  category: { id: "cafe", label: "Cafe" },
  gapSignal: { score: 68, verdict: "moderate", renormalized: false },
  components: { trend: 71, reviewSupport: 58, competition: 55, qualityGap: 62 },
  stats: { places: 8, totalReviews: 5210, reviewsExamined: 40 },
  competitors: [
    {
      title: "Mock Brew House",
      rating: 4.6,
      reviews: 1240,
      address: "80 Feet Rd, Koramangala",
      lat: 12.9355,
      lng: 77.6249,
      placeType: "Cafe",
      selection: "anchor",
      evidence: "maps-1",
    },
    {
      title: "Filter Kaapi Corner",
      rating: 4.4,
      reviews: 980,
      address: "5th Block, Koramangala",
      lat: 12.9341,
      lng: 77.6231,
      placeType: "Cafe",
      selection: "anchor",
      evidence: "maps-1",
    },
    {
      title: "Stale Beans",
      rating: 3.2,
      reviews: 410,
      address: "6th Block, Koramangala",
      lat: 12.9368,
      lng: 77.6272,
      placeType: "Cafe",
      selection: "weak-incumbent",
      evidence: "maps-1",
    },
    {
      title: "Rush Hour Roasters",
      rating: 3.6,
      reviews: 355,
      address: "4th Block, Koramangala",
      lat: 12.933,
      lng: 77.6215,
      placeType: "Coffee shop",
      selection: "weak-incumbent",
      evidence: "maps-1",
    },
    {
      title: "Middle Ground Cafe",
      rating: 4.1,
      reviews: 520,
      address: "7th Block, Koramangala",
      lat: 12.9375,
      lng: 77.622,
      placeType: "Cafe",
      selection: "median",
      evidence: "maps-1",
    },
  ],
  themes: [
    {
      keyword: "service",
      mentions: 14,
      sourcePlace: "Stale Beans",
      evidence: "reviews-3",
    },
    {
      keyword: "wait time",
      mentions: 9,
      sourcePlace: "Rush Hour Roasters",
      evidence: "reviews-4",
    },
    {
      keyword: "price",
      mentions: 6,
      sourcePlace: "Mock Brew House",
      evidence: "reviews-1",
    },
  ],
  themesWithheld: false,
  trend: {
    scopeLabel: "Google Trends · India, national · past 12 months",
    avgLevel: 68,
    slopeScore: 74,
    score: 71,
    points: [
      { date: "Jan", value: 55 },
      { date: "Feb", value: 58 },
      { date: "Mar", value: 61 },
      { date: "Apr", value: 60 },
      { date: "May", value: 66 },
      { date: "Jun", value: 70 },
      { date: "Jul", value: 72 },
      { date: "Aug", value: 75 },
    ],
    evidence: "trends-6",
  },
  insights: [
    {
      text: "Search interest for cafes in India averages 68/100 and is rising.",
      evidence: ["trends-6"],
    },
    {
      text: "2 of 8 nearby places are rated below 4.0, holding 765 reviews — footfall exists, satisfaction lags.",
      evidence: ["maps-1", "reviews-3", "reviews-4"],
    },
    {
      text: "Recurring review themes: service (14, Stale Beans); wait time (9, Rush Hour Roasters).",
      evidence: ["reviews-3", "reviews-4"],
    },
  ],
  ledger: [
    {
      id: "maps-1",
      engine: "google_maps",
      summary: 'q="cafe in Koramangala, Bengaluru" @12.9352,77.6245,15z',
      resultCount: 8,
    },
    {
      id: "reviews-1",
      engine: "google_maps_reviews",
      summary: "Mock Brew House (anchor)",
      resultCount: 8,
    },
    {
      id: "reviews-2",
      engine: "google_maps_reviews",
      summary: "Filter Kaapi Corner (anchor)",
      resultCount: 8,
    },
    {
      id: "reviews-3",
      engine: "google_maps_reviews",
      summary: "Stale Beans (weak-incumbent)",
      resultCount: 8,
    },
    {
      id: "reviews-4",
      engine: "google_maps_reviews",
      summary: "Rush Hour Roasters (weak-incumbent)",
      resultCount: 8,
    },
    {
      id: "reviews-5",
      engine: "google_maps_reviews",
      summary: "Middle Ground Cafe (median)",
      resultCount: 8,
    },
    {
      id: "trends-6",
      engine: "google_trends",
      summary: "q=cafe,bakery,salon,gym geo=IN today 12-m",
      resultCount: 8,
    },
  ],
};

const GWALIOR_GYM_COMPETITORS: Competitor[] = [
  {
    title: "Gold's Gym City Centre",
    rating: 4.6,
    reviews: 840,
    address: "Patel Nagar, City Centre, Gwalior",
    lat: 26.2085,
    lng: 78.188,
    placeType: "Gym / Physical fitness center",
    selection: "anchor",
    evidence: "maps-1",
  },
  {
    title: "Cult.fit Thatipur",
    rating: 4.5,
    reviews: 620,
    address: "Alaknanda Tower, Thatipur, Gwalior",
    lat: 26.214,
    lng: 78.205,
    placeType: "Fitness center",
    selection: "anchor",
    evidence: "maps-1",
  },
  {
    title: "Talwalkars Fitness Club",
    rating: 4.1,
    reviews: 490,
    address: "Jayendraganj, Lashkar, Gwalior",
    lat: 26.205,
    lng: 78.162,
    placeType: "Gym",
    selection: "median",
    evidence: "maps-1",
  },
  {
    title: "Anytime Fitness Morar",
    rating: 4.4,
    reviews: 380,
    address: "Mall Road, Morar, Gwalior",
    lat: 26.229,
    lng: 78.228,
    placeType: "Health club",
    selection: "median",
    evidence: "maps-1",
  },
  {
    title: "Iron Paradise Gym",
    rating: 3.8,
    reviews: 290,
    address: "Phoolbagh, Gwalior",
    lat: 26.218,
    lng: 78.171,
    placeType: "Gym",
    selection: "weak-incumbent",
    evidence: "maps-1",
  },
  {
    title: "Muscle Studio & Spa",
    rating: 3.5,
    reviews: 210,
    address: "Naya Bazaar, Lashkar, Gwalior",
    lat: 26.198,
    lng: 78.158,
    placeType: "Gym",
    selection: "weak-incumbent",
    evidence: "maps-1",
  },
  {
    title: "FitZone Wellness Centre",
    rating: 4.2,
    reviews: 310,
    address: "Pinto Park, Morar, Gwalior",
    lat: 26.241,
    lng: 78.239,
    placeType: "Fitness center",
    evidence: "maps-2",
  },
  {
    title: "Spartan Fitness Club",
    rating: 3.4,
    reviews: 180,
    address: "Tansen Road, Hazira, Gwalior",
    lat: 26.236,
    lng: 78.181,
    placeType: "Gym",
    evidence: "maps-2",
  },
  {
    title: "Transform Gym & Crossfit",
    rating: 4.7,
    reviews: 540,
    address: "Gandhi Nagar, Gwalior",
    lat: 26.211,
    lng: 78.179,
    placeType: "Gym",
    evidence: "maps-2",
  },
  {
    title: "Olympia Power Gym",
    rating: 3.9,
    reviews: 145,
    address: "Kampoo, Lashkar, Gwalior",
    lat: 26.192,
    lng: 78.151,
    placeType: "Gym",
    evidence: "maps-2",
  },
  {
    title: "Powerhouse Gym",
    rating: 4.3,
    reviews: 330,
    address: "University Road, Govindpuri, Gwalior",
    lat: 26.203,
    lng: 78.196,
    placeType: "Fitness center",
    evidence: "maps-2",
  },
  {
    title: "Elite Fitness Studio",
    rating: 4.0,
    reviews: 195,
    address: "Anand Nagar, Bahodapur, Gwalior",
    lat: 26.244,
    lng: 78.153,
    placeType: "Gym",
    evidence: "maps-2",
  },
  {
    title: "Burn & Build Gym",
    rating: 3.6,
    reviews: 270,
    address: "Station Road, Padav, Gwalior",
    lat: 26.222,
    lng: 78.181,
    placeType: "Gym",
    evidence: "maps-2",
  },
  {
    title: "Hardcore Fitness",
    rating: 4.2,
    reviews: 360,
    address: "Sector 2, Deen Dayal Nagar, Gwalior",
    lat: 26.252,
    lng: 78.219,
    placeType: "Fitness center",
    evidence: "maps-2",
  },
  {
    title: "Titan Gym & Crossfit",
    rating: 3.7,
    reviews: 220,
    address: "Shinde Ki Chhawani, Gwalior",
    lat: 26.213,
    lng: 78.167,
    placeType: "Gym",
    evidence: "maps-2",
  },
];

export function generateMockScanResult(params: {
  lat: number;
  lng: number;
  categoryId: string;
  categoryLabel: string;
  areaLabel: string;
  scope?: "city" | "neighborhood";
}): ScanResult {
  const isCity = params.scope === "city";
  const cleanCity = params.areaLabel.split(",")[0].trim();
  const isGwaliorGym =
    params.categoryId.toLowerCase().includes("gym") &&
    cleanCity.toLowerCase().includes("gwalior");

  let competitors: Competitor[];

  if (isGwaliorGym) {
    competitors = GWALIOR_GYM_COMPETITORS;
  } else if (isCity) {
    // Generate realistic city-wide spread across 4 to 8 km
    const hubs = [
      { name: "Central Market", offsetLat: 0.015, offsetLng: 0.012 },
      { name: "Main Commercial Hub", offsetLat: -0.012, offsetLng: 0.018 },
      { name: "West District", offsetLat: -0.021, offsetLng: -0.024 },
      { name: "East Extension", offsetLat: 0.024, offsetLng: 0.035 },
      { name: "North Sector", offsetLat: 0.032, offsetLng: -0.005 },
      { name: "South Avenue", offsetLat: -0.028, offsetLng: -0.015 },
      { name: "Old City Area", offsetLat: -0.008, offsetLng: -0.022 },
      { name: "Railway Station Road", offsetLat: 0.018, offsetLng: 0.002 },
      { name: "University Campus Road", offsetLat: -0.019, offsetLng: 0.022 },
      { name: "Industrial Bypass", offsetLat: 0.038, offsetLng: 0.041 },
      { name: "Model Town", offsetLat: -0.004, offsetLng: 0.028 },
      { name: "Civil Lines", offsetLat: 0.012, offsetLng: -0.014 },
    ];

    competitors = hubs.map((h, i) => {
      const rating = Number((3.4 + ((i * 3) % 15) / 10).toFixed(1));
      const reviews = 150 + ((i * 127) % 750);
      const isAnchor = i < 2;
      const isWeak = rating < 4.0 && i > 3 && i < 7;
      const isMedian = i === 2;

      return {
        title: `${cleanCity} ${params.categoryLabel} ${h.name.split(" ")[0]}`,
        rating,
        reviews,
        address: `${h.name}, ${cleanCity}`,
        lat: Number((params.lat + h.offsetLat).toFixed(4)),
        lng: Number((params.lng + h.offsetLng).toFixed(4)),
        placeType: params.categoryLabel,
        selection: isAnchor ? "anchor" : isWeak ? "weak-incumbent" : isMedian ? "median" : undefined,
        evidence: i < 6 ? "maps-1" : "maps-2",
      };
    });
  } else {
    // Neighborhood scan: concentrated within 1.5km
    const offsets = [
      { dLat: 0.002, dLng: 0.003, title: `Main ${params.categoryLabel}` },
      { dLat: -0.003, dLng: -0.002, title: `Corner ${params.categoryLabel}` },
      { dLat: 0.004, dLng: 0.005, title: `Old Town ${params.categoryLabel}` },
      { dLat: -0.005, dLng: 0.004, title: `Express ${params.categoryLabel}` },
      { dLat: 0.006, dLng: -0.005, title: `Prime ${params.categoryLabel}` },
    ];
    competitors = offsets.map((o, i) => ({
      title: `${cleanCity} ${o.title}`,
      rating: Number((3.6 + (i % 10) / 10).toFixed(1)),
      reviews: 200 + i * 150,
      address: `${cleanCity} Sector ${i + 1}`,
      lat: Number((params.lat + o.dLat).toFixed(4)),
      lng: Number((params.lng + o.dLng).toFixed(4)),
      placeType: params.categoryLabel,
      selection: i === 0 ? "anchor" : i === 2 ? "weak-incumbent" : i === 1 ? "median" : undefined,
      evidence: "maps-1",
    }));
  }

  const totalReviews = competitors.reduce((a, c) => a + (c.reviews ?? 0), 0);
  const rated = competitors.filter((c) => c.rating != null);
  const weakCount = rated.filter((c) => (c.rating ?? 0) < 4.0).length;
  const weakReviews = rated
    .filter((c) => (c.rating ?? 0) < 4.0)
    .reduce((a, c) => a + (c.reviews ?? 0), 0);

  const scopeLabel = isCity
    ? `City-wide scan · ${cleanCity}`
    : `Neighborhood scan · 1.5 km`;

  return {
    mode: "mock",
    version: "v0",
    area: {
      label: params.areaLabel,
      lat: params.lat,
      lng: params.lng,
      scope: isCity ? "city" : "neighborhood",
    },
    scope: {
      type: isCity ? "city" : "neighborhood",
      label: scopeLabel,
      radiusKm: isCity ? undefined : 1.5,
      cityName: cleanCity,
    },
    category: { id: params.categoryId, label: params.categoryLabel },
    gapSignal: {
      score: isCity ? 74 : 68,
      verdict: isCity ? "strong" : "moderate",
      renormalized: false,
    },
    components: {
      trend: 76,
      reviewSupport: isCity ? 72 : 58,
      competition: isCity ? 48 : 55,
      qualityGap: isCity ? 66 : 62,
    },
    stats: {
      places: competitors.length,
      totalReviews,
      reviewsExamined: Math.min(60, competitors.length * 5),
    },
    competitors,
    themes: [
      {
        keyword: "equipment & maintenance",
        mentions: isCity ? 24 : 14,
        sourcePlace: competitors[4]?.title ?? "Incumbent",
        evidence: "reviews-3",
      },
      {
        keyword: "peak hours crowd",
        mentions: isCity ? 18 : 9,
        sourcePlace: competitors[1]?.title ?? "Incumbent",
        evidence: "reviews-4",
      },
      {
        keyword: "trainer quality",
        mentions: isCity ? 12 : 6,
        sourcePlace: competitors[0]?.title ?? "Incumbent",
        evidence: "reviews-1",
      },
    ],
    themesWithheld: false,
    trend: {
      scopeLabel: "Google Trends · India, national · past 12 months",
      avgLevel: 72,
      slopeScore: 78,
      score: 76,
      points: [
        { date: "Jan", value: 58 },
        { date: "Feb", value: 62 },
        { date: "Mar", value: 64 },
        { date: "Apr", value: 66 },
        { date: "May", value: 70 },
        { date: "Jun", value: 74 },
        { date: "Jul", value: 76 },
        { date: "Aug", value: 80 },
      ],
      evidence: "trends-6",
    },
    insights: [
      {
        text: `Search interest for ${params.categoryLabel.toLowerCase()}s in India averages 72/100 and is rising.`,
        evidence: ["trends-6"],
      },
      {
        text: `${weakCount} of ${competitors.length} places score below 4.0, holding ${weakReviews.toLocaleString("en-IN")} reviews — customer demand exists, but satisfaction lags.`,
        evidence: ["maps-1", "reviews-3", "reviews-4"],
      },
      {
        text: isCity
          ? `${competitors.length} places identified across ${cleanCity} city-wide.`
          : `${competitors.length} places within 1.5 km (${(competitors.length / 7.07).toFixed(1)}/km²).`,
        evidence: ["maps-1"],
      },
    ],
    ledger: [
      {
        id: "maps-1",
        engine: "google_maps",
        summary: isCity
          ? `q="${params.categoryLabel.toLowerCase()} in ${cleanCity}" city-wide (page 1)`
          : `q="${params.categoryLabel.toLowerCase()} in ${params.areaLabel}" @${params.lat},${params.lng},15z`,
        resultCount: isCity ? Math.min(competitors.length, 10) : competitors.length,
      },
      ...(isCity && competitors.length > 10
        ? [
            {
              id: "maps-2" as const,
              engine: "google_maps" as const,
              summary: `q="${params.categoryLabel.toLowerCase()} in ${cleanCity}" city-wide (page 2)`,
              resultCount: competitors.length - 10,
            },
          ]
        : []),
      {
        id: "reviews-1",
        engine: "google_maps_reviews",
        summary: `${competitors[0]?.title ?? "Anchor"} (anchor)`,
        resultCount: 8,
      },
      {
        id: "reviews-3",
        engine: "google_maps_reviews",
        summary: `${competitors[4]?.title ?? "Weak"} (weak-incumbent)`,
        resultCount: 8,
      },
      {
        id: "reviews-4",
        engine: "google_maps_reviews",
        summary: `${competitors[1]?.title ?? "Incumbent"} (weak-incumbent)`,
        resultCount: 8,
      },
      {
        id: "trends-6",
        engine: "google_trends",
        summary: `q=${params.categoryLabel.toLowerCase()} geo=IN today 12-m`,
        resultCount: 8,
      },
    ],
  };
}
