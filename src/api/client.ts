import axios from 'axios'
import { SecureStorage } from '@aparajita/capacitor-secure-storage'
import type { User } from '@/types/auth'

/** Base URL of the FitApp Laravel backend; empty when the build is demo-only. */
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URI ?? '').trim().replace(/\/+$/, '')

const TOKEN_KEY = 'fitapp.token'
const USER_KEY = 'fitapp.user'

/** In memory after load(), so the request interceptor can read it synchronously. */
let token: string | null = null

/**
 * The sign-in token and the signed-in user's profile, in the iOS Keychain or Android Keystore.
 * shortcut: in a plain browser (dev server) the plugin falls back to unencrypted localStorage; only native builds are protected.
 */
export const tokenStorage = {
  async load(): Promise<string | null> {
    token = await SecureStorage.getItem(TOKEN_KEY)
    // Builds before secure storage kept the token in localStorage: move it once.
    const legacy = localStorage.getItem(TOKEN_KEY)
    if (legacy) {
      if (!token) await tokenStorage.set(legacy)
      localStorage.removeItem(TOKEN_KEY)
    }
    return token
  },
  get: () => token,
  async set(value: string) {
    token = value
    await SecureStorage.setItem(TOKEN_KEY, value)
  },
  async clear() {
    token = null
    await Promise.all([SecureStorage.removeItem(TOKEN_KEY), SecureStorage.removeItem(USER_KEY)])
  },
  /** Last known profile, so a signed-in person can open their saved data while offline. */
  async getUser(): Promise<User | null> {
    try {
      return JSON.parse((await SecureStorage.getItem(USER_KEY)) ?? 'null')
    } catch {
      return null
    }
  },
  setUser: (user: User) => SecureStorage.setItem(USER_KEY, JSON.stringify(user)),
}

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: { Accept: 'application/json' },
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  // A request that brings its own token (ingest uploads) keeps it.
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`
  return config
})

/** Human-readable message for a failed request; never includes tokens or payloads. */
export function errorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return "Can't connect right now. Check your internet connection and try again."
    const message = (err.response.data as { message?: unknown } | undefined)?.message
    if (typeof message === 'string' && message) return message
    return `${fallback} (HTTP ${err.response.status})`
  }
  return fallback
}

/** No response at all: offline, DNS failure, server down or timed out. Safe to retry later. */
export function isNetworkError(err: unknown): boolean {
  return axios.isAxiosError(err) && !err.response
}

export function isConflict(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 409
}

export function isUnauthorized(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 401
}
