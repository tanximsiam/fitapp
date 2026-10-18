# FitApp

An open-source, watch-centred health website. FitApp brings the activity, sleep and heart-rate data recorded by a watch together with the things a watch can't measure (mood, meals, water, periods and symptoms) and explains what the combined records show, with every calculation visible.

- **Watch first.** Overview, Activity (steps, distance, active energy, workouts), Sleep (duration, schedule, stages), Heart rate (latest reading, daily readings, resting trend) and a Watch & sync page with device, capabilities and freshness.
- **Personal trackers.** Mood check-ins (mood, energy, emotions, self-reported stress, notes), meals with foods and optional nutrition values you enter, water, and an optional cycle tracker.
- **Explainable wellbeing overview.** Rule-based observations with their calculation, period, counts and links to the records, and explicit "not enough data" states. No AI service, scores, diagnoses or predictions.
- **Works without hardware.** A complete simulated-watch demo runs entirely in the browser. A Laravel backend stores real data, and any provider or bridge can feed it through a documented ingestion API.

![Overview on desktop](docs/screenshots/desktop-overview.png)

| | | |
| --- | --- | --- |
| ![Wellbeing overview](docs/screenshots/desktop-wellbeing.png) | ![Activity](docs/screenshots/desktop-activity.png) | ![Sleep](docs/screenshots/desktop-sleep.png) |
| ![Heart rate](docs/screenshots/desktop-heart-rate.png) | ![Watch & sync](docs/screenshots/desktop-device.png) | ![Timeline](docs/screenshots/desktop-timeline.png) |
| ![Mood](docs/screenshots/desktop-mood.png) | ![Food & drink](docs/screenshots/desktop-food.png) | ![Cycle](docs/screenshots/desktop-cycle.png) |

<p>
  <img src="docs/screenshots/mobile-overview.png" width="200" alt="Overview on a phone" />
  <img src="docs/screenshots/mobile-sleep.png" width="200" alt="Sleep on a phone" />
  <img src="docs/screenshots/mobile-quick-log.png" width="200" alt="Quick log on a phone" />
</p>

Screenshots are from the demo. All values in them are simulated.

## What works and what is tested

