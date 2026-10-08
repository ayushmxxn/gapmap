<img src="./public/logo.png" alt="GapMap Logo" width="80" />

# GapMap

A market opportunity scanner that finds underserved business gaps using local competition, search trends, and customer reviews.

[Live Demo](https://gapmap.ayushmxxn.workers.dev)

## What it does

GapMap helps entrepreneurs and operators evaluate local market demand before opening a business.

Instead of guessing where to open a cafe, clinic, or gym, GapMap analyzes nearby competitors, review sentiment, and search interest for any neighborhood. It summarizes the findings into an intuitive Gap Signal so you can see where supply is falling short of demand.

## How it works

1. **Choose a business and location**: Search for a category (like specialty coffee or fitness studios) and a target area.
2. **Gather market signals**: GapMap checks nearby competitors, review complaints, and search demand trends.
3. **Get a Gap Signal**: Those signals are combined into a score from 0 to 100 indicating how underserved the market is.

## Getting started

GapMap runs in mock mode by default, so you can explore the entire app locally without any API keys:

```bash
git clone https://github.com/ayushmxxn/gapmap.git
cd gapmap
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Live data

Mock mode works out of the box with deterministic sample data. To connect live Google Maps, reviews, and Google Trends data:

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your keys in `.env.local`:
   ```env
   # Server-only secret for Google Maps, Reviews, and Trends queries
   SERPAPI_KEY=your_serpapi_key

   # Public client configuration for browser map rendering
   NEXT_PUBLIC_USE_MOCK=false
   NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token
   ```

`SERPAPI_KEY` stays on the server and is never exposed to the browser. `NEXT_PUBLIC_MAPBOX_TOKEN` is a public Mapbox token used directly by the client to render maps.

## How the Gap Signal works

The Gap Signal (0–100) weighs four core market factors:

- **Demand (35%)**: Measures 12-month search interest trajectory and growth trends to see if interest in the category is expanding.
- **Customer experience (30%)**: Spots unmet customer satisfaction using low competitor ratings (< 4.0★) and recurring complaints in customer reviews.
- **Competition (25%)**: Evaluates competitor count, density, and spatial spread across the area. Fewer nearby competitors yields a higher Gap Signal.
- **Review volume (10%)**: Measures total review activity to evaluate overall market engagement and transaction volume.

If search trends are unavailable for a specific location, weights are automatically renormalized across the remaining factors.

Scores map to three clear verdicts:
- **75–100 (Strong opportunity)**: High demand, low competition, or clear customer dissatisfaction with current options.
- **50–74 (Good opportunity)**: Balanced market with steady demand and existing competitors.
- **0–49 (Low opportunity)**: Saturated market with dominant incumbents or declining search interest.

## Tech stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Maps & Geo**: Mapbox GL, react-map-gl, Turf.js
- **Charts**: Recharts
- **State**: Zustand
- **Data**: SerpApi (Google Maps, Reviews, Trends)
- **Deployment**: Cloudflare Workers (vinext)
- **Testing**: Vitest

## Project structure

```text
├── public/          # Static assets and icons
├── src/
│   ├── app/         # App Router pages and API routes (/api/scan)
│   ├── components/  # Map, charts, search, and UI components
│   ├── hooks/       # Custom React hooks
│   ├── lib/         # Scoring algorithms, geocoding, and data clients
│   ├── store/       # Zustand UI state
│   └── types/       # TypeScript types and Zod schemas
└── tests/           # Unit and integration test suites
```

## Limitations

- **Online signals only**: GapMap analyzes online search interest and public competitor footprints. It does not measure pedestrian foot traffic, commercial lease costs, or private sales data.
- **Geographic focus**: Built-in presets and mock data are centered on Indian metropolitan areas, though live mode works wherever Google Maps and Trends data are available.
- **API rate limits**: Live scans use SerpApi credits and include built-in rate limiting to prevent quota exhaustion.

## Development

```bash
# Start development server
pnpm dev

# Run test suite
pnpm test

# Type check
pnpm typecheck

# Lint code
pnpm lint

# Build for production
pnpm build
```
