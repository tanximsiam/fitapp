const NAME_KEY = 'fitapp.sample.name'

/** The name typed during setup with sample data; there is no account to keep it on. */
export const sampleProfile = {
  name(): string | null {
    try {
      return localStorage.getItem(NAME_KEY)
    } catch {
      return null
    }
  },
  save(name: string) {
    try {
      localStorage.setItem(NAME_KEY, name)
    } catch {
      // Private storage unavailable: the profile shows "Guest".
    }
  },
}
