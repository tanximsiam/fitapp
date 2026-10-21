# How watch data reaches FitApp

FitApp never talks to a watch maker's cloud. The watch's own app (Zepp, Samsung Health, Fitbit, Garmin Connect, …) shares with the phone's health platform, and the FitApp app reads it there and uploads it to the person's account:

```
 watch ──► its own app ──► Health Connect / Apple Health ──► FitApp app ──► POST /api/ingest ──► FitApp backend
                           (the person allows sharing)        (reads)       (signed-in token)
```

The FitApp app walks the person through it during setup: turn on sharing in the watch's app, then allow FitApp to read. Apple Watch data is in Apple Health already. Uploads use the person's normal sign-in token; there is no separate key to create.

A successful upload proves that *a source* reached FitApp. It does not prove which watch recorded the data, and FitApp never labels it as a verified watch connection.

## 1. Uploading from your own code

Anything else (a script, an exporter) can use the same endpoint with a token from `POST /api/login`:

```bash
TOKEN=$(curl -s -X POST "$FITAPP_URL/api/login" -H "Content-Type: application/json" -H "Accept: application/json" \
  -d '{"email":"you@example.com","password":"…","device_name":"my-script"}' | jq -r .data.token)
```

## 2. Send data

The full contract is in [`openapi.yaml`](openapi.yaml) (`IngestPayload`). A complete example is [`examples/ingest-sample.json`](examples/ingest-sample.json):

```bash
curl -X POST "$FITAPP_URL/api/ingest" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  --data @docs/examples/ingest-sample.json
```

The response reports what was stored:

```json
{ "data": { "source": { "key": "my-bridge", "name": "My export bridge", "device": "Example watch", "measurements": ["steps", "..."], "last_ingested_at": "2026-10-18T07:16:32Z" },
            "received": { "activity_days": 2, "sleep_sessions": 1, "workouts": 1, "resting_heart_rate_days": 1, "heart_rate_samples": 4 } } }
```

Validation errors return `422` with field paths such as `activity.0.steps`; a missing or invalid token gets `401`; uploads are limited to 60 requests per minute.

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
| Watch-estimated stress | `stress.samples[]` | `at` with offset, `value` 0–100 | The watch's own estimate. Stress a user reports belongs in mood check-ins, never here. |
| Blood oxygen | `spo2.samples[]` | `at` with offset, `percent` 70–100 | Spot or overnight readings. |
| Skin temperature | `skin_temperature[]` | `date`, `deviation_c` (−5 to 5 °C) | Nightly deviation from the wearer's baseline, not absolute temperature. |

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
