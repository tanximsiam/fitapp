import { api } from './client'
import type {
  DataStatus,
  DaySummary,
  DaySummaryPayload,
  DaysResult,
  Goals,
  GoalsPayload,
  HeartRateSample,
  IngestToken,
  ISODate,
  StatusPayload,
} from '@/types/fitness'

export function toDaySummary(raw: DaySummaryPayload): DaySummary {
  const { activity: a, sleep: s, heart_rate: h } = raw
  return {
    date: raw.date,
    activity: a && {
      steps: a.steps,
      distanceM: a.distance_m,
      activeKcal: a.active_kcal,
      activeMinutes: a.active_minutes,
      source: a.source,
    },
    sleep: s && {
      startAt: s.start_at,
      endAt: s.end_at,
      durationMin: s.duration_min,
      score: s.score,
      stages: s.stages && {
        deepMin: s.stages.deep_min,
        lightMin: s.stages.light_min,
        remMin: s.stages.rem_min,
        awakeMin: s.stages.awake_min,
      },
      source: s.source,
    },
    heartRate: h && {
      restingBpm: h.resting_bpm,
      minBpm: h.min_bpm,
      maxBpm: h.max_bpm,
      avgBpm: h.avg_bpm,
      sampleCount: h.sample_count,
      source: h.source,
    },
    workouts: (raw.workouts ?? []).map((w) => ({
      type: w.type,
      startAt: w.start_at,
      endAt: w.end_at,
      durationMin: w.duration_min,
      activeKcal: w.active_kcal,
      distanceM: w.distance_m,
      avgBpm: w.avg_bpm,
      maxBpm: w.max_bpm,
      source: w.source,
    })),
  }
}

export const toGoals = (g: GoalsPayload): Goals => ({
  steps: g.steps,
  activeKcal: g.active_kcal,
  distanceM: g.distance_m,
  sleepMin: g.sleep_min,
})

export async function getDays(from: ISODate, to: ISODate): Promise<DaysResult> {
  const res = await api.get<{ data: DaySummaryPayload[]; meta: { timezone: string } }>('/fitness/days', { params: { from, to } })
  return { days: res.data.data.map(toDaySummary), timezone: res.data.meta.timezone }
}

export async function getHeartRate(date: ISODate): Promise<HeartRateSample[]> {
  const res = await api.get<{ data: { samples: HeartRateSample[] } }>(`/fitness/heart-rate/${date}`)
  return res.data.data.samples
}

export async function getStatus(): Promise<DataStatus> {
  const { data } = (await api.get<{ data: StatusPayload }>('/fitness/status')).data
  return {
    sources: data.sources.map((s) => ({
      key: s.key,
      name: s.name,
      device: s.device,
      measurements: s.measurements,
      received: s.received ?? [],
      lastIngestedAt: s.last_ingested_at,
      latestDate: s.latest_date ?? null,
    })),
    lastIngestedAt: data.last_ingested_at,
    latestDate: data.latest_date,
    latestHeartRate: data.latest_heart_rate,
    timezone: data.timezone,
  }
}

export async function getGoals(): Promise<Goals> {
  return toGoals((await api.get<{ data: { goals: GoalsPayload } }>('/user')).data.data.goals)
}

export async function saveGoals(goals: Goals): Promise<Goals> {
  const body = { goals: { steps: goals.steps, active_kcal: goals.activeKcal, distance_m: goals.distanceM, sleep_min: goals.sleepMin } }
  return toGoals((await api.patch<{ data: { goals: GoalsPayload } }>('/user', body)).data.data.goals)
}

type TokenPayload = { id: number; name: string; last_used_at: string | null; created_at: string | null }

export async function listIngestTokens(): Promise<IngestToken[]> {
  const res = await api.get<{ data: TokenPayload[] }>('/ingest-tokens')
  return res.data.data.map((t) => ({ id: t.id, name: t.name, lastUsedAt: t.last_used_at, createdAt: t.created_at }))
}

/** Returns the plain-text token; the backend never shows it again. */
export async function createIngestToken(name: string): Promise<string> {
  return (await api.post<{ data: { token: string } }>('/ingest-tokens', { name })).data.data.token
}

export async function revokeIngestToken(id: number): Promise<void> {
  await api.delete(`/ingest-tokens/${id}`)
}
