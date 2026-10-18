import axios from 'axios'

/** Base URL of the FitApp Laravel backend; empty when the build is demo-only. */
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URI ?? '').trim().replace(/\/+$/, '')

const TOKEN_KEY = 'fitapp.token'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: { Accept: 'application/json' },
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/** Human-readable message for a failed request; never includes tokens or payloads. */
export function errorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return 'Could not reach the FitApp backend. Check that it is running and the URL is correct.'
    const message = (err.response.data as { message?: unknown } | undefined)?.message
    if (typeof message === 'string' && message) return message
    return `${fallback} (HTTP ${err.response.status})`
  }
  return fallback
}

export function isUnauthorized(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 401
}
