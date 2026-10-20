const KEY = 'fitapp.onboarded'

/** Whether the welcome flow has been completed on this device. */
export const onboarding = {
  done(): boolean {
    try {
      return localStorage.getItem(KEY) === '1'
    } catch {
      return false
    }
  },
  complete() {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      // Private storage unavailable: the welcome flow shows again next launch.
    }
  },
  reset() {
    try {
      localStorage.removeItem(KEY)
    } catch {
      // Nothing stored.
    }
  },
}
