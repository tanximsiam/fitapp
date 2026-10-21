# Sign in with Google

FitApp ships with Google sign-in built in but switched off. It turns on as soon as the backend has a Google OAuth client ID and secret. Until then the apps don't show the "Continue with Google" button, and email-and-password sign-in works as usual.

Each FitApp server uses its own Google client, so every self-hoster creates one. It takes about five minutes and is free.

## How it works

```
app ──► GET  /api/auth/google/redirect?return=…   (opens in the system browser)
        Google sign-in page
    ◄── GET  /api/auth/google/callback             (backend checks the account)
app ◄── fitapp://auth/google?code=…                (or the web address it came from)
app ──► POST /api/auth/google/token {code}        → { user, token }
```

- The backend talks to Google, not the app. The app never handles a Google token, and the FitApp token never appears in a URL. The browser only carries a one-time code that expires after two minutes.
- The first Google sign-in creates an account, unless `FITAPP_REGISTRATION=false`. If an account with the same verified email already exists, Google sign-in is linked to it.
- The return address must be the app's URL scheme (`fitapp://`) or one of the origins in `FRONTEND_ORIGINS`. Any other address is refused.

## 1. Create the Google client

1. Open the [Google Cloud Console](https://console.cloud.google.com/), then create or pick a project.
2. **APIs & Services → OAuth consent screen**:
   - Choose **External**.
   - Give the app name, your support email and your developer email.
   - Add the scopes `openid`, `email` and `profile`. These are non-sensitive scopes, so no Google review is needed.
   - While the app is in **Testing**, add the Google accounts that may sign in as test users. Publish it when you want anyone to sign in.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**. The redirect goes to your backend, even for the phone app.
   - Authorized redirect URI: `https://your-api.example/api/auth/google/callback`. For local development, use `http://localhost:8000/api/auth/google/callback`.
4. Copy the **client ID** and **client secret**.

## 2. Configure the backend

In `backend-fitapp/.env`:

```dotenv
GOOGLE_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
# Only if the callback is not ${APP_URL}/api/auth/google/callback:
# GOOGLE_REDIRECT_URI=https://your-api.example/api/auth/google/callback

# Web addresses that may receive the sign-in code (also used for CORS)
FRONTEND_ORIGINS=https://your-dashboard.example,http://localhost:5174
```

Then run `php artisan migrate` (it adds `users.google_id`) and `php artisan config:clear`. Check the result with `GET /api/auth/providers`, which should now return `"google": true`.

`APP_URL` must be the public address of the backend. Google compares the redirect URI character by character with the one you registered.

The sign-in state and one-time codes are kept in Laravel's cache. Any shared store works (`database`, the default, or `redis`); the `array` store does not, because it forgets everything between requests.

## 3. The mobile app

There is nothing to configure in the app. It asks the server whether Google is enabled and shows the button if it is.

- **Android and iOS:** Google's page opens in the system browser. Google blocks sign-in inside embedded web views. Afterwards the backend opens `fitapp://auth/google?code=…`, which the app registers in `AndroidManifest.xml` and `Info.plist`.
- **Browser (dev server):** the app returns to `<its origin>/auth/google`, so that origin must be listed in `FRONTEND_ORIGINS`.

If you rename the URL scheme, change it in all four places:
- `FITAPP_APP_SCHEME` on the backend
- `APP_AUTH_RETURN` in `app/src/composables/useSignIn.ts`
- the deep-link check in `app/src/main.ts`
- the native manifests (`AndroidManifest.xml` and `Info.plist`)

## Turning off sign-ups

`FITAPP_REGISTRATION=false` closes both the sign-up form and new Google accounts. Existing users can still sign in with Google, and new accounts are created with `php artisan fitapp:create-user`.
