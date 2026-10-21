import { Capacitor } from '@capacitor/core'
import { Health, type HealthPermission } from 'capacitor-health'
import type { Measurement } from '@/types/fitness'
import { platformRecords } from './normalize'
import type { HealthSource } from './types'

/**
 * Android Health Connect and Apple Health through the capacitor-health plugin (read-only).
 * What it can read in this version: daily steps and active energy (the platform's own de-duplicated totals),
 * workouts with their duration, energy, distance and heart rate, and the heart-rate readings taken during them.
 * Sleep, resting heart rate, all-day heart rate, SpO2, stress and skin temperature are not exposed by the plugin
 * and show as not available from this source.
 */

const PERMISSIONS: Record<string, HealthPermission[]> = {
  steps: ['READ_STEPS'],
  active_energy: ['READ_ACTIVE_CALORIES'],
  workouts: ['READ_WORKOUTS', 'READ_DISTANCE'],
  heart_rate: ['READ_HEART_RATE'],
}
const PROVIDES = Object.keys(PERMISSIONS) as Measurement[]

const permissionsFor = (ms: Measurement[]) => [...new Set(ms.flatMap((m) => PERMISSIONS[m] ?? []))]

/** The plugin answers [{ READ_STEPS: true }, …]. */
function grantedFrom(answer: { permissions: Record<string, boolean>[] }): Measurement[] {
  const ok = new Set(answer.permissions.flatMap((p) => Object.entries(p).filter(([, v]) => v).map(([k]) => k)))
  return PROVIDES.filter((m) => PERMISSIONS[m].every((p) => ok.has(p)))
}

export function createHealthPlatformSource(): HealthSource {
  const ios = Capacitor.getPlatform() === 'ios'
  return {
    id: ios ? 'apple-health' : 'health-connect',
    name: ios ? 'Apple Health' : 'Health Connect',
    key: ios ? 'apple-health' : 'health-connect',
    provides: PROVIDES,

    async availability() {
      if (!Capacitor.isNativePlatform()) return { available: false, reason: 'Available in the Android and iOS app, not in a browser.' }
      try {
        const { available } = await Health.isHealthAvailable()
        return available
          ? { available: true }
          : { available: false, reason: ios ? 'Apple Health is not available on this device.' : 'Health Connect is not installed or needs an update.' }
      } catch {
        return { available: false, reason: 'Could not check the health platform on this device.' }
      }
    },

    async connect() {
      // Note: iOS never reveals whether read access was denied, so a "granted" type there may simply read empty.
      return grantedFrom(await Health.requestHealthPermissions({ permissions: permissionsFor(PROVIDES) }))
    },
    async disconnect() {
      // Platform permissions belong to the system: openSettings() lets the person revoke them.
    },
    // Health platforms mix many apps and devices; the watch model is not reliably known.
    device: async () => null,

    async read(from, to, only) {
      const range = { startDate: from.toISOString(), endDate: to.toISOString() }
      const [steps, activeKcal, workouts] = await Promise.all([
        only.includes('steps') ? Health.queryAggregated({ ...range, dataType: 'steps', bucket: 'day' }) : null,
        only.includes('active_energy') ? Health.queryAggregated({ ...range, dataType: 'active-calories', bucket: 'day' }) : null,
        only.includes('workouts') || only.includes('heart_rate')
          ? Health.queryWorkouts({ ...range, includeHeartRate: only.includes('heart_rate') || only.includes('workouts'), includeRoute: false, includeSteps: false })
          : null,
      ])
      return platformRecords(
        {
          steps: steps?.aggregatedData.map((d) => ({ startDate: String(d.startDate), value: d.value })),
          activeKcal: activeKcal?.aggregatedData.map((d) => ({ startDate: String(d.startDate), value: d.value })),
          workouts: workouts?.workouts.map((w) => ({ ...w, startDate: String(w.startDate), endDate: String(w.endDate) })),
        },
        only,
      )
    },

    openSettings: () => (ios ? Health.openAppleHealthSettings() : Health.openHealthConnectSettings()),
  }
}
