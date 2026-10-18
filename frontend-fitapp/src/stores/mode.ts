import { defineStore } from 'pinia'
import { BACKEND_URL } from '@/api/client'
import { createBackendAdapter, createDemoAdapter } from '@/data/adapters'
import { createBackendJournal } from '@/api/journal'
import { clockFrom } from '@/data/demo'
import { createDemoJournal } from '@/data/demoJournal'
import type { FitnessAdapter } from '@/types/fitness'
import type { JournalAdapter } from '@/types/journal'

export type DataMode = 'demo' | 'backend'

const MODE_KEY = 'fitapp.mode'
const backendConfigured = BACKEND_URL !== ''

function initialMode(): DataMode {
  const stored = localStorage.getItem(MODE_KEY)
  if (stored === 'demo') return 'demo'
  if (stored === 'backend' && backendConfigured) return 'backend'
  return backendConfigured ? 'backend' : 'demo'
}

const adapters: Record<DataMode, FitnessAdapter | null> = { demo: null, backend: null }
const journals: Record<DataMode, JournalAdapter | null> = { demo: null, backend: null }

export const useModeStore = defineStore('mode', {
  state: () => ({ mode: initialMode() }),
  getters: {
    backendConfigured: () => backendConfigured,
    backendUrl: () => BACKEND_URL,
    isDemo: (state) => state.mode === 'demo',
    adapter: (state): FitnessAdapter =>
      (adapters[state.mode] ??= state.mode === 'demo' ? createDemoAdapter() : createBackendAdapter()),
    /** Manual logging uses real time, so it keeps working while the (simulated) watch is not syncing. */
    journal: (state): JournalAdapter =>
      (journals[state.mode] ??= state.mode === 'demo' ? createDemoJournal(() => clockFrom(new Date())) : createBackendJournal()),
  },
  actions: {
    setMode(mode: DataMode) {
      if (mode === 'backend' && !backendConfigured) return
      this.mode = mode
      localStorage.setItem(MODE_KEY, mode)
    },
  },
})
