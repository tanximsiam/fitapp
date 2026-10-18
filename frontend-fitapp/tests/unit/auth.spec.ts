import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { AxiosError, AxiosHeaders } from 'axios'
import { api } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

function httpError(status: number, data: unknown = {}) {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError('fail', String(status), config, null, { status, data, statusText: '', headers: {}, config })
}

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    vi.restoreAllMocks()
  })

  test('login stores the token and a normalized user', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({
      data: { data: { token: 'tok', user: { id: 7, name: 'Ana', email: 'a@x.test', created_at: null } } },
    })
    const auth = useAuthStore()

    expect(await auth.login('a@x.test', 'pw')).toBe(true)
    expect(auth.user).toEqual({ id: 7, name: 'Ana', email: 'a@x.test' })
    expect(localStorage.getItem('fitapp.token')).toBe('tok')
  })

  test('failed login surfaces the backend message', async () => {
    vi.spyOn(api, 'post').mockRejectedValue(httpError(401, { message: 'These credentials do not match our records.' }))
    const auth = useAuthStore()

    expect(await auth.login('a@x.test', 'bad')).toBe(false)
    expect(auth.error).toBe('These credentials do not match our records.')
    expect(auth.isAuthenticated).toBe(false)
  })

  test('restore drops a rejected token but keeps it when the backend is unreachable', async () => {
    localStorage.setItem('fitapp.token', 'old')
    vi.spyOn(api, 'get').mockRejectedValueOnce(httpError(401))
    await useAuthStore().restore()
    expect(localStorage.getItem('fitapp.token')).toBeNull()

    localStorage.setItem('fitapp.token', 'old')
    vi.spyOn(api, 'get').mockRejectedValueOnce(new AxiosError('Network Error', 'ERR_NETWORK'))
    const auth = useAuthStore()
    await auth.restore()
    expect(localStorage.getItem('fitapp.token')).toBe('old')
    expect(auth.error).toMatch(/Could not reach/)
  })
})
