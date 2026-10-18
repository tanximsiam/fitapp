# Connecting Zepp

FitApp includes a complete integration with the **Zepp Thirdparty Open Platform** ([devopen.zepp.com](https://devopen.zepp.com/docs/getting-started/introduction)), the official cloud API for Zepp / Amazfit watch data. It stays switched off until you add your own Zepp credentials to the backend.

> **Status:** built against Zepp's published documentation and covered by tests that use responses shaped like the documented ones. It has **not** been run against a live Zepp account, because this project has no Zepp partner credentials. Expect to verify the first connection yourself (see [Checking the first connection](#checking-the-first-connection)).

This is not the Zepp OS watch SDK ([docs.zepp.com](https://docs.zepp.com/)); FitApp needs no app on the watch.

## How data flows

```
Watch ──Bluetooth──► Zepp app ──► Zepp cloud ──webhooks──► FitApp backend ──► website
                                       ▲                       │
                                       └──── OAuth, pulls ─────┘
```

| Data | How Zepp delivers it | What FitApp stores |
| --- | --- | --- |
| Daily steps, distance, active energy, resting heart rate | `dailies` event pushed to the webhook | activity day + resting heart rate (by `calendarDate`) |
| Sleep (duration, stages, score) | `sleeps` event pushed to the webhook | the night, keyed by the local date it ended |
| Workouts | `activityFiles` ping → FitApp downloads the FIT file from `callbackURL` | workout (type, start/end, distance, kcal, avg/max bpm) |
| Heart-rate readings | `GET /users/-/heartrates` (Zepp: "transitional"), pulled every 30 min | heart-rate samples |
| Blood oxygen (SpO₂) | `pulseOx` event pushed to the webhook (offset → value map) | SpO₂ readings |
| Skin temperature | `skinTemp` event pushed to the webhook (`avgDeviationCelsius`) | nightly deviation from baseline |
| Stress | not offered by the Zepp Open Platform | nothing; Watch & sync lists stress as not provided |
| User revoked access in Zepp | `authorizationChange` event | connection marked revoked, tokens deleted |
| History | `GET /wellness-api/rest/backfill/{sleeps,activities}` (max 30 days) → redelivered via webhooks | as above |

Everything Zepp sends is converted into FitApp's normal [ingestion contract](integration.md) and validated, under the source key `zepp`. Re-deliveries are safe: days, nights and samples are upserted, and activity files are remembered by `summaryId`. HRV, body composition, nutrition and Hybrid Charge events are acknowledged but not stored yet.

## 1. Get Zepp partner access

From Zepp's documentation: create a partner account, complete enterprise verification, register an application in the [Zepp Developer Console](https://console.zepp.com/) and request the data permissions you need (daily summaries, sleep, activity, heart rate). Zepp then issues a **client ID** and **client secret**. Questions go to open-api-support@zepp.com.

## 2. Configure the backend

Zepp needs to reach your backend over **public HTTPS** for the OAuth callback and the webhooks, so deploy it first (see the README's self-hosting section). For local testing you can use a tunnel such as `cloudflared` or `ngrok` and set `APP_URL` to its address.

In `backend-fitapp/.env`:

```dotenv
APP_URL=https://api.your-fitapp.example
FRONTEND_URL=https://your-fitapp.example          # where the browser returns after connecting

ZEPP_CLIENT_ID=your-client-id
ZEPP_CLIENT_SECRET=your-client-secret             # server only; never put it in the frontend
ZEPP_REDIRECT_URI="${APP_URL}/api/zepp/callback"
ZEPP_WEBHOOK_TOKEN=generate-a-long-random-value   # php -r "echo bin2hex(random_bytes(24));"
```

The Zepp endpoints default to the documented hosts (`user.zepp.com`, `auth.zepp.com`, `api-open.zepp.com`); override `ZEPP_AUTHORIZE_URL`, `ZEPP_TOKEN_URL`, `ZEPP_REFRESH_URL` or `ZEPP_API_BASE` only if Zepp gives you different ones.

Then run the migrations, a queue worker (activity files are downloaded in the background) and the scheduler (heart-rate pulls and token refresh):

```bash
php artisan migrate --force
php artisan queue:work            # keep running (systemd, supervisor, …)
* * * * * cd /path/to/backend-fitapp && php artisan schedule:run >> /dev/null 2>&1   # crontab
```

On a small personal server you can set `QUEUE_CONNECTION=sync` instead of running a worker; the webhook then downloads FIT files inline.

## 3. Register FitApp's URLs with Zepp

In the Zepp Developer Console, register:

| Setting | Value |
| --- | --- |
| OAuth callback / redirect URI | `https://api.your-fitapp.example/api/zepp/callback` (must equal `ZEPP_REDIRECT_URI`) |
| Event webhook / callback URL | `https://api.your-fitapp.example/api/zepp/webhook/<ZEPP_WEBHOOK_TOKEN>` |

Zepp does not sign webhook requests, so the secret path segment is what keeps others from posting fake data. Treat `ZEPP_WEBHOOK_TOKEN` like a password. The **Watch & sync** page shows both URLs (with the token as a placeholder).

## 4. Connect your account

Sign in to your FitApp website, open **Watch & sync** and choose **Connect Zepp account**. You are sent to Zepp's sign-in page, approve access, and return to FitApp. Optionally choose **Request last 30 days of history**. New data arrives whenever your watch syncs with the Zepp app.

**Disconnect** revokes access at Zepp (`POST /users/-/thirdparty/unauthorize`) and deletes the stored tokens; data already received is kept. Revoking access inside the Zepp app has the same effect via the `authorizationChange` webhook.

## Checking the first connection

- **Callback errors** return you to `/device?zepp=error&reason=…`; the backend log has the HTTP status (never token values).
- **Webhooks:** `storage/logs/laravel.log` and the **Last event from Zepp** time on Watch & sync. A delivery is acknowledged with `204`.
- **Heart rate:** run `php artisan fitapp:zepp-sync` by hand; errors appear on Watch & sync.
- Things to confirm against the live service, because the documentation leaves them open: the unit of `expires_in` (treated as seconds), whether the authorize page needs `redirect_uri` as a parameter (the docs say it is registered in the console), the exact `activityType` values, and whether daily totals are re-sent during the day (FitApp handles either).

## Security notes

- Client secret, access and refresh tokens stay on the server; tokens are encrypted with `APP_KEY`.
- OAuth `state` is random, single-use and expires after 10 minutes.
- Only your own FitApp account can be linked to a given Zepp user.
- Webhook payloads are validated against the ingestion contract before anything is stored.

## Where the code is

| File | Purpose |
| --- | --- |
| `config/zepp.php` | Settings and documented default URLs |
| `app/Http/Controllers/ZeppController.php` | Status, connect, OAuth callback, disconnect, backfill |
| `app/Http/Controllers/ZeppWebhookController.php` | Webhook endpoint |
| `app/Services/Zepp/ZeppClient.php` | Token exchange/refresh and API calls |
| `app/Services/Zepp/ZeppMapper.php` | Zepp payloads → ingestion contract |
| `app/Services/Zepp/ZeppSync.php` | Webhook handling, heart-rate pull, ingestion |
| `app/Services/Zepp/FitParser.php` | Reads workout summaries from FIT files |
| `app/Jobs/FetchZeppActivityFile.php` | Background FIT download |
| `tests/Feature/ZeppTest.php` | End-to-end tests with faked Zepp responses |
