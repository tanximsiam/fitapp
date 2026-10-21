import { useAuthStore } from '@/stores/auth'
import { useModeStore } from '@/stores/mode'
import { api } from './client'

/**
 * Personal text from the AI service on the FitApp server (see backend AiController).
 * A signed-in account uses /ai; sample data uses /demo/ai, which the server may switch off.
 */

export interface AiInsight {
  area: 'activity' | 'sleep' | 'heart' | 'stress' | 'mood' | 'food' | 'hydration' | 'cycle' | 'general'
  title: string
  body: string
  action: string | null
}
export interface AiCoach {
  summary: string
  tip: string
}

const base = () => (useModeStore().isDemo ? '/demo/ai' : '/ai')
const post = async <T>(path: string, body: object) => (await api.post<{ data: T }>(`${base()}/${path}`, body)).data.data

export const aiInsights = async (summary: object) => (await post<{ insights: AiInsight[] }>('insights', { summary })).insights
export const aiFeedback = async (kind: string, entry: object, today: object) => (await post<{ feedback: string }>('feedback', { kind, entry, today })).feedback
export const aiCoach = (body: object) => post<AiCoach>('coach', body)
export const aiQuote = async (body: object) => (await post<{ quote: string }>('quote', body)).quote

/** The AI's answer when a server can be asked, otherwise (or on any failure) the fallback. */
export async function fromAi<T>(call: () => Promise<T>, fallback: T): Promise<T> {
  const mode = useModeStore()
  const reachable = mode.isDemo ? mode.backendConfigured : !!useAuthStore().user
  if (!reachable) return fallback
  try {
    return await call()
  } catch {
    return fallback
  }
}
