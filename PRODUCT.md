# FitApp — product context

_Written from the project brief without a separate interview; assumptions are marked._

## What it is
FitApp is an open-source health tracking platform: a mobile app and a read-only web dashboard on one backend, with a promotional site and FitApp's own wearables planned under the same brand. It doubles as a portfolio study across brand and logo design, UI/UX and app development.

FitApp is watch-centred holistic health tracking. A watch supplies the foundation (activity, workouts, sleep, heart rate); the person adds context the watch can't measure (mood, meals, water, periods and symptoms); FitApp explains what the combined records show. It replaces several separate apps with one place that is easy to read.

Real mode uses watch data that the watch's own app shares with Health Connect or Apple Health; the FitApp phone app reads it there and uploads it to the person's account. Demo mode simulates that experience entirely in the browser. Personal trackers always accept manual entries in the mobile app, including while the watch is not syncing or the phone is offline. The web dashboard only displays records.

## Who uses it
- **Visitors to the public demo**: want to understand the product within a minute, on phone or desktop.
- **Self-hosters (developers)**: run the backend, map their device or vendor export to the ingestion contract, then use the site daily.
- Assumption: one person reviews their own data, logging on the phone and reading longer trends on the desktop dashboard.

## Surfaces and mode
All screens are **Operate** surfaces: scanability, honest data states and familiar patterns outrank expression. The watch stays first in navigation, the overview and the visual hierarchy.

## Principles
- Honest data: missing stays missing; a reachable backend is never presented as a verified watch; readings are "latest", not "live".
- Provenance is always visible: watch or the user's own entry.
- The public demo reads like a real account (a named person, a FitApp Watch, no "sample" or "simulated" wording in the interface); the README and repository say its values are simulated.
- Explanations are traceable: calculation, period, counts, links to records, and minimum-data thresholds. Associations, never causes; no diagnoses, risk labels or fertility guidance.
- The weekly health score (out of 100) is built only from published guidelines on what FitApp collects (WHO activity minutes, daily steps, 7 to 9 hours of sleep, sleep regularity, resting heart rate, water) and says which part has the most room to grow. It describes habits, not health status.
- The AI coach writes the score summary and tip, a daily reminder, a reaction to each entry and cross-area insights. It runs on the person's own FitApp server, sees numbers and categories but never notes, gives habit advice only, and every client falls back to built-in wording without it.
- Food values are what the user entered, or estimates from FitApp's food list that are labelled as such; intake is never combined with watch-estimated expenditure.
- Every visible control does something real.

## Out of scope
Medical advice from the AI coach, social features, subscriptions, third-party vendor cloud integrations (data arrives through FitApp's own ingestion API). The promotional site and devices are separate, later products.

## Visual direction (chosen)
Calm dashboard: muted grey canvas, white borderless cards, the FitApp teal (see `brand/`) for accents and the overview hero, and a deep shade of each module's colour for its own hero. One validated data colour per metric (activity blue, energy amber, sleep violet ramp, heart orange, stress green, blood oxygen red). Poppins in the app; the logo wordmark is outlined Rubik Bold. Light and dark themes.
