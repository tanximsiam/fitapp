import { api } from './client'
import type { User, UserPayload } from '@/types/auth'

const toUser = (raw: UserPayload): User => ({ id: raw.id, name: raw.name, email: raw.email })

export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  const res = await api.post<{ data: { user: UserPayload; token: string } }>('/login', { email, password })
  return { user: toUser(res.data.data.user), token: res.data.data.token }
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await api.get<{ data: UserPayload }>('/user')
  return toUser(res.data.data)
}

export async function logout(): Promise<void> {
  await api.post('/logout')
}
