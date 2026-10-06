// Keeps geographic presets isolated to avoid circular imports with categories and search parsers.

export interface AreaPreset {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

export const AREA_PRESETS: AreaPreset[] = [
  { id: "koramangala", label: "Koramangala, Bengaluru", lat: 12.9352, lng: 77.6245 },
  { id: "indiranagar", label: "Indiranagar, Bengaluru", lat: 12.9784, lng: 77.6408 },
  { id: "bandra-west", label: "Bandra West, Mumbai", lat: 19.0596, lng: 72.8295 },
  { id: "hauz-khas", label: "Hauz Khas, New Delhi", lat: 28.5494, lng: 77.2001 },
];

export interface KnownPlace {
  id: string;
  label: string;
  lat: number;
  lng: number;
  type: "city" | "neighborhood";
}

export const KNOWN_PLACES: KnownPlace[] = [
  ...AREA_PRESETS.map((p) => ({ ...p, type: "neighborhood" as const })),
  // Tier 1 Metro Areas & Major Neighborhoods
  { id: "koramangala", label: "Koramangala, Bengaluru", lat: 12.9352, lng: 77.6245, type: "neighborhood" },
  { id: "indiranagar", label: "Indiranagar, Bengaluru", lat: 12.9784, lng: 77.6408, type: "neighborhood" },
  { id: "hsr-layout", label: "HSR Layout, Bengaluru", lat: 12.9121, lng: 77.6446, type: "neighborhood" },
  { id: "whitefield", label: "Whitefield, Bengaluru", lat: 12.9698, lng: 77.7499, type: "neighborhood" },
  { id: "jayanagar", label: "Jayanagar, Bengaluru", lat: 12.9308, lng: 77.5838, type: "neighborhood" },
  { id: "jp-nagar", label: "JP Nagar, Bengaluru", lat: 12.9063, lng: 77.5857, type: "neighborhood" },
  { id: "bengaluru", label: "Bengaluru, Karnataka", lat: 12.9716, lng: 77.5946, type: "city" },
  { id: "bangalore", label: "Bengaluru, Karnataka", lat: 12.9716, lng: 77.5946, type: "city" },

  { id: "bandra-west", label: "Bandra West, Mumbai", lat: 19.0596, lng: 72.8295, type: "neighborhood" },
  { id: "bandra-east", label: "Bandra East, Mumbai", lat: 19.0626, lng: 72.8512, type: "neighborhood" },
  { id: "andheri-west", label: "Andheri West, Mumbai", lat: 19.1363, lng: 72.8277, type: "neighborhood" },
  { id: "juhu", label: "Juhu, Mumbai", lat: 19.1075, lng: 72.8263, type: "neighborhood" },
  { id: "powai", label: "Powai, Mumbai", lat: 19.1176, lng: 72.9060, type: "neighborhood" },
  { id: "colaba", label: "Colaba, Mumbai", lat: 18.9067, lng: 72.8147, type: "neighborhood" },
  { id: "mumbai", label: "Mumbai, Maharashtra", lat: 19.076, lng: 72.8777, type: "city" },

  { id: "hauz-khas", label: "Hauz Khas, New Delhi", lat: 28.5494, lng: 77.2001, type: "neighborhood" },
  { id: "connaught-place", label: "Connaught Place, New Delhi", lat: 28.6315, lng: 77.2167, type: "neighborhood" },
  { id: "south-extension", label: "South Extension, New Delhi", lat: 28.5729, lng: 77.2215, type: "neighborhood" },
  { id: "saket", label: "Saket, New Delhi", lat: 28.5244, lng: 77.2185, type: "neighborhood" },
  { id: "delhi", label: "Delhi, NCR", lat: 28.6139, lng: 77.209, type: "city" },
  { id: "new-delhi", label: "New Delhi, Delhi", lat: 28.6139, lng: 77.209, type: "city" },
  { id: "gurgaon", label: "Gurugram, Haryana", lat: 28.4595, lng: 77.0266, type: "city" },
  { id: "gurugram", label: "Gurugram, Haryana", lat: 28.4595, lng: 77.0266, type: "city" },
  { id: "noida", label: "Noida, Uttar Pradesh", lat: 28.5355, lng: 77.391, type: "city" },

  { id: "gwalior", label: "Gwalior, Madhya Pradesh", lat: 26.2183, lng: 78.1828, type: "city" },
  { id: "pune", label: "Pune, Maharashtra", lat: 18.5204, lng: 73.8567, type: "city" },
  { id: "koregaon-park", label: "Koregaon Park, Pune", lat: 18.5362, lng: 73.894, type: "neighborhood" },
  { id: "baner", label: "Baner, Pune", lat: 18.559, lng: 73.7868, type: "neighborhood" },
  { id: "hyderabad", label: "Hyderabad, Telangana", lat: 17.385, lng: 78.4867, type: "city" },
  { id: "jubilee-hills", label: "Jubilee Hills, Hyderabad", lat: 17.4319, lng: 78.4073, type: "neighborhood" },
  { id: "madhapur", label: "Madhapur, Hyderabad", lat: 17.4483, lng: 78.3915, type: "neighborhood" },
  { id: "chennai", label: "Chennai, Tamil Nadu", lat: 13.0827, lng: 80.2707, type: "city" },
  { id: "kolkata", label: "Kolkata, West Bengal", lat: 22.5726, lng: 88.3639, type: "city" },
  { id: "jaipur", label: "Jaipur, Rajasthan", lat: 26.9124, lng: 75.7873, type: "city" },
  { id: "ahmedabad", label: "Ahmedabad, Gujarat", lat: 23.0225, lng: 72.5714, type: "city" },
  { id: "chandigarh", label: "Chandigarh, Punjab", lat: 30.7333, lng: 76.7794, type: "city" },
  { id: "kochi", label: "Kochi, Kerala", lat: 9.9312, lng: 76.2673, type: "city" },
  { id: "indore", label: "Indore, Madhya Pradesh", lat: 22.7196, lng: 75.8577, type: "city" },
  { id: "bhopal", label: "Bhopal, Madhya Pradesh", lat: 23.2599, lng: 77.4126, type: "city" },
  { id: "lucknow", label: "Lucknow, Uttar Pradesh", lat: 26.8467, lng: 80.9462, type: "city" },
];

export const INDIAN_STATES_AND_UTS = new Set([
  "andhra pradesh",
  "arunachal pradesh",
  "assam",
  "bihar",
  "chhattisgarh",
  "goa",
  "gujarat",
  "haryana",
  "himachal pradesh",
  "jharkhand",
  "karnataka",
  "kerala",
  "madhya pradesh",
  "maharashtra",
  "manipur",
  "meghalaya",
  "mizoram",
  "nagaland",
  "odisha",
  "punjab",
  "rajasthan",
  "sikkim",
  "tamil nadu",
  "telangana",
  "tripura",
  "uttar pradesh",
  "uttarakhand",
  "west bengal",
  "delhi",
  "delhi, ncr",
  "ncr",
  "chandigarh",
  "puducherry",
  "jammu and kashmir",
  "ladakh",
]);
