# GapMap — Agent Rules

## Stack
Next.js 16 (App Router) + React 19 + TS + Tailwind v4 + shadcn/new-york +
Hugeicons Free (never Lucide) + Geist + Mapbox GL / react-map-gl / Turf +
SerpApi + Zustand + Zod + Motion +
Recharts + pnpm + Cloudflare Workers (vinext).

## Rules
- Free-only. No paid APIs, auth providers, Redis, Inngest, Sentry, or extra deps without approval.
- Mock-first: `NEXT_PUBLIC_USE_MOCK=true` default. No network without keys. Use `src/lib/mode.ts`, `src/lib/mock.ts`.
- Env: client `NEXT_PUBLIC_*` in `src/lib/env.ts` (Zod); server-only `SERPAPI_KEY` never leaves server. Never commit `.env.local`.
- Types: strict TS, no `any`. Validate boundaries with Zod. Server components by default; `"use client"` only for interactivity.
- UI: shadcn in `src/components/ui`, `cn()` from `@/lib/utils`, Tailwind v4 tokens in `globals.css`. Icons via `@hugeicons/react` + `@hugeicons/core-free-icons`.
- Data: Global UI state in `src/store/app.ts` (Zustand); client API via `src/lib/scan-client.ts`. Forms: Controlled inputs + Zod.
- Maps: Mapbox config in `src/lib/mapbox.ts`; Turf for geo math. No token = no map render.
- SerpApi: `src/lib/serpapi.ts` server-only stub. No live calls yet.
- Workers: `vite.config.ts` + `wrangler.jsonc` are vinext-managed. Keep `next dev/build` working. Worker cmds: `dev:vinext`, `build:vinext`, `deploy`.
- Verify: `pnpm lint`, `pnpm typecheck`, `pnpm build` must pass.

## Layout
`src/app/` routes · `src/components/` + `ui/` · `src/lib/` clients/config ·
`src/store/` · `src/hooks/` (only when shared) · `public/`.
