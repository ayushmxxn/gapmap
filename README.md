<p align="center">
  <img src="./public/logo.png" alt="GapMap Logo" width="80" />
</p>

<h1 align="center">GapMap</h1>

<p align="center">
  <strong>Local market opportunity and commercial gap analysis scanner.</strong><br>
  Evaluates local competitor density, customer review sentiment, and search demand trends before opening a business.
</p>

---

## Architecture Overview

GapMap is built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS v4, deployed seamlessly on Cloudflare Workers via vinext.

### Domain Map & Codebase Organization

The codebase is organized by strict single-responsibility boundaries:

| Domain | Primary Files / Folders | Responsibility |
| :--- | :--- | :--- |
| **1. UI Components** | `src/components/` | Presentation & user interaction components (Studio, Unified Search, Map, Evidence Sheet, Tables, Charts). |
| **2. API Routes** | `src/app/api/scan/`<br>`src/app/api/health/` | Thin HTTP controllers orchestrating rate-limiting, request validation, and status mapping. |
| **3. Domain Services** | `src/lib/services/scan-pipeline.ts` | Complete scan orchestration, review target sampling, parallel data queries, and synthesis. |
| **4. SerpApi Integration** | `src/lib/serpapi.ts` | Server-only client for Google Maps, Reviews, and Trends with strict timeout controls and secret sanitization. |
| **5. Scoring Algorithm** | `src/lib/scoring.ts` | Pure Gap Signal v0 calculation functions (Trend demand, review support, supply saturation, quality gap). |
| **6. Custom Hooks** | `src/hooks/` | Reusable UI behavior hooks (`use-overlay.ts` for accessibility, `use-place-autocomplete.ts` for geocoding). |
| **7. Data Contracts & Types** | `src/types/scan.ts`<br>`src/lib/places.ts`<br>`src/store/app.ts` | Strict domain models and Zod schemas (`ScanResult`, `Competitor`, `KnownPlace`, `AppState`). |
| **8. Shared Utilities** | `src/lib/scan-cache.ts`<br>`src/lib/scan-client.ts`<br>`src/lib/rate-limit.ts`<br>`src/lib/map-utils.ts`<br>`src/lib/sound.ts` | Multi-tier LRU caching, in-flight request coalescers, sliding-window rate limiting, and camera trigonometry. |
| **9. Configuration** | `src/lib/env.ts`<br>`src/lib/mapbox.ts`<br>`src/lib/mode.ts` | Centralized typed environment schemas, Mapbox tokens, and the offline mock mode toggle. |

---

## Directory Structure

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
│   │   ├── shortcut-pill.tsx         # Category filter pill
│   │   ├── signal-hero.tsx           # Score summary card
│   │   ├── sound-provider.tsx        # Audio feedback state
│   │   ├── theme-toggle.tsx          # Light/Dark mode switcher
│   │   ├── themes-list.tsx           # Customer review themes list
│   │   ├── trend-chart.tsx           # Recharts interest timeline
│   │   └── unified-search.tsx        # Natural-language search bar with autocomplete
│   ├── hooks/              # Reusable UI hooks
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
│   ├── store/              # Global state
│   │   └── app.ts           # Zustand store for workspace UI state
│   └── types/              # Domain data models & Zod schemas
│       └── scan.ts          # ScanResult, Competitor, LedgerEntry, GapSignal types
├── AGENTS.md               # Agent guidelines and architectural constraints
├── package.json
├── tsconfig.json
└── wrangler.jsonc          # Cloudflare Workers configuration
```

---

## Development & Verification

```bash
# Start Next.js local development server (http://localhost:3000)
pnpm dev

# Type check
pnpm typecheck

# Lint with ESLint
pnpm lint

# Production build
pnpm build
```
