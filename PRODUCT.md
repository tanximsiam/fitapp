# FitApp — product context

_Written from the project brief without a separate interview; assumptions are marked._

## What it is
An open-source personal fitness website. It shows one person's daily activity, sleep and heart-rate data, served by a self-hosted Laravel backend that accepts uploads from any data source a developer connects. A browser-only demo with generated sample data shows the full experience without a watch, account or backend.

## Who uses it
- **Visitors to the public demo**: want to understand what FitApp does within a minute, on phone or desktop.
- **Self-hosters (developers)**: run the backend, map their own device/export output to the ingestion contract, then use the site daily.
- Assumption: a single person looks at their own data, typically a quick morning or evening check, sometimes a longer look at trends on desktop.

## Surfaces and mode
All app screens (Overview, Activity, Sleep, Heart rate, Settings, Sign-in) are **Operate** surfaces: scanability, honesty about data state, and familiar patterns outrank expression.

## Principles
- Honest data: missing measurements stay missing; sample data is always labelled; a backend connection is never presented as a verified watch connection.
- Calm, factual tone. No coaching, scores invented by the UI, medical interpretation, or gamification.
- Every visible control does something real.

## Out of scope
AI coaching, social features, subscriptions, nutrition, medical interpretation, watch or phone apps, provider-specific integrations without real credentials.

## Visual direction (chosen)
Quiet training-log: warm paper neutrals, near-black ink, hairline rules instead of cards-in-cards, the existing rose brand colour for selection and primary actions, one validated data colour per metric (activity blue, heart orange, sleep violet ramp). Poppins (already self-hosted by the project). Light and dark follow the system setting.
