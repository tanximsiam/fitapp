/**
 * Prints an ingestion payload (docs/openapi.yaml, IngestPayload) built from the demo generator,
 * so a self-hosted backend can be tried without a device:
 *
 *   npx vite-node scripts/demo-payload.ts > /tmp/demo.json
 *   curl -X POST "$API/api/ingest" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" --data @/tmp/demo.json
 *
 * The data is labelled with the source key "fitapp-demo" so it is never mistaken for a real device.
 */
import { DEMO_DEVICE, DEMO_MEASUREMENTS, DEMO_WINDOW_DAYS, clockFrom, generateDay } from '../src/data/demo'
import { addDays } from '../src/lib/dates'

const clock = clockFrom(new Date())
const generated = Array.from({ length: DEMO_WINDOW_DAYS }, (_, i) => generateDay(addDays(clock.today, i - DEMO_WINDOW_DAYS + 1), clock))

const payload = {
  source: { key: 'fitapp-demo', name: 'FitApp sample data', device: DEMO_DEVICE, measurements: DEMO_MEASUREMENTS },
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  workouts: generated.flatMap(({ summary: { date, workouts } }) =>
    workouts.map((w) => ({
      date,
      type: w.type,
      start_at: w.startAt,
      end_at: w.endAt,
      active_kcal: w.activeKcal,
      distance_m: w.distanceM,
      avg_bpm: w.avgBpm,
      max_bpm: w.maxBpm,
    })),
  ),
  activity: generated
    .filter((d) => d.summary.activity)
    .map(({ summary: { date, activity: a } }) => ({
      date,
      steps: a!.steps,
      distance_m: a!.distanceM,
      active_kcal: a!.activeKcal,
      active_minutes: a!.activeMinutes,
    })),
  sleep: generated
    .filter((d) => d.summary.sleep)
    .map(({ summary: { date, sleep: s } }) => ({
      date,
      start_at: s!.startAt,
      end_at: s!.endAt,
      score: s!.score,
      stages: s!.stages && {
        deep_min: s!.stages.deepMin,
        light_min: s!.stages.lightMin,
        rem_min: s!.stages.remMin,
        awake_min: s!.stages.awakeMin,
      },
    })),
  heart_rate: {
    resting: generated
      .filter((d) => d.summary.heartRate?.restingBpm != null)
      .map(({ summary: { date, heartRate } }) => ({ date, bpm: heartRate!.restingBpm })),
    samples: generated.flatMap((d) => d.samples),
  },
}

process.stdout.write(JSON.stringify(payload))
