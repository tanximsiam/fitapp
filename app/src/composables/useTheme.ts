import { ref, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

export type ThemeChoice = 'light' | 'dark' | 'system'

const KEY = 'fitapp.theme'
const media = window.matchMedia?.('(prefers-color-scheme: dark)')

function read(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'dark' || v === 'light' ? v : 'system'
  } catch {
    return 'system'
  }
}

/** Follows the operating system unless the user picks light or dark. */
const choice = ref<ThemeChoice>(read())

function apply() {
  const dark = choice.value === 'dark' || (choice.value === 'system' && !!media?.matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f0f0e' : '#f1f2f5')
  // Status bar icons must contrast with the canvas behind them.
  if (Capacitor.isNativePlatform()) StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light }).catch(() => {})
}

apply()
media?.addEventListener('change', apply)
watch(choice, (v) => {
  try {
    localStorage.setItem(KEY, v)
  } catch {
    // Private mode: the choice lasts for this session only.
  }
  apply()
})

export function useTheme() {
  return { choice }
}
