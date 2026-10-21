import { defineStore } from 'pinia'

export type LogKind = 'mood' | 'meal' | 'drink' | 'activity' | 'cycle'
/** 'choose' shows the four log types first. */
export type QuickLogView = LogKind | 'choose'

export const useUiStore = defineStore('ui', {
  state: () => ({ quickLog: null as QuickLogView | null }),
  actions: {
    openQuickLog(kind: QuickLogView = 'choose') {
      this.quickLog = kind
    },
    closeQuickLog() {
      this.quickLog = null
    },
  },
})
