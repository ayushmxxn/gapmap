# GapMap

> Local market opportunity and commercial gap analysis scanner. Evaluates local competitor density, customer review sentiment, and search demand trends before opening a business.

---

## Architecture Overview

GapMap is built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind CSS v4, deployed seamlessly on Cloudflare Workers via vinext.

### Domain Map & Codebase Organization

The codebase is organized by strict single-responsibility boundaries:

| Domain | Primary Files / Folders | Responsibility |
| :--- | :--- | :--- |
| **1. UI Components** | `src/components/` | Presentation & user interaction components (Studio, Unified Search, Map, Evidence Sheet, Tables, Charts). |
| **2. API Routes** | `src/app/api/scan/`<br>`src/app/api/health/` | Server endpoints orchestrating rate-limiting, validation, external queries, scoring, and response handling. |
| **3. Business Logic** | `src/lib/scoring.ts`<br>`src/lib/geo.ts`<br>`src/lib/search-parser.ts`<br>`src/lib/location-scope.ts` | Pure deterministic domain calculations: distance metrics, query parsing, city-vs-neighborhood heuristics, and synthesis. |
| **4. SerpApi Integration** | `src/lib/serpapi.ts` | Server-only client for Google Maps, Reviews, and Trends with strict timeout controls, schema validation, and secret sanitization. |
| **5. Scoring** | `src/lib/scoring.ts` | Gap Signal v0 algorithm combining Trends demand (35%), review support (10%), supply saturation (25%), and quality gap (30%). |
| **6. Validation** | `src/app/api/scan/route.ts`<br>`src/lib/scoring.ts`<br>`src/lib/serpapi.ts`<br>`src/lib/env.ts` | Strict runtime validation with Zod on client inputs, external API payloads, and environment variables. |
| **7. Data Types** | `src/lib/scoring.ts`<br>`src/lib/serpapi.ts`<br>`src/lib/categories.ts`<br>`src/store/app.ts` | Strict TypeScript types derived directly from Zod schemas (`ScanResult`, `Competitor`, `MapsPlace`, `AppState`). |
| **8. Shared Utilities** | `src/lib/scan-cache.ts`<br>`src/lib/scan-client.ts`<br>`src/lib/rate-limit.ts`<br>`src/lib/sound.ts`<br>`src/lib/utils.ts` | Multi-tier LRU caching, in-flight request coalescers, sliding-window rate limiting, UI audio synthesis, and styling helpers (`cn`). |
| **9. Configuration** | `src/lib/env.ts`<br>`src/lib/mapbox.ts`<br>`src/lib/mode.ts` | Centralized typed environment schemas, Mapbox tokens, and the offline mock mode toggle. |

---

## Directory Structure

```text
GapMap/
├── public/                 # Static assets (logo, og-image, favicon)
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/            # Server Route Handlers (/api/scan, /api/health)
│   │   ├── globals.css     # Tailwind v4 theme tokens & accessibility utilities
│   │   ├── layout.tsx      # RootLayout with SEO metadata & JSON-LD structured data
│   │   ├── manifest.ts     # Web App Manifest
│   │   ├── page.tsx        # Application entry view
│   │   ├── robots.ts       # Crawlability & search engine directives
│   │   └── sitemap.ts      # Automated XML sitemap
│   ├── components/         # Interactive UI components
│   │   ├── ui/             # Reusable UI primitives (Button)
│   │   ├── business-picker-modal.tsx # Category selection dialog
│   │   ├── competitors-table.tsx     # Filterable competitor table
│   │   ├── discovery-map.tsx         # Mapbox GL local & globe visualizer
│   │   ├── evidence-sheet.tsx        # Slide-over evidence drawer
│   │   ├── liquid-metal-button.tsx   # Metallic GPU shader action button
│   │   ├── map-wrapper.tsx           # Dynamic client-boundary wrapper for map
│   │   ├── providers.tsx             # Theme, sound, and React Query providers
│   │   ├── scan-studio.tsx           # Main workspace coordinating scan states
│   │   ├── shortcut-pill.tsx         # Category filter pill
│   │   ├── signal-hero.tsx           # Score summary card
│   │   ├── sound-provider.tsx        # Audio feedback state
│   │   ├── theme-toggle.tsx          # Light/Dark mode switcher
│   │   ├── themes-list.tsx           # Customer review themes list
│   │   ├── trend-chart.tsx           # Recharts interest timeline
│   │   └── unified-search.tsx        # Single natural-language search bar
│   ├── lib/                # Core domain, clients, & server services
│   │   ├── categories.ts        # Category definitions & search term presets
│   │   ├── env.ts               # Zod-validated environment config
│   │   ├── geo.ts               # Geospatial calculations (Turf)
│   │   ├── location-scope.ts    # Scope detection (city vs neighborhood)
│   │   ├── mapbox-geocoding.ts  # Mapbox forward & reverse geocoding
│   │   ├── mapbox.ts            # Mapbox token & style constants
│   │   ├── mock.ts              # Deterministic mock scan generator
│   │   ├── mode.ts              # Mock-first mode switch
│   │   ├── query-client.ts      # TanStack Query client configuration
│   │   ├── rate-limit.ts        # Zero-allocation sliding-window rate limiter
│   │   ├── result-utils.ts      # Synthesis & formatting helpers
│   │   ├── scan-cache.ts        # Multi-tier LRU cache & request coalescer
│   │   ├── scan-client.ts       # Client API client with cache & timeout handling
│   │   ├── scoring.ts           # Gap Signal v0 algorithm & Zod schemas
│   │   ├── search-parser.ts     # Natural language query parser
│   │   ├── serpapi.ts           # Server-only hardened SerpApi client
│   │   ├── sound.ts             # Web Audio API sound synthesizers
│   │   ├── supabase/            # Supabase browser & server clients
│   │   └── utils.ts             # Styling utility (cn)
│   └── store/              # Global state
│       └── app.ts           # Zustand store for workspace UI state
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
