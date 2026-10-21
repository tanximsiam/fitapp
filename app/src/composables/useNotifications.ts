import { computed } from 'vue'
import { alertCircleOutline, checkmarkCircleOutline, cloudUploadOutline, watchOutline } from 'ionicons/icons'
import { connection } from '@/data/offline'
import { progress } from '@/data/derive'
import { SYNC_LABELS, syncState } from '@/data/connection'
import { formatRelative } from '@/lib/format'
import { useFitnessStore } from '@/stores/fitness'
import { useModeStore } from '@/stores/mode'

export interface Notice {
  id: string
  /** attention: needs the person; info: worth knowing; good: something achieved. */
  kind: 'attention' | 'info' | 'good'
  icon: string
  title: string
  text: string
  to?: string
}

/**
 * In-app notifications, derived from what the app already knows (sync, unsent entries, goals).
 * Never built from period records, so nothing sensitive appears here.
 */
export function useNotifications() {
  const fitness = useFitnessStore()
  const mode = useModeStore()

  const notices = computed<Notice[]>(() => {
    const out: Notice[] = []
    const issues = mode.isDemo ? 0 : connection.queue.filter((q) => q.state !== 'pending').length
    if (issues)
      out.push({ id: 'sync-issues', kind: 'attention', icon: alertCircleOutline, title: issues === 1 ? 'A change needs your decision' : `${issues} changes need your decision`, text: 'An entry was edited on another device too.', to: '/journal' })

    const status = fitness.status
    const state = syncState(status)
    const watch = status?.sources[0]?.device ?? 'Your watch'
    if (state === 'stale' || state === 'delayed')
      out.push({ id: 'watch-sync', kind: state === 'stale' ? 'attention' : 'info', icon: watchOutline, title: `${watch}: ${SYNC_LABELS[state].toLowerCase()}`, text: `Last sync ${formatRelative(status?.lastIngestedAt ?? null)}.`, to: '/home/device' })
    else if (state === 'none' && !mode.isDemo)
      out.push({ id: 'watch-none', kind: 'info', icon: watchOutline, title: 'No watch data yet', text: 'Pair your watch or connect a health app.', to: '/home/device' })

    const pending = mode.isDemo ? 0 : connection.queue.filter((q) => q.state === 'pending').length
    if (pending) out.push({ id: 'pending', kind: 'info', icon: cloudUploadOutline, title: `${pending} ${pending === 1 ? 'entry' : 'entries'} waiting to sync`, text: 'They will be sent when you are back online.', to: '/journal' })

    const today = fitness.days.find((d) => d.date === fitness.today)
    const g = fitness.goals
    const reached = [
      ['Step goal', progress(today?.activity?.steps, g.steps)],
      ['Activity goal', progress(today?.activity?.activeKcal, g.activeKcal)],
      ['Sleep goal', progress(today?.sleep?.durationMin, g.sleepMin)],
    ].filter(([, r]) => r != null && (r as number) >= 1)
    for (const [label] of reached) out.push({ id: `goal-${label}`, kind: 'good', icon: checkmarkCircleOutline, title: `${label} reached today`, text: 'Nicely done.', to: '/home' })
    return out
  })

  const needsAttention = computed(() => notices.value.some((n) => n.kind === 'attention'))
  return { notices, needsAttention }
}
