import { api } from './client'
import type { IngestPayload } from '@/types/ingest'

/** Uploads what this phone read from the watch or the health platform, as the signed-in account. */
export async function uploadIngest(payload: IngestPayload): Promise<void> {
  await api.post('/ingest', payload)
}
