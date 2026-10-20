# FitApp Mobile

The Android and iOS app for [FitApp](https://github.com/tanximsiam/fitapp), a watch-centred holistic health tracker. Your smartwatch supplies activity, sleep, heart rate and body signals; you add mood, meals, water and cycle entries; FitApp explains what the combined records show.

Built with Ionic Vue 3, TypeScript, Capacitor 7, Pinia and Tailwind CSS 4. It talks to the existing FitApp Laravel 12 API and runs fully offline in demo mode.

## Status

Phase 1 (foundation) of the mobile specification.

| Area | State |
|---|---|
| App shell: 5 tabs (Home, Health, Journal, Insights, Device), quick-log button, profile | Working, verified in the browser at phone size |
| Onboarding: welcome, data-source explanation, demo or sign-in, tracker choice | Working (demo path verified; sign-in needs a running backend) |
| Home: watch status, goal hero, today's measurements, wellbeing, today's timeline | Working on demo data |
| Health: module list plus Activity, Sleep, Heart rate, Stress, Blood oxygen, Skin temperature pages | Working on demo data |
| Journal and Insights tabs | First versions (7-day entries, rule-based observations); full features are Phase 2 |
| Quick log (mood, meal, drink, cycle) | Shared with the web app, saves locally in demo mode |
| Light and dark themes (follows the system) | Working |
| Android project (`android/`) | Generated, **not built or run yet** (no Android SDK on the development machine) |
| iOS project (`ios/`) | Generated, **not built** (needs macOS and Xcode) |
| Health Connect / Apple Health | Not implemented (Phase 4). The app never claims a connection it does not have. |
| Offline queue, secure token storage | Not implemented (Phase 3). The backend token is in `localStorage` for now. |

## Getting started

Requires Node 20 or later.

```bash
npm install
npm run dev          # http://localhost:5174, use the browser's phone emulation
npm run test:unit -- --run
npm run build
```

To use your own backend instead of demo data, copy `.env.example` to `.env` and set `VITE_BACKEND_URI` to the URL of a running [FitApp backend](https://github.com/tanximsiam/fitapp/tree/main/backend-fitapp). Accounts are created on the server with `php artisan fitapp:create-user`.

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
