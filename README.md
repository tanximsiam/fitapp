<p><img src="brand/svg/fitapp-logo-primary.svg" alt="FitApp" height="56" /></p>

# FitApp

FitApp is a personal open-source health tracking project by Tanzim Siam. It is part of a bigger personal portfolio project that covers the whole path from brand and logo design through UI/UX to app development. FitApp is not a commercial product or a market brand.

FitApp brings the activity, sleep and heart-rate data recorded by a wearable together with the things a wearable can't measure (mood, meals, water, periods and symptoms) and explains what the combined records show, with every calculation visible. It has two clients on one backend:

- **The mobile app** ([`app/`](app/), Ionic + Capacitor for Android and iOS) is where everything is entered: journal entries, goals and trackers. It connects the watch and Health Connect or HealthKit, works offline and syncs when back online. See [app/README.md](app/README.md).
- **The web dashboard** ([`frontend-fitapp/`](frontend-fitapp/)) is read-only: the same records on a large screen for reading trends. Its settings cover only sign-in, the data source and the theme.

- **Watch first.** A dashboard overview (today's goals as donuts, a month calendar, your journal and a widget per measurement), Activity (steps, distance, active energy, workouts), Sleep (duration, schedule, stages), Heart rate (latest reading, daily readings, resting trend), Stress (watch estimate, 0–100 with zones), Blood oxygen (overnight SpO₂), Skin temperature (nightly deviation from baseline) and a Watch & sync page with device, capabilities and freshness.
- **Personal trackers.** Mood check-ins (mood, energy, emotions, self-reported stress, notes), meals, water and an optional cycle tracker, logged in the mobile app and shown on both clients. Meal nutrients are estimated from a built-in food list from the food, amount and unit you pick, or typed in yourself; estimates are labelled as such.
- **Explainable wellbeing overview.** Rule-based observations with their calculation, period, counts and links to the records, and explicit "not enough data" states. No AI service, scores, diagnoses or predictions.
- **Personal AI coach.** A weekly health score out of 100, built from published guidelines on what FitApp collects (WHO activity minutes, daily steps, 7 to 9 hours of sleep, sleep regularity, resting heart rate and water), shown as the Insights hero with a summary and one tip to raise it; a personal daily quote, a short reaction to every entry, and insights that connect areas. Text comes from an AI service on your own server (Groq, `openai/gpt-oss-20b` by default); it sees numbers and categories, never notes, and the app falls back to built-in wording without it.
- **Open data path.** Watches share through Health Connect or Apple Health, the phone app uploads to one documented API, and anything else you build can use the same API with a signed-in token. See [docs/integration.md](docs/integration.md).
- **Works without hardware.** A complete simulated-watch demo with six months of history runs entirely in the browser.

### Mobile app

<p>
  <img src="docs/screenshots/app/01-welcome.png" width="180" alt="Welcome" />
  <img src="docs/screenshots/app/05-setup-watch.png" width="180" alt="Setup: which watch" />
  <img src="docs/screenshots/app/08-home.png" width="180" alt="Home" />
  <img src="docs/screenshots/app/10-activity.png" width="180" alt="Activity" />
</p>
<p>
  <img src="docs/screenshots/app/15-hydration.png" width="180" alt="Hydration" />
  <img src="docs/screenshots/app/24-log-workout.png" width="180" alt="Logging a workout" />
  <img src="docs/screenshots/app/30-home-dark.png" width="180" alt="Home, dark" />
  <img src="docs/screenshots/app/31-activity-dark.png" width="180" alt="Activity, dark" />
</p>

| Goals | Activity hero | Water per day |
| --- | --- | --- |
| ![Today's goals](docs/screenshots/components/goals-card.png) | ![Activity hero](docs/screenshots/components/hero-activity.png) | ![Water per day](docs/screenshots/components/chart-water-per-day.png) |

### Web dashboard

![Overview on desktop](docs/screenshots/desktop-overview.png)

| | | |
| --- | --- | --- |
| ![Overview, dark](docs/screenshots/desktop-overview-dark.png) | ![Activity](docs/screenshots/desktop-activity.png) | ![Sleep](docs/screenshots/desktop-sleep.png) |
| ![Hydration](docs/screenshots/desktop-hydration.png) | ![Heart rate](docs/screenshots/desktop-heart-rate.png) | ![Timeline](docs/screenshots/desktop-timeline.png) |
| ![Stress](docs/screenshots/desktop-stress.png) | ![Blood oxygen](docs/screenshots/desktop-blood-oxygen.png) | ![Skin temperature](docs/screenshots/desktop-skin-temperature.png) |
| ![Mood](docs/screenshots/desktop-mood.png) | ![Food](docs/screenshots/desktop-food.png) | ![Cycle](docs/screenshots/desktop-cycle.png) |

Every screen and component, in light and dark: **[the screenshots branch](https://github.com/tanximsiam/fitapp/tree/screenshots/docs/screenshots)**.

Screenshots are from the demo. All values in them are simulated.

## What works and what is tested

| Area | Status |
| --- | --- |
| Demo mode (simulated watch and journal fixtures) | Works offline in the browser; unit-tested and checked in Chromium at phone and desktop sizes |
| FitApp backend: auth, fitness read API, journal CRUD, ingestion | Implemented; feature tests; checked end to end against a local server with `curl` and the website |
| Uploads from the phone (`POST /api/ingest`) | Contract implemented and tested with representative payloads (`docs/examples/ingest-sample.json` and a 30-day generated payload) |
| A real device | **Not tested.** No physical device was used |

## Repository layout

```
app/               mobile app: Ionic Vue 3 + Capacitor (Android, iOS), offline cache and outbox, watch and health sources
frontend-fitapp/   read-only web dashboard: Vue 3 + TypeScript + Ionic + Tailwind 4 + Pinia
  src/views/       screens            src/components/  presentation, charts
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

Open the printed URL (Vite's default is http://localhost:5173). Without `VITE_BACKEND_URI` the site runs in demo mode: no login and no network calls. The dashboard only displays data; to try logging entries, run the mobile app's demo (see [app/README.md](app/README.md)).

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

Sign in with the account you created.

**Send some data**

```bash
cd backend-fitapp
TOKEN=$(curl -s -X POST http://localhost:8000/api/login -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"email":"you@example.com","password":"your-password"}' | php -r 'echo json_decode(stream_get_contents(STDIN))->data->token;')
curl -X POST http://localhost:8000/api/ingest \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -H "Accept: application/json" \
  --data @../docs/examples/ingest-sample.json
```

For realistic data, generate payloads from the demo generator (in `frontend-fitapp`) and post each one: `npx vite-node scripts/demo-payload.ts 30 0 > /tmp/demo.json` gives the last 30 days; `30 30`, `30 60`, … go further back (one request holds about 30 days). It is labelled as FitApp sample data.

## API

- Contract: [`docs/openapi.yaml`](docs/openapi.yaml) (OpenAPI 3.1). Open it in any OpenAPI viewer.
- Website endpoints use a token from `POST /api/login` (`app` ability): `/api/user`, `/api/fitness/days`, `/api/fitness/heart-rate/{date}`, `/api/fitness/status`, `/api/journal/{mood,meals,hydration,cycle-days}`, and `POST /api/ingest` for uploads from the phone.
- Units: metres, kilocalories (active energy only), minutes, bpm, millilitres. Local calendar dates are `YYYY-MM-DD`; instants carry an offset, are stored in UTC and returned in the user's timezone. Missing values are `null`.
- Journal edits may send the `updated_at` they last saw; if the record changed since, the API answers `409` instead of overwriting it. Notes are encrypted at rest.

How watch data reaches FitApp, including field mapping: **[docs/integration.md](docs/integration.md)**.

## Tests

```bash
cd backend-fitapp && php artisan test          # auth, ownership, ingestion, journal, dates
cd frontend-fitapp && npx vitest run            # demo data, adapters, cycle, insights, food list, components
cd frontend-fitapp && npm run build             # type-check (vue-tsc) and production build
cd app && npx vue-tsc --noEmit && npx vitest run # mobile app: type-check and unit tests
cd app && npm run test:contract                  # mobile API client against a real backend (start scripts/contract-backend.sh first)
```

GitHub Actions runs the backend, web and mobile checks and an Android debug build on every push and pull request (`.github/workflows/ci.yml`).

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

## Limitations

- No physical device has been connected yet. Data so far comes from the simulated watch and representative ingestion payloads.
- Stress, SpO₂ and skin temperature are shown as recorded; FitApp does not flag or interpret them medically.
- The ingestion contract carries steps, distance, active energy and minutes, workouts, sleep (with stages and score), resting heart rate, heart-rate readings, watch-estimated stress, SpO₂ readings and nightly skin-temperature deviation. HRV is not part of it yet.
- Food nutrients come from a built-in list of about 60 common foods with typical values per 100 g (rounded from USDA FoodData Central). They are estimates: real food varies by recipe, brand and portion. Foods outside the list have only the values the user types.
- The wellbeing overview describes co-occurrence in the user's own records. It is not medical advice, and the cycle tracker makes no predictions.
- Accounts: sign-up with email and password in the mobile app (can be turned off with `FITAPP_REGISTRATION=false`), and Google sign-in once you add your own Google client ([docs/google-sign-in.md](docs/google-sign-in.md)). No password reset yet.

## Credits

- FitApp logo: design direction 01, in [`brand/`](brand/) (SVG and PNG lockups, symbol, app icon, favicons and the usage guidelines PDF). The wordmark is Rubik Bold converted to outlines (SIL Open Font License 1.1).
- Animated mood faces: ["Simple animating emotions"](https://codepen.io/MishaHahaha/pen/grzLJy) by Misha Heesakkers (MIT, as a public CodePen pen); the "Low" face is drawn in the same style.
- Typical food values: rounded from [USDA FoodData Central](https://fdc.nal.usda.gov/) (public domain).
- Icons: [Ionicons](https://ionic.io/ionicons) (MIT).

## License and use

The code is open source under the [Apache License 2.0](LICENSE). You can use it, change it and build any project with it, including production and commercial apps, as long as you give credit:

- Keep the [NOTICE](NOTICE) file with your copy or distribution.
- Credit the project visibly, for example "Based on FitApp by Tanzim Siam".

The FitApp name, logo, app icon, everything in [`brand/`](brand/), the screenshots and other original images are **not** covered by the code licence. They are the author's intellectual property, all rights reserved. A fork must use its own name and replace the logo and icons. See [TRADEMARKS.md](TRADEMARKS.md).

Third-party parts keep their own licences (see Credits and [NOTICE](NOTICE)).
