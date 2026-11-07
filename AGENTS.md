# How this repo is built

AnonCafe — an anonymous worry box (解忧杂货铺).

## Stack
- React 18 + TypeScript + Vite (frontend)
- Supabase (Postgres + Row Level Security) for data and access-code auth
- Vercel serverless functions in `api/` (reply emails)
- i18next for translations
- Vitest (unit) + Playwright (e2e)

## Commands
- `npm run dev` — dev server on :3000
- `npm run build` — type-check + build
- `npm run type-check` — tsc (app + api)
- `npm run lint` — ESLint
- `npm test` — Vitest
- `npm run test:e2e` — Playwright (needs `npx playwright install chromium`)

## Layout
- `src/` — components, context, lib
- `api/` — Vercel functions
- `supabase/migrations` — DB schema
- `e2e/` — Playwright specs
- `scripts/` — build / migration / verification helpers

## Rules that matter
- Server secrets only in non-`VITE_` env vars. `VITE_*` ships to the browser.
- `.husky/pre-push` runs `scripts/gates-push.mjs` (mirrors CI) — a green push is a green CI.
