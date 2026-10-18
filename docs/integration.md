# Connecting a watch-data source

FitApp is built around data from a watch. The website never talks to a watch directly. Data reaches it through **FitApp's own ingestion API**, which any provider, exporter or bridge you control can call.

```
 watch ──► vendor app / cloud ──► your bridge or provider integration ──► POST /api/ingest ──► FitApp backend ──► website
                                   (you build or configure this)           (ingest token)        (Laravel)           (Vue)
```

There are three different connections, and FitApp treats them separately:

| Connection | What it is | Status in this repository |
| --- | --- | --- |
| Website → FitApp API | The Vue frontend reads `/api/fitness/*` and `/api/journal/*` with a signed-in user's token. | Implemented and tested. |
| Provider or bridge → FitApp ingestion API | Anything that can send HTTPS JSON uploads data with an **ingest-only** token. | Implemented and tested with representative payloads. No real device has been connected. |
| Provider-specific integration (e.g. Zepp cloud) | Code that authorises with a vendor and receives its data. | **Not implemented.** See [Zepp](#zepp) below. |

A successful upload proves that *a source* reached FitApp. It does not prove which watch recorded the data, and the website never labels it as a verified watch connection.

## 1. Create a token for your source

Sign in to the website, open **Settings → Ingest tokens** and create a token, or on the server:

```bash
php artisan fitapp:ingest-token you@example.com --name=my-bridge
```

Ingest tokens can only call `POST /api/ingest`. They cannot read data.

## 2. Send data

The full contract is in [`openapi.yaml`](openapi.yaml) (`IngestPayload`). A complete example is [`examples/ingest-sample.json`](examples/ingest-sample.json):

```bash
curl -X POST "$FITAPP_URL/api/ingest" \
  -H "Authorization: Bearer $FITAPP_INGEST_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  --data @docs/examples/ingest-sample.json
```

The response reports what was stored:

```json
{ "data": { "source": { "key": "my-bridge", "name": "My export bridge", "device": "Example watch", "measurements": ["steps", "..."], "last_ingested_at": "2026-10-18T07:16:32Z" },
            "received": { "activity_days": 2, "sleep_sessions": 1, "workouts": 1, "resting_heart_rate_days": 1, "heart_rate_samples": 4 } } }
```

Validation errors return `422` with field paths such as `activity.0.steps`; a token without the `ingest` ability gets `403`; uploads are limited to 60 requests per minute.

## 3. Map your source's fields

| Your data | FitApp field | Unit / format | Notes |
| --- | --- | --- | --- |
| Source identity | `source.key`, `source.name` | `key`: `^[a-z0-9][a-z0-9._-]{0,63}$` | Keep `key` stable; it identifies the source for de-duplication. |
| Device and capabilities | `source.device`, `source.measurements[]` | names from the `Measurement` enum | Shown on the **Watch & sync** page. Declare only what the source really provides. |
| Device timezone | `timezone` | IANA name, e.g. `Europe/Berlin` | Used to derive local dates for heart-rate samples. Defaults to the user's timezone. |
| Daily steps, distance, active energy, active minutes | `activity[]` | count, metres, kcal (active only), minutes | One entry per **local** date. Send the cumulative total so far; re-sending replaces it. |
| Workouts | `workouts[]` | instants with offset, kcal, metres, bpm | Keyed by start time; re-sending updates the session. |
| Main sleep | `sleep[]` | `start_at`/`end_at` with offset; stage minutes | `date` is the local date the sleep **ended**. Max 24 h. |
| Resting heart rate | `heart_rate.resting[]` | bpm per local date | |
| Heart-rate readings | `heart_rate.samples[]` | `at` with offset, bpm | Up to 10,000 per request; duplicates of the same instant keep the last value. |

Rules that keep data correct:

- **Missing is `null` or omitted, never `0`.** The website shows gaps as gaps.
- **Instants must include an offset** (`+06:00` or `Z`). They are stored in UTC and shown in the user's timezone.
- **Idempotent.** Activity is keyed by (source, date), sleep and resting heart rate by (source, date), workouts and samples by (source, instant). Uploading the same payload twice, or uploading growing daily totals every 15 minutes, never double-counts.
- **Partial activity updates.** Only activity fields present in an item change; send `null` to clear one.
- **Several sources.** When two sources report the same metric for the same date, the most recently updated record is shown.
- **Personal records are separate.** Ingestion never writes mood, meal, hydration or cycle entries, so a watch upload cannot overwrite something the user typed.

To try the backend with realistic data without a device, generate a payload from the demo generator (it is labelled `fitapp-demo`):

```bash
cd frontend-fitapp
npx vite-node scripts/demo-payload.ts > /tmp/demo.json
```

## Zepp

Zepp has two separate developer offerings:

- **Zepp OS** ([docs.zepp.com](https://docs.zepp.com/)) is for building mini programs that run on the watch. FitApp does not include a watch app.
- **Zepp Thirdparty Open Platform** ([devopen.zepp.com](https://devopen.zepp.com/docs/getting-started/introduction)) is a cloud API. According to its documentation, a partner must register, complete enterprise verification, register an application and be granted data permissions before receiving a client ID and secret. Users then authorise access through OAuth 2.0. Activity is delivered as FIT files that the partner pulls after a notification, and sleep and health summaries are pushed to the partner's callback URL.

FitApp has **no Zepp integration**. Nothing in this repository has been tested against Zepp, and no OAuth flow, webhook receiver or FIT parser is included. The Settings page lists Zepp as "Not configured".

If you have approved credentials, a Zepp bridge would: keep the client secret on a server, run the OAuth flow for your account, receive Zepp's callbacks, convert FIT activity files and summaries into the fields above, and post them to `/api/ingest` with an ingest token. Check Zepp's current documentation for field names, units and delivery details before writing one.
