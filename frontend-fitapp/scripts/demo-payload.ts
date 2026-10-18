/**
 * Prints an ingestion payload (docs/openapi.yaml, IngestPayload) built from the demo generator,
 * so a self-hosted backend can be tried without a device:
 *
 *   npx vite-node scripts/demo-payload.ts [days=30] [endDaysAgo=0] > /tmp/demo.json
 *   curl -X POST "$API/api/ingest" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" --data @/tmp/demo.json
 *
 * One request holds at most 10,000 heart-rate readings (about 30 days), so for the full six-month
 * demo history send several chunks, e.g. `30 0`, `30 30`, `30 60`, … `30 150`.
 * The data is labelled with the source key "fitapp-demo" so it is never mistaken for a real device.
 */
import { DEMO_DEVICE, DEMO_MEASUREMENTS, DEMO_WINDOW_DAYS, clockFrom, generateDay } from '../src/data/demo'
import { addDays } from '../src/lib/dates'

const days = Math.min(Math.max(1, Number(process.argv[2] ?? 30)), 34)
const endDaysAgo = Math.min(Math.max(0, Number(process.argv[3] ?? 0)), DEMO_WINDOW_DAYS - 1)
const clock = clockFrom(new Date())
const end = addDays(clock.today, -endDaysAgo)
const generated = Array.from({ length: days }, (_, i) => generateDay(addDays(end, i - days + 1), clock))

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
  stress: { samples: generated.flatMap((d) => d.readings.stress) },
  spo2: { samples: generated.flatMap((d) => d.readings.spo2.map((r) => ({ at: r.at, percent: r.value }))) },
  skin_temperature: generated
    .filter((d) => d.summary.skinTemp)
    .map(({ summary: { date, skinTemp } }) => ({ date, deviation_c: skinTemp!.deviationC })),
}

process.stdout.write(JSON.stringify(payload))
