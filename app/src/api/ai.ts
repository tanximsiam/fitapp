import { useAuthStore } from '@/stores/auth'
import { useModeStore } from '@/stores/mode'
import { api } from './client'

/** Personal text from the AI service on the FitApp server (see backend AiController). */

export interface AiInsight {
  area: 'activity' | 'sleep' | 'heart' | 'stress' | 'mood' | 'food' | 'hydration' | 'cycle' | 'general'
  title: string
  body: string
  action: string | null
}

export const aiInsights = async (summary: object) => (await api.post<{ data: { insights: AiInsight[] } }>('/ai/insights', { summary })).data.data.insights
export const aiFeedback = async (kind: string, entry: object, today: object) => (await api.post<{ data: { feedback: string } }>('/ai/feedback', { kind, entry, today })).data.data.feedback
export const aiScoreTip = async (body: object) => (await api.post<{ data: { tip: string } }>('/ai/score-tip', body)).data.data.tip

/** The AI's answer for a signed-in account, or the fallback (sample data, offline, service off). */
export async function fromAi<T>(call: () => Promise<T>, fallback: T): Promise<T> {
  if (useModeStore().isDemo || !useAuthStore().user) return fallback
  try {
    return await call()
  } catch {
    return fallback
  }
}
