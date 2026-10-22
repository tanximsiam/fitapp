# FitApp web dashboard

The read-only web client for FitApp: watch data and the journal on a large screen, for reading trends. Everything is entered in the mobile app ([`../app`](../app)); the dashboard's settings cover only sign-in, the data source and the theme.

Vue 3 + TypeScript, Ionic, Tailwind CSS 4, Pinia and Vite. Charts are hand-written SVG components; there is no chart library.

## Run the demo

Requires Node 20+.

```bash
npm ci
npm run dev        # http://localhost:5173
```

Without `VITE_BACKEND_URI` the site runs in demo mode: a simulated FitApp watch and journal generated in the browser, no sign-in and no network calls. It looks like a real account on purpose; every value in it is simulated.

## Connect to a backend

```bash
cp .env.example .env
# VITE_BACKEND_URI=http://localhost:8000
npm run dev
```

Start the backend first ([`../backend-fitapp`](../backend-fitapp/README.md)) and add the dashboard's origin to its `FRONTEND_ORIGINS`. Sign in with an account created there.

| Variable | What it does |
| --- | --- |
| `VITE_BACKEND_URI` | URL of the FitApp API. Empty builds the browser-only demo. |
| `VITE_BASE` | Base path when hosted in a subfolder, e.g. `/fitapp/` on GitHub Pages. |

## Pages

| Group | Pages |
| --- | --- |
| Watch | Overview, Insights, Activity, Sleep, Heart rate, Stress, Blood oxygen, Skin temperature |
| Journal | Timeline, Mood, Food, Hydration, Cycle |
| Outside the sidebar | Watch & sync (the watch button, top right), Settings (the profile menu, bottom left), Sign in |

The overview hero has the AI coach's daily reminder and today's goals as donuts, then a month calendar, the journal and one widget per measurement. Insights leads with the weekly health score and the coach's summary and tip, then the coach's cross-area insights, its note on your latest entry, the rule-based observations and data coverage. Without an AI server the same places use built-in wording. Each module page has its own hero in that module's colour and a grid of focused widgets. Charts follow the 7/14/30-day range switch; the calendar button picks the day.

## Code layout

```
src/views/        one file per page
src/components/   shell, heroes, widget cards, calendar; charts/ holds the SVG charts
src/stores/       Pinia: auth, mode (demo or backend), fitness, journal
src/composables/  data loading, theme, element size, count-up
src/api/          axios client and payload normalisation
src/data/         demo generators, adapters, derived values (cycle, journal, food list)
src/insights/     the rule-based wellbeing overview
src/lib/          date and number formatting
scripts/          demo-payload.ts: sample upload payloads for a real backend
```

Layout uses container queries (`@container`), so widgets respond to the space left beside the sidebar, not the window width. Colours are CSS tokens with light and dark themes; each metric has one data colour.

## Scripts

```bash
npm run dev          # dev server
npm run build        # type-check (vue-tsc) and production build into dist/
npx vitest run       # unit tests: demo data, adapters, cycle, insights, food list, components
npm run lint         # eslint with --fix
npx vite-node scripts/demo-payload.ts 30 0 > /tmp/demo.json   # 30 days of sample uploads
```

## Deploy

The build is a static site in `dist/`.

- **GitHub Pages:** the **Deploy demo to GitHub Pages** workflow builds the demo with `VITE_BASE=/<repository>/` and adds a `404.html` fallback.
- **Netlify or Cloudflare Pages:** base directory `frontend-fitapp`, build command `npm ci && npm run build`, output `dist`. `public/_redirects` provides the single-page-app fallback.
- **With your backend:** build with `VITE_BACKEND_URI=https://your-api.example` and host `dist/` anywhere static.

Licence, credits and the brand terms are in the [root README](../README.md#license-and-use).
