import { defineStore } from 'pinia'

export type LogKind = 'mood' | 'meal' | 'drink' | 'cycle'

export const useUiStore = defineStore('ui', {
  state: () => ({ quickLog: null as LogKind | null }),
  actions: {
    openQuickLog(kind: LogKind = 'mood') {
      this.quickLog = kind
    },
    closeQuickLog() {
      this.quickLog = null
    },
  },
})
