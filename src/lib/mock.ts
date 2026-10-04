import type { ScanResult } from "@/lib/scoring";

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