| Area | Status |
| --- | --- |
| Demo mode (simulated watch, journal fixtures, local edits, Reset demo) | Works offline in the browser; unit-tested and checked in Chromium at phone and desktop sizes |
| FitApp backend: auth, fitness read API, journal CRUD, ingestion | Implemented; 31 feature tests; checked end to end against a local server with `curl` and the website |
| Ingestion of a third-party source | Contract implemented and tested with representative payloads (`docs/examples/ingest-sample.json` and a 30-day generated payload) |
| A real watch or vendor cloud | **Not tested.** No physical device or vendor account was used |
| Zepp cloud integration | **Not implemented.** Requires approved Zepp Open Platform credentials; see [docs/integration.md](docs/integration.md#zepp) |

## Repository layout

```
frontend-fitapp/   Vue 3 + TypeScript + Ionic + Tailwind 4 + Pinia website
  src/views/       screens            src/components/  presentation, charts, forms
  src/stores/      shared state       src/composables/ reusable behaviour
  src/api/         HTTP + payload normalisation
  src/data/        demo generators, adapters, derivations (cycle, journal)
  src/insights/    wellbeing rules     src/types/       data contracts
backend-fitapp/    Laravel 12 + Sanctum API (thin controllers, form requests, services, resources)
docs/openapi.yaml  API contract        docs/integration.md  connecting a data source
```

## Run the demo (no backend)

Requires Node 20+.

```bash
cd frontend-fitapp
npm ci
npm run dev
```

Open the printed URL (Vite's default is http://localhost:5173). Without `VITE_BACKEND_URI` the site runs in demo mode: no login and no network calls. Demo changes (entries, goals, tracker choices, simulated connection state) are kept in this browser's `localStorage` until **Settings → Reset demo**.

## Run the full stack

Requires PHP 8.2+ with SQLite, Composer, and Node 20+.

**Backend**

```bash
cd backend-fitapp
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
php artisan fitapp:create-user you@example.com --name="Your name"   # prompts for a password
php artisan serve                                                     # http://localhost:8000
```

`FRONTEND_ORIGINS` in `.env` lists the website origins allowed by CORS (default `http://localhost:8100,http://localhost:5173`).

**Frontend**

```bash
cd frontend-fitapp
cp .env.example .env
# set VITE_BACKEND_URI=http://localhost:8000
npm ci
npm run dev
```

Sign in with the account you created. Settings lets you switch between the demo and your backend.

**Send some data**

```bash
cd backend-fitapp
TOKEN=$(php artisan fitapp:ingest-token you@example.com --name=try | tail -1)
curl -X POST http://localhost:8000/api/ingest \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -H "Accept: application/json" \
  --data @../docs/examples/ingest-sample.json
```

For 30 realistic days, generate a payload from the demo generator with `npx vite-node scripts/demo-payload.ts > /tmp/demo.json` (in `frontend-fitapp`) and post that instead. It is labelled as FitApp sample data.

## API

- Contract: [`docs/openapi.yaml`](docs/openapi.yaml) (OpenAPI 3.1). Open it in any OpenAPI viewer.
- Website endpoints use a token from `POST /api/login` (`app` ability): `/api/user`, `/api/fitness/days`, `/api/fitness/heart-rate/{date}`, `/api/fitness/status`, `/api/journal/{mood,meals,hydration,cycle-days}`, `/api/ingest-tokens`.
- Sources use an ingest-only token: `POST /api/ingest`.
- Units: metres, kilocalories (active energy only), minutes, bpm, millilitres. Local calendar dates are `YYYY-MM-DD`; instants carry an offset, are stored in UTC and returned in the user's timezone. Missing values are `null`.
- Journal edits may send the `updated_at` they last saw; if the record changed since, the API answers `409` instead of overwriting it. Notes are encrypted at rest.

How to connect your own provider or bridge, including field mapping and the Zepp situation: **[docs/integration.md](docs/integration.md)**.

## Tests

```bash
cd backend-fitapp && php artisan test          # auth, ownership, ingestion, journal, dates
cd frontend-fitapp && npx vitest run            # demo data, adapters, cycle, insights, components
cd frontend-fitapp && npm run build             # type-check (vue-tsc) and production build
```

GitHub Actions runs all three on every push and pull request (`.github/workflows/ci.yml`).

## Host the demo for free

The demo is a static site; build it without `VITE_BACKEND_URI`.

- **GitHub Pages:** enable *Settings → Pages → Source: GitHub Actions*, then run the **Deploy demo to GitHub Pages** workflow. It builds with `VITE_BASE=/<repository>/` and adds a `404.html` fallback for deep links.
- **Netlify or Cloudflare Pages:** base directory `frontend-fitapp`, build command `npm ci && npm run build`, output directory `dist`. `public/_redirects` already provides the single-page-app fallback.

## Self-host the backend

Any host with PHP 8.2+ works (a small VPS, or a PaaS that runs Laravel). In production:

1. Set `APP_ENV=production`, `APP_DEBUG=false`, a generated `APP_KEY` (keep it: it also encrypts notes), `APP_URL`, and `FRONTEND_ORIGINS` to your website's origin.
2. Use SQLite or point `DB_*` to MySQL/PostgreSQL, then run `php artisan migrate --force`.
3. Serve `backend-fitapp/public` over HTTPS behind Nginx/Apache (or `php artisan serve` only for testing).
4. Build the website with `VITE_BACKEND_URI=https://your-api.example` and host `frontend-fitapp/dist` anywhere static.
5. Create accounts with `php artisan fitapp:create-user`. There is no public sign-up.

Keep provider credentials on the server side of your bridge; the website never needs them.

## Limitations

- No real watch, vendor account or Zepp credentials were available; device connectivity is demonstrated only by the simulation.
- The ingestion contract carries steps, distance, active energy and minutes, workouts, sleep (with stages and score), resting heart rate and heart-rate readings. Watch-measured stress, SpO₂ and skin temperature are not part of it yet.
- Food energy and nutrients are only what the user enters; there is no food database.
- The wellbeing overview describes co-occurrence in the user's own records. It is not medical advice, and the cycle tracker makes no predictions.
- Single-user accounts created on the server; no password reset or self-service sign-up.

## License

[MIT](LICENSE)
