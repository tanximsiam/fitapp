# FitApp — product context

_Written from the project brief without a separate interview; assumptions are marked._

## What it is
A watch-centred holistic health website. A watch supplies the foundation (activity, workouts, sleep, heart rate); the person adds context the watch can't measure (mood, meals, water, periods and symptoms); FitApp explains what the combined records show. It replaces several separate apps with one place that is easy to read.

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
- Food values are only what the user entered; intake is never combined with watch-estimated expenditure.
- Every visible control does something real.

## Out of scope
AI coaching, social features, subscriptions, food databases, watch or phone apps, provider-specific integrations without real credentials.

## Visual direction (chosen)
Quiet training-log: warm paper neutrals, near-black ink, hairline rules instead of nested cards, the existing rose brand colour for selection and primary actions, one validated data colour per watch metric (activity blue, heart orange, sleep violet ramp). Poppins (already self-hosted). Light and dark follow the system setting.
