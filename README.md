<p align="center">
  <img src="./public/logo.png" alt="GapMap Logo" width="80" />
</p>

<h1 align="center">GapMap</h1>

<p align="center">
  <strong>Local market opportunity and commercial gap analysis scanner.</strong><br>
  Evaluates local competitor density, customer review sentiment, and search demand trends before opening a business.
</p>

<p align="center">
  <a href="https://gapmap.app"><strong>Live Demo: gapmap.app →</strong></a>
</p>

---

## Evaluation & Quick Start (Hackathon Judges)

### What GapMap Does
GapMap is a commercial feasibility scanner for entrepreneurs and retail operators. By synthesizing local competitor density, Google Maps customer sentiment, and Google Trends search trajectories, it generates an interpretable **Gap Signal (0–100)** to identify underserved business opportunities in any neighborhood or city.

### 60-Second Local Setup (Zero Keys Required)
GapMap is **mock-first by default**. You can clone, launch, and test every feature in under a minute without creating any third-party accounts or configuring API keys:

```bash
# 1. Clone repository
git clone https://github.com/ayushmxxn/gapmap.git
cd gapmap

# 2. Install dependencies
pnpm install

# 3. Start local development server
pnpm dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser. All interactive maps, category searches, evidence sheets, and analytical ledgers will work out of the box using deterministic offline datasets.

### Running in Live Mode
To run against live Google Maps and Google Trends data:
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Configure your keys:
   ```env
   NEXT_PUBLIC_USE_MOCK=false
   SERPAPI_KEY=your_serpapi_key_here
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token_here
   ```
3. Restart `pnpm dev`.

---

## How SerpApi Is Used
SerpApi powers GapMap's server-side discovery pipeline across three distinct engines (isolated strictly within server route handlers; keys never reach the client bundle):

1. **`google_maps` (Supply Analysis)**:
   - Scans local businesses by query and coordinates (`q`, `ll`).
   - Gathers competitor metadata: physical coordinates, ratings, total review counts, and category classifications.
2. **`google_maps_reviews` (Quality & Sentiment Analysis)**:
   - Samples representative incumbents (anchors, weak incumbents, median performers).
   - Extracts recurring customer dissatisfaction topics and complaint frequencies (`topics`, `snippet`).
3. **`google_trends` (Demand Trajectory)**:
   - Fetches 12-month interest timeseries (`interest_over_time`) for commercial categories.
   - Calculates baseline interest levels and search volume slope.

All SerpApi requests include hardened 12-second socket timeouts, LRU in-memory response caching, in-flight request coalescing, and automated secret redaction in all server logs.

---

## Deterministic Gap Signal Calculation

GapMap deliberately avoids non-deterministic LLM hallucination for core business metrics. The **Gap Signal (0–100)** is calculated via pure mathematical algorithms:

$$\text{Gap Signal} = w_t \cdot S_{\text{trend}} + w_r \cdot S_{\text{review}} + w_c \cdot (100 - S_{\text{competition}}) + w_q \cdot S_{\text{quality}}$$

- **1. Trend Demand ($w_t = 0.35$)**: Linear least-squares regression slope combined with mean volume across a 12-month timeline.
- **2. Review Support ($w_r = 0.10$)**: Logarithmic scaling of aggregate market transaction volume ($25 \cdot \log_{10}(1 + \text{reviews}) - 10$).
- **3. Competition Saturation ($w_c = 0.25$, inverted)**: Spatial supply saturation derived from competitor count, density per $\text{km}^2$, and median nearest-neighbor distance (Turf.js). Inverted so lower competition yields higher gap opportunity.
- **4. Quality & Complaint Gap ($w_q = 0.30$)**: Proportion of incumbent reviews below $4.0\star$, boosted by recurring negative topic complaints.
- **Weight Renormalization**: If Google Trends data is unavailable for a query, weights automatically redistribute proportionally across the remaining 3 signals ($w_r \approx 0.15$, $w_c \approx 0.38$, $w_q \approx 0.46$).

### Verdict Bands
- **Strong Signal ($\ge 75$)**: High unmet demand, significant incumbent service complaints, or low supply saturation.
- **Moderate Signal ($50–74$)**: Viable market with balanced competition and steady demand.
- **Weak Signal ($< 50$)**: High competitor saturation, dominant high-rated incumbents, or declining search trends.

---

## Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack) & React 19
- **Language**: TypeScript (Strict mode, zero `any`, strict Zod schema validation)
- **Styling**: Tailwind CSS v4 & custom WebGL liquid-metal canvas shaders
- **Mapping & Geospatial**: Mapbox GL v3, react-map-gl, and Turf.js
- **Charts & Data Viz**: Recharts (trend timelines)
- **State Management**: Zustand (lightweight client state)
- **Data Integration**: SerpApi (Google Maps, Reviews, Trends)
- **Edge Deployment**: Cloudflare Workers via vinext
- **Testing**: Vitest (56+ automated unit and integration tests)

---

## Architecture & Codebase Structure

```text
GapMap/
├── public/                 # Static assets (logo, og-image, favicon)
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/            # Thin Server Route Handlers (/api/scan, /api/health)
│   │   ├── globals.css     # Tailwind v4 theme tokens, accessibility & shader styles
│   │   ├── layout.tsx      # RootLayout with SEO metadata & JSON-LD structured data
│   │   ├── manifest.ts     # Web App Manifest
│   │   ├── page.tsx        # Application entry view
│   │   ├── robots.ts       # Crawlability & search engine directives
│   │   └── sitemap.ts      # Automated XML sitemap
│   ├── components/         # Interactive UI components
│   │   ├── ui/             # Reusable UI primitives (Button)
│   │   ├── business-picker-modal.tsx # Category selection dialog
│   │   ├── competitor-marker.tsx     # Accessible Mapbox competitor marker
│   │   ├── competitors-table.tsx     # Filterable competitor table
│   │   ├── discovery-map.tsx         # Mapbox GL local & globe visualizer
│   │   ├── evidence-sheet.tsx        # Slide-over evidence drawer
│   │   ├── liquid-metal-button.tsx   # Metallic GPU shader action button
│   │   ├── map-wrapper.tsx           # Dynamic client-boundary wrapper for map
│   │   ├── providers.tsx             # Theme and sound providers
│   │   ├── scan-studio.tsx           # Main workspace coordinating scan states
│   │   ├── signal-hero.tsx           # Score summary card
│   │   ├── sound-provider.tsx        # Audio feedback state
│   │   ├── theme-toggle.tsx          # Light/Dark mode switcher
│   │   ├── themes-list.tsx           # Customer review themes list
│   │   ├── trend-chart.tsx           # Recharts interest timeline
│   │   └── unified-search.tsx        # Natural-language search bar with autocomplete
│   ├── hooks/              # Reusable UI behavior hooks
│   │   ├── use-overlay.ts            # Focus trap, scroll lock, and Escape dismissal
│   │   └── use-place-autocomplete.ts # Debounced geocoding and suggestions hook
│   ├── lib/                # Core domain, clients, & server services
│   │   ├── services/
│   │   │   └── scan-pipeline.ts # Complete scan orchestration & synthesis
│   │   ├── categories.ts        # Business directory & category resolution
│   │   ├── env.ts               # Zod-validated environment config
│   │   ├── geo.ts               # Geospatial calculations (Turf)
│   │   ├── location-scope.ts    # Scope detection (city vs neighborhood)
│   │   ├── map-utils.ts         # Globe zoom trigonometry & rating colors
│   │   ├── mapbox-geocoding.ts  # Mapbox forward & reverse geocoding
│   │   ├── mapbox.ts            # Mapbox token & style constants
│   │   ├── mock.ts              # Deterministic mock scan generator
│   │   ├── mode.ts              # Mock-first mode switch
│   │   ├── places.ts            # Centralized Indian places, presets, and centroids
│   │   ├── rate-limit.ts        # Zero-allocation sliding-window rate limiter
│   │   ├── result-utils.ts      # Synthesis & formatting helpers
│   │   ├── scan-cache.ts        # Multi-tier LRU cache & request coalescer
│   │   ├── scan-client.ts       # Client API client with cache & timeout handling
│   │   ├── scoring.ts           # Pure Gap Signal v0 calculation algorithms
│   │   ├── search-parser.ts     # Natural language query tokenizer
│   │   ├── serpapi.ts           # Server-only hardened SerpApi client
│   │   ├── sound.ts             # Web Audio API sound synthesizers
│   │   └── utils.ts             # Styling utility (cn)
│   ├── store/              # Global UI state
│   │   └── app.ts           # Zustand store for workspace UI state
│   └── types/              # Domain data contracts & Zod schemas
│       └── scan.ts          # scanRequestSchema, ScanResult, Competitor, LedgerEntry
├── tests/                  # Automated Vitest test suites
│   ├── env.test.ts          # Canonical siteUrl & env tests
│   ├── geo.test.ts          # Spatial radius & neighbor calculations
│   ├── mapbox-geocoding.test.ts # Geocoding timeouts and fallbacks
│   ├── scan-contract.test.ts# API request contract validation
│   ├── scoring.test.ts      # Gap Signal math & weight renormalization
│   ├── search-parser.test.ts# Natural language tokenizer tests
│   └── serpapi.test.ts      # Google Maps parameters & country code fallback
├── vitest.config.ts        # Vitest configuration
├── package.json
├── tsconfig.json
└── wrangler.jsonc          # Cloudflare Workers configuration
```

---

## Limitations & Disclaimers

1. **Analytical Heuristic, Not Financial Guarantee**: GapMap calculates market signals based on observable online demand and public competitor footprints. It does not account for offline foot traffic, private commercial lease rates, or supplier agreements.
2. **Current Geographic Focus**: In version `v0`, presets, mock datasets, and geocoding fallbacks are optimized around Indian metropolitan areas and neighborhoods. Live mode can scan global locations where Google Maps and Trends data are available.
3. **Upstream Rate Limiting**: In live mode, requests consume SerpApi search credits. The production API implements a protective sliding-window IP rate limiter (20 scans per hour per IP) to prevent quota exhaustion.

---

## Development & Verification

```bash
# Start local development server
pnpm dev

# Run automated Vitest test suite
pnpm test

# Type check
pnpm typecheck

# Lint with ESLint
pnpm lint

# Production build
pnpm build
```
