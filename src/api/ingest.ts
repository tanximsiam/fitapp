import { api } from './client'
import type { IngestPayload } from '@/types/ingest'

/** Uploads with an ingest-only token (this phone's), not the signed-in user's token. See docs/integration.md. */
export async function uploadIngest(ingestToken: string, payload: IngestPayload): Promise<void> {
  await api.post('/ingest', payload, { headers: { Authorization: `Bearer ${ingestToken}` } })
}
