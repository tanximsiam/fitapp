# FitApp backend

Laravel 12 + Sanctum API for FitApp. Both clients use it: the mobile app ([`../app`](../app)) reads and writes, the web dashboard ([`../frontend-fitapp`](../frontend-fitapp)) only reads. It stores watch data uploaded by the phone, the journal entered in the app, and serves the AI coach's text.

- API contract: [`docs/openapi.yaml`](../docs/openapi.yaml) (OpenAPI 3.1)
- Connecting a data source: [`docs/integration.md`](../docs/integration.md)
- Google sign-in: [`docs/google-sign-in.md`](../docs/google-sign-in.md)

## Requirements

PHP 8.2+ with the SQLite extension (or MySQL/PostgreSQL) and Composer.

## Run locally

```bash
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
php artisan fitapp:create-user you@example.com --name="Your name"   # prompts for a password
php artisan serve                                                     # http://localhost:8000
```

Point the web dashboard at it with `VITE_BACKEND_URI=http://localhost:8000` in `frontend-fitapp/.env`. To load sample data, see "Send some data" in the [root README](../README.md#run-the-full-stack).

## Configuration

Only the FitApp-specific keys are listed; the rest are standard Laravel.

| Key | Default | What it does |
| --- | --- | --- |
| `APP_KEY` | none | Laravel key. Also encrypts journal notes, so keep it when you move servers. |
| `FRONTEND_ORIGINS` | local dev ports | Comma-separated origins allowed by CORS, and where Google sign-in may return to. |
| `FITAPP_REGISTRATION` | `true` | Allow sign-up from the mobile app. Set `false` to create accounts only with `fitapp:create-user`. |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | empty | Google sign-in; off while empty. |
| `GROQ_API_KEY` | empty | AI coach; off while empty. Keep it on the server only. |
| `GROQ_MODEL` | `openai/gpt-oss-20b` | Any Groq chat model that can reply in JSON mode. |
| `AI_DEMO` | `false` | Let the sample-data demo call the AI without an account (10 requests a minute per address). |

## API at a glance

All routes are under `/api`. Signed-in routes take the token from `POST /login` (`Authorization: Bearer …`, `app` ability).

| Area | Routes |
| --- | --- |
| Accounts | `POST /login`, `POST /register`, `POST /logout`, `GET/PATCH /user`, `GET /auth/providers`, `/auth/google/*` |
| Watch data (read) | `GET /fitness/days`, `GET /fitness/heart-rate/{date}`, `GET /fitness/readings/{stress\|spo2}/{date}`, `GET /fitness/status` |
| Uploads | `POST /ingest`: what the phone reads from the watch, Health Connect or Apple Health |
| Journal | `/journal/{mood,meals,hydration,activities}` (CRUD), `/journal/cycle-days/{date}` (PUT, DELETE) |
| AI coach | `POST /ai/{insights,feedback,coach,quote}`; the same under `/demo/ai/*` when `AI_DEMO=true` |

Units, dates and conflict handling are described in the [root README](../README.md#api) and the OpenAPI file.

## Code layout

```
app/Http/Controllers/   thin controllers (Journal/ holds the journal CRUD)
app/Http/Requests/      validation for every write
app/Http/Resources/     response shapes
app/Services/           IngestionService (upload → tables), FitnessQueryService (reads)
app/Ai/Groq.php         the only call to the model: JSON mode, 12-hour cache, null on any failure
app/Models/             Eloquent models; watch data and journal live in separate tables
routes/api.php          every route; routes/console.php has fitapp:create-user
```

Ingestion never writes journal tables, and the journal never writes watch tables, so a re-upload cannot overwrite what the user entered.

## AI coach: part of this backend, not a separate service

The AI coach stays inside this Laravel app. It is a deliberate choice, not a leftover.

**Why.** The AI part is about 230 lines: four endpoints that validate a small summary, strip private fields, call a hosted model (Groq) over HTTPS and trim the reply. There is no model running here, no GPU, no Python and no long-running job. A separate service would add a second deployment, a service-to-service credential, another hop of latency and another thing to monitor, and it would still need this backend's auth, rate limits and user context. Kept here it reuses Sanctum, Laravel's throttling, cache and logging for free, and self-hosters run one app instead of two.

**What keeps it separable.** All model traffic goes through `App\Ai\Groq`, and `AiController` owns the prompts and the privacy filter. The clients only know the `/api/ai/*` contract and fall back to built-in wording on `503`, so the backend behind those routes can change without touching them.

**When to split it out.** Move it to its own service if any of these become true:

- the model runs on our own hardware (local inference, GPUs, Python ML libraries);
- AI work becomes slow or batch-shaped (embeddings over history, weekly reports for every user) and should scale or fail apart from the API;
- another product needs the same AI without this backend.

At that point keep the `/api/ai/*` routes here as a thin proxy so the apps don't change.

**Privacy.** The apps send aggregates and categories only. `AiController` also drops `note`, `notes`, `name` and `email` at any depth before anything reaches the model, and the answers are habit advice, never diagnoses.

## Tests

```bash
php artisan test
```

Feature tests cover auth and registration, Google sign-in, ownership, ingestion, the journal, the read API, the profile and the AI endpoints (with the model faked). CI runs them on every push (`.github/workflows/ci.yml`).

## Deploy

See [Self-host the backend](../README.md#self-host-the-backend) in the root README. In short: `APP_ENV=production`, `APP_DEBUG=false`, keep `APP_KEY`, set `FRONTEND_ORIGINS`, run `php artisan migrate --force`, and serve `public/` over HTTPS.
