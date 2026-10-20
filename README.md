# FitApp Mobile

The Android and iOS app for [FitApp](https://github.com/tanximsiam/fitapp), a watch-centred holistic health tracker. The watch supplies activity, sleep, heart rate and body signals; you add mood, meals, water and cycle entries; FitApp explains what the combined records show.

## The product

FitApp is a concept health brand and a personal open-source portfolio project by Tanzim Siam, covering brand and logo design, UI/UX and app development. It is not a commercial product.

- **The FitApp watch** is the brand's own concept wearable and the app's primary data source. The app is designed around it: the watch's status sits in every tab's toolbar, and the Device tab covers connection, sync and supported measurements.
- **Other sources:** Android Health Connect and Apple Health are planned as additional sources, for people who wear another device.
- **Build your own platform.** The way the app pairs and exchanges data with a watch is kept in one replaceable connection layer. To run FitApp with your own wearable or platform, adapt that layer to your device's protocol or point it at an architecture you already use; the screens, data model and insights stay the same.

Until a watch is connected, the app runs on a simulated FitApp watch with six months of sample data, always labelled as simulated.

## Stack

Built with Ionic Vue 3, TypeScript, Capacitor 7, Pinia and Tailwind CSS 4. It talks to the existing FitApp Laravel 12 API and runs fully offline in demo mode.

## Status

Phases 1 (foundation), 2 (mobile features) and 3 (backend and data) of the mobile specification. Screens were checked in a browser at phone size on demo data and against a local FitApp backend; nothing has run on a phone yet.

| Area | State |
|---|---|
| App shell: 5 tabs (Home, Health, Journal, Insights, Device), quick-log button, profile | Working, verified in the browser at phone size |
| Onboarding: welcome, data-source explanation, demo or sign-in, tracker choice | Working (demo path verified; sign-in needs a running backend) |
| Home: goal hero, today's measurements, wellbeing, today's timeline; cards can be reordered and hidden | Working |
| Health: module list plus Activity, Workouts, Sleep, Heart rate, Stress, Blood oxygen, Skin temperature pages | Working |
| Journal: history with category filter; Mood, Food & drink and Cycle pages with editing | Working |
| Insights: every rule-based observation with its calculation, withheld ones, data coverage | Working |
| Quick log (mood, meal, drink, cycle) as a bottom sheet, opening the matching form per page | Working; saves locally in demo mode |
| Profile & settings: goals, trackers, theme, data source, server tokens, privacy | Working (server sections need a running backend) |
| Light and dark themes (follows the system) | Working |
| Android project (`android/`) | Generated, **not built or run yet** (no Android SDK on the development machine) |
| iOS project (`ios/`) | Generated, **not built** (needs macOS and Xcode) |
| FitApp watch connection layer | Not implemented (Phase 4). The app never claims a connection it does not have. |
| Health Connect / Apple Health | Not implemented (Phase 4) |
| Sign-in token and profile in the iOS Keychain / Android Keystore | Implemented; native storage not yet run on a device (a plain browser falls back to unencrypted localStorage) |
| Offline: encrypted local copy of loaded data, opens and shows an offline notice without a connection | Working against a local backend in the browser |
| Offline journal entries: queued, shown as "waiting to sync", sent when back online | Working; covered by unit and contract tests |
| Edit conflicts: a change refused by the server waits for "keep mine" or "keep the other version" | Working; covered by contract tests |
| Sign-out removes the token, the cached copy, unsent entries (after a warning) and the encryption key | Implemented |
| API contract tests against a real backend | 8 tests, passing (see below) |

## Getting started

Requires Node 20 or later.

```bash
npm install
npm run dev          # http://localhost:5174, use the browser's phone emulation
npm run test:unit -- --run
npm run build
```

To use your own backend instead of demo data, copy `.env.example` to `.env` and set `VITE_BACKEND_URI` to the URL of a running [FitApp backend](https://github.com/tanximsiam/fitapp/tree/main/backend-fitapp). Accounts are created on the server with `php artisan fitapp:create-user`.

### API contract tests

These run the app's own API client against a real FitApp backend, so a renamed or missing field fails here. The script starts a throwaway backend from `../fitapp/backend-fitapp` (or `FITAPP_BACKEND_DIR`) on port 8010 with its own temporary SQLite database, a test user with a random password, and the sample ingest payload. Your backend's database and `.env` are not touched. Needs PHP 8.3 and the backend's Composer dependencies.

```bash
scripts/contract-backend.sh &
npm run test:contract
```

Without the script running, the contract tests are skipped.

### Offline data and privacy

Live data is cached per account, encrypted with AES-GCM under a random key kept in the Keychain or Keystore, in the app's private data folder. Journal changes made offline wait in an encrypted outbox and are sent in order when the connection returns. A change the server refuses because the entry was edited elsewhere is never overwritten silently: the Journal tab asks which version to keep. Demo data is kept separately and never mixed with an account's records.

### Native builds

```bash
npm run sync         # build the web app and copy it into android/ and ios/
npx cap open android # needs Android Studio and an Android SDK
npx cap open ios     # needs macOS with Xcode
```

The app id is `io.github.tanximsiam.fitapp`.

## How it is organised

```
src/
  views/         Screens. TabsLayout holds the tab bar; module pages sit under /health/*
  components/    AppShell (mobile page frame with back navigation and pull-to-refresh),
                 DateToolbar (date sheet + range), charts/, forms/, quicklog/, tiles
  data/          Demo generator, adapters (demo / backend), timeline and derivations
  api/           Laravel API client (Sanctum bearer token)
  stores/        Pinia: fitness, journal, mode (demo or backend), auth, ui
  insights/      Rule-based, explainable observations
  styles/        tailwind.css (FitApp tokens, shared with the web app), mobile.css (Ionic chrome)
tests/unit/      Vitest
```

The data layer, types, stores, insight rules, charts and entry forms come from the FitApp web app so both clients calculate the same way. Screens, navigation and the page frame are mobile-specific. Paths used by shared components (`/activity`, `/settings`, …) redirect to their mobile locations.

## Principles

- Missing data stays missing; nothing is estimated or filled in.
- Sample data is always labelled as simulated.
- Every observation shows its calculation, period and counts. Associations, never causes or diagnoses.

## Licence

Code: Apache-2.0, see [LICENSE](LICENSE) and [NOTICE](NOTICE). The FitApp name, logo and images are not licensed for reuse; see [TRADEMARKS.md](TRADEMARKS.md). Animated mood faces are adapted from "Simple animating emotions" by Misha Heesakkers (MIT).
