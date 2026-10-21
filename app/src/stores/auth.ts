import axios from 'axios'
import { defineStore } from 'pinia'
import * as authApi from '@/api/auth'
import { errorMessage, isNetworkError, isUnauthorized, tokenStorage } from '@/api/client'
import type { User } from '@/types/auth'

let initPromise: Promise<void> | null = null

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isLoading: false,
    error: null as string | null,
    /** First validation message per field from the last sign-up. */
    fieldErrors: {} as Record<string, string>,
  }),
  getters: {
    isAuthenticated: (state) => state.user !== null,
  },
  actions: {
    /** Restore the session from a stored token once per page load. */
    init(): Promise<void> {
      initPromise ??= this.restore()
      return initPromise
    },

    async restore() {
      if (!(await tokenStorage.load())) return
      try {
        this.user = await authApi.fetchCurrentUser()
        await tokenStorage.setUser(this.user)
      } catch (err) {
        this.user = null
        // Drop the token only when the backend rejects it. Unreachable: stay signed in with the saved profile, so cached data opens offline.
        if (isUnauthorized(err)) await tokenStorage.clear()
        else {
          this.error = errorMessage(err)
          if (isNetworkError(err)) this.user = await tokenStorage.getUser()
        }
      }
    },

    login(email: string, password: string): Promise<boolean> {
      return this.signInWith(() => authApi.login(email, password), 'Sign-in failed.')
    },

    register(input: Parameters<typeof authApi.register>[0]): Promise<boolean> {
      return this.signInWith(() => authApi.register(input), 'Could not create the account.')
    },

    loginWithGoogleCode(code: string): Promise<boolean> {
      return this.signInWith(() => authApi.exchangeGoogleCode(code), 'Google sign-in failed.')
    },

    /** Every way of signing in ends with a user and a token to keep. */
    async signInWith(request: () => Promise<{ user: User; token: string }>, fallback: string): Promise<boolean> {
      this.isLoading = true
      this.error = null
      this.fieldErrors = {}
      try {
        const { user, token } = await request()
        await Promise.all([tokenStorage.set(token), tokenStorage.setUser(user)])
        this.user = user
        return true
      } catch (err) {
        this.user = null
        this.error = errorMessage(err, fallback)
        const errors = axios.isAxiosError(err) ? (err.response?.data as { errors?: Record<string, string[]> } | undefined)?.errors : undefined
        if (errors) this.fieldErrors = Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v[0]]))
        return false
      } finally {
        this.isLoading = false
      }
    },

    async logout() {
      try {
        if (tokenStorage.get()) await authApi.logout()
      } catch {
        // The token is discarded locally either way.
      } finally {
        await tokenStorage.clear()
        this.user = null
      }
    },
  },
})
