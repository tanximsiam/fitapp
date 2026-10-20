import type { ISODate, Measurement } from './fitness'

/**
 * Upload body for POST /api/ingest (IngestPayload in docs/openapi.yaml of the main repo).
 * Missing values are null or omitted, never 0; instants always carry an offset or Z.
 */
export interface IngestPayload {
  source: { key: string; name: string; device?: string | null; measurements?: Measurement[] | null }
  timezone?: string
  activity?: { date: ISODate; steps?: number | null; distance_m?: number | null; active_kcal?: number | null; active_minutes?: number | null }[]
  workouts?: {
    date: ISODate
    type: string
    start_at: string
    end_at: string
    active_kcal?: number | null
    distance_m?: number | null
    avg_bpm?: number | null
    max_bpm?: number | null
  }[]
  sleep?: {
    date: ISODate
    start_at: string
    end_at: string
    score?: number | null
    stages?: { deep_min: number | null; light_min: number | null; rem_min: number | null; awake_min: number | null } | null
  }[]
  heart_rate?: { resting?: { date: ISODate; bpm: number }[]; samples?: { at: string; bpm: number }[] }
  stress?: { samples: { at: string; value: number }[] }
  spo2?: { samples: { at: string; percent: number }[] }
  skin_temperature?: { date: ISODate; deviation_c: number }[]
}

/** What a source read: an ingest payload without the source block, which the sync pipeline adds. */
export type SourceRecords = Omit<IngestPayload, 'source' | 'timezone'>
