import { ref, watch } from 'vue'

export type ThemeChoice = 'light' | 'dark' | 'system'

const KEY = 'fitapp.theme'
const media = window.matchMedia?.('(prefers-color-scheme: dark)')

function read(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'dark' || v === 'system' ? v : 'light'
  } catch {
    return 'light'
  }
}

/** Light by default; "system" follows the operating system and updates when it changes. */
const choice = ref<ThemeChoice>(read())

function apply() {
  const dark = choice.value === 'dark' || (choice.value === 'system' && !!media?.matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f0f0e' : '#fbfbfb')
}

apply()
media?.addEventListener('change', apply)
watch(choice, (v) => {
  try {
    localStorage.setItem(KEY, v)
  } catch {
    // Private mode: the choice lasts for this visit only.
  }
  apply()
})

export function useTheme() {
  return { choice }
}
