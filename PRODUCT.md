# FitApp — product context

_Written from the project brief without a separate interview; assumptions are marked._

## What it is
FitApp is an open-source health tracking platform: this web app, with a mobile app, a promotional site and FitApp's own wearables planned under the same brand. It doubles as a portfolio study across brand and logo design, UI/UX and app development.

The web app is a watch-centred holistic health website. A watch supplies the foundation (activity, workouts, sleep, heart rate); the person adds context the watch can't measure (mood, meals, water, periods and symptoms); FitApp explains what the combined records show. It replaces several separate apps with one place that is easy to read.

Real mode uses watch-originated data delivered by a configured provider or bridge through FitApp's ingestion API. Demo mode simulates that experience entirely in the browser. Personal trackers always accept manual entries, including while the watch is not syncing.

## Who uses it
- **Visitors to the public demo**: want to understand the product within a minute, on phone or desktop.
- **Self-hosters (developers)**: run the backend, map their device or vendor export to the ingestion contract, then use the site daily.
- Assumption: one person reviews their own data, with quick logging on a phone and longer trend reading on desktop.

## Surfaces and mode
All screens are **Operate** surfaces: scanability, honest data states and familiar patterns outrank expression. The watch stays first in navigation, the overview and the visual hierarchy.

## Principles
- Honest data: missing stays missing; sample data is labelled; a reachable backend is never presented as a verified watch; readings are "latest", not "live".
- Provenance is always visible: watch, simulated watch, or the user's own entry.
- Explanations are traceable: calculation, period, counts, links to records, and minimum-data thresholds. Associations, never causes; no diagnoses, risk labels, fertility guidance or overall health score.
- Food values are what the user entered, or estimates from FitApp's food list that are labelled as such; intake is never combined with watch-estimated expenditure.
- Every visible control does something real.

## Out of scope
AI coaching, social features, subscriptions, third-party vendor cloud integrations (data arrives through FitApp's own ingestion API). The mobile app, promotional site and devices are separate, later products.

## Visual direction (chosen)
Calm dashboard: muted grey canvas, white borderless cards, the FitApp teal (see `brand/`) for accents and the overview hero, and a deep shade of each module's colour for its own hero. One validated data colour per metric (activity blue, energy amber, sleep violet ramp, heart orange, stress green, blood oxygen red). Poppins in the app; the logo wordmark is outlined Rubik Bold. Light and dark themes.
