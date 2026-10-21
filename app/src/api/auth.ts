import { BACKEND_URL, api } from './client'
import type { User, UserPayload, Wearable } from '@/types/auth'

// Servers from before the setup screens have no flag: treat those accounts as set up.
const toUser = (raw: UserPayload): User => ({ id: raw.id, name: raw.name, email: raw.email, onboarded: raw.onboarded ?? true })

export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  const res = await api.post<{ data: { user: UserPayload; token: string } }>('/login', { email, password })
  return { user: toUser(res.data.data.user), token: res.data.data.token }
}

export interface AuthProviders {
  registration: boolean
  google: boolean
}

/** Sign-in options this server offers. */
export async function providers(): Promise<AuthProviders> {
  return (await api.get<{ data: AuthProviders }>('/auth/providers')).data.data
}

export async function register(input: { name: string; email: string; password: string; timezone: string }): Promise<{ user: User; token: string }> {
  const res = await api.post<{ data: { user: UserPayload; token: string } }>('/register', input)
  return { user: toUser(res.data.data.user), token: res.data.data.token }
}

/** Starts Google sign-in in the browser; the backend comes back to `returnTo` with ?code= or ?error=. */
export const googleSignInUrl = (returnTo: string) => `${BACKEND_URL}/api/auth/google/redirect?return=${encodeURIComponent(returnTo)}`

/** Trades the one-time code from the Google return for an app token. */
export async function exchangeGoogleCode(code: string): Promise<{ user: User; token: string }> {
  const res = await api.post<{ data: { user: UserPayload; token: string } }>('/auth/google/token', { code })
  return { user: toUser(res.data.data.user), token: res.data.data.token }
}

/** The setup screens' profile answers; marks the account as set up. */
export async function saveProfile(input: { name: string; birthDate: string | null; wearable: Wearable | null }): Promise<User> {
  const body = { name: input.name, birth_date: input.birthDate, preferences: { wearable: input.wearable }, onboarded: true }
  return toUser((await api.patch<{ data: UserPayload }>('/user', body)).data.data)
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await api.get<{ data: UserPayload }>('/user')
  return toUser(res.data.data)
}

export async function logout(): Promise<void> {
  await api.post('/logout')
}
